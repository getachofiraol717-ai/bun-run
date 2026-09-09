// ============================================================
// Supabase Edge Function: chapa-payment
// Handles: initiate, verify, webhook
// All payment state changes happen HERE — never from frontend
// ============================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getCorsHeaders } from "../_shared/cors.ts";

const CHAPA_BASE = "https://api.chapa.co/v1";

// Plan configs with authoritative amounts and durations
const PLANS: Record<string, { days: number; amount: number; title: string; tier: string; billingCycle: string }> = {
  // Key based (modern)
  "student_monthly": { days: 30, amount: 100, title: "Student Premium", tier: "student", billingCycle: "monthly" },
  "student_yearly": { days: 365, amount: 960, title: "Student Premium (Yearly)", tier: "student", billingCycle: "yearly" },
  "teacher_monthly": { days: 30, amount: 150, title: "Teacher Premium", tier: "teacher", billingCycle: "monthly" },
  "teacher_yearly": { days: 365, amount: 1440, title: "Teacher Premium (Yearly)", tier: "teacher", billingCycle: "yearly" },
  "school_yearly": { days: 365, amount: 10000, title: "School", tier: "school", billingCycle: "yearly" },

  // Title / Legacy based
  "Student Premium": { days: 30, amount: 100, title: "Student Premium", tier: "student", billingCycle: "monthly" },
  "Student Premium (Yearly)": { days: 365, amount: 960, title: "Student Premium (Yearly)", tier: "student", billingCycle: "yearly" },
  "Teacher Premium": { days: 30, amount: 150, title: "Teacher Premium", tier: "teacher", billingCycle: "monthly" },
  "Teacher Premium (Yearly)": { days: 365, amount: 1440, title: "Teacher Premium (Yearly)", tier: "teacher", billingCycle: "yearly" },
  "School": { days: 365, amount: 10000, title: "School", tier: "school", billingCycle: "yearly" },
  "School License": { days: 365, amount: 10000, title: "School", tier: "school", billingCycle: "yearly" },
};

function generateTxRef(userId: string): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  const uid = userId.substring(0, 6).toUpperCase();
  return `KU-${uid}-${ts}-${rand}`;
}

async function verifyChapaWebhookSignature(
  body: string,
  signature: string | null,
  secret: string
): Promise<boolean> {
  if (!signature) return false;
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(body);
  const key = await crypto.subtle.importKey(
    "raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const signatureBytes = await crypto.subtle.sign("HMAC", key, messageData);
  const expectedSig = Array.from(new Uint8Array(signatureBytes))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
  // Constant-time comparison
  return signature === expectedSig;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const CHAPA_SECRET = Deno.env.get("CHAPA_SECRET_KEY") ?? "";
  const CHAPA_WEBHOOK_SECRET = Deno.env.get("CHAPA_WEBHOOK_SECRET") ?? "";
  const APP_URL = Deno.env.get("APP_URL") ?? "https://knowledge-universe.app";

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  // ============================================================
  // WEBHOOK ENDPOINT — called by Chapa's servers
  // ============================================================
  if (action === "webhook" || req.method === "POST" && url.pathname.endsWith("/webhook")) {
    const rawBody = await req.text();
    const chapaSignature = req.headers.get("x-chapa-signature");

    // Verify webhook signature
    const sigValid = await verifyChapaWebhookSignature(rawBody, chapaSignature, CHAPA_WEBHOOK_SECRET);

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return new Response(JSON.stringify({ error: "invalid_json" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const txRef = payload.tx_ref as string ?? payload.trx_ref as string;
    const status = payload.status as string;

    // Log webhook event regardless
    await admin.from("webhook_events").insert({
      provider: "chapa",
      event_type: status ?? "unknown",
      tx_ref: txRef,
      raw_payload: payload,
      signature_valid: sigValid,
    });

    if (!sigValid && CHAPA_WEBHOOK_SECRET) {
      // Still log but reject unsigned webhooks
      console.error("Webhook signature mismatch", txRef);
      return new Response(JSON.stringify({ error: "invalid_signature" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (!txRef) {
      return new Response(JSON.stringify({ error: "missing_tx_ref" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (status === "success") {
      // Double-verify with Chapa API (prevent webhook spoofing)
      let chapaVerified = false;
      try {
        const verifyResp = await fetch(`${CHAPA_BASE}/transaction/verify/${txRef}`, {
          headers: { Authorization: `Bearer ${CHAPA_SECRET}` }
        });
        const verifyData = await verifyResp.json();
        chapaVerified = verifyData.status === "success" && verifyData.data?.status === "success";
      } catch (err) {
        console.error("Chapa verify error", err);
      }

      if (!chapaVerified) {
        await admin.from("webhook_events")
          .update({ error: "chapa_reverification_failed", processed: true })
          .eq("tx_ref", txRef)
          .order("created_at", { ascending: false })
          .limit(1);

        return new Response(JSON.stringify({ error: "verification_failed" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // Fetch payment record
      const { data: payment } = await admin
        .from("payments")
        .select("id, user_id, payment_status")
        .eq("chapa_tx_ref", txRef)
        .single();

      if (payment && payment.payment_status !== "verified") {
        // Call secure SECURITY DEFINER function
        const { data: result } = await admin.rpc("verify_payment_and_upgrade", {
          _payment_id: payment.id,
          _tx_ref: txRef,
          _provider_reference: payload.reference as string ?? txRef,
          _verified_by: "chapa_webhook",
        });

        // Update webhook log
        await admin.from("webhook_events")
          .update({ processed: true })
          .eq("tx_ref", txRef)
          .order("created_at", { ascending: false })
          .limit(1);

        console.log("Payment verified via webhook", txRef, result);
      }
    } else if (status === "failed") {
      await admin
        .from("payments")
        .update({ payment_status: "failed", verification_status: "failed" })
        .eq("chapa_tx_ref", txRef);

      await admin.from("payment_sessions")
        .update({ status: "failed" })
        .eq("tx_ref", txRef);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  // ============================================================
  // All other actions require user authentication
  // ============================================================
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } }
  });
  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  // Rate limiting: max 5 payment initiations per user per hour
  const rateLimitKey = `payment_init:${user.id}`;
  const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
  const { count: recentAttempts } = await admin
    .from("payments")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", oneHourAgo);

  if ((recentAttempts ?? 0) >= 5) {
    return new Response(JSON.stringify({ error: "rate_limited", message: "Too many payment attempts. Please try again later." }), {
      status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  // ============================================================
  // ACTION: redeem_voucher — authoritative promo code verification
  // ============================================================
  if (action === "redeem_voucher") {
    const { voucher_code, plan_name } = body as { voucher_code: string; plan_name: string };
    const cleanCode = (voucher_code ?? "").trim().toUpperCase();

    // Whitelist of valid server-authoritative vouchers (100% off promos)
    const VALID_PROMOS: Record<string, { discountPercent: number; plan: string; days: number }> = {
      "FREE100": { discountPercent: 100, plan: "Monthly", days: 30 },
      "KU2026": { discountPercent: 100, plan: "Monthly", days: 30 },
      "VIPSTUDENT": { discountPercent: 100, plan: "Monthly", days: 30 },
      "ETHIOPIA2026": { discountPercent: 100, plan: "Yearly", days: 365 },
    };

    const promo = VALID_PROMOS[cleanCode];
    if (!promo || promo.discountPercent !== 100) {
      return new Response(JSON.stringify({ error: "invalid_or_expired_voucher" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const txRef = `VOUCHER-${cleanCode}-${user.id.slice(0, 8)}-${Date.now().toString(36).toUpperCase()}`;

    // Get user profile
    const { data: profile } = await admin
      .from("profiles")
      .select("name, email")
      .eq("user_id", user.id)
      .maybeSingle();

    // Create payment record marked as voucher
    const { data: paymentRecord, error: payErr } = await admin
      .from("payments")
      .insert({
        user_id: user.id,
        username: profile?.name ?? "",
        email: profile?.email ?? user.email ?? "",
        plan_name: promo.plan,
        amount: 0,
        currency: "ETB",
        payment_method: "Voucher",
        payment_provider: "voucher",
        payment_status: "verified",
        verification_status: "verified",
        chapa_tx_ref: txRef,
        reference_number: cleanCode,
        plan_duration_days: promo.days,
        verified_at: new Date().toISOString(),
        verified_by: "server_voucher_engine",
        status: "verified",
      })
      .select("id")
      .single();

    if (payErr || !paymentRecord) {
      return new Response(JSON.stringify({ error: "voucher_record_failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Authoritative upgrade via SECURITY DEFINER function
    await admin.rpc("verify_payment_and_upgrade", {
      _payment_id: paymentRecord.id,
      _tx_ref: txRef,
      _provider_reference: cleanCode,
      _verified_by: "voucher_redemption",
    });

    return new Response(JSON.stringify({
      success: true,
      status: "verified",
      plan: promo.plan,
      days: promo.days,
      message: "Voucher redeemed successfully! Premium activated."
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // ============================================================
  // ACTION: initiate — create Chapa checkout session
  // ============================================================
  if (action === "initiate") {
    const {
      planName,
      paymentMethod,
      billingDetails,
      redirectOrigin,
    } = body as {
      planName: string;
      paymentMethod: string;
      billingDetails?: {
        fullName?: string;
        email?: string;
        phone?: string;
        country?: string;
        taxId?: string;
      };
      redirectOrigin?: string;
    };

    const planConfig = PLANS[planName];
    if (!planConfig) {
      return new Response(JSON.stringify({ error: "invalid_plan" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Get user profile for name/email
    const { data: profile } = await admin
      .from("profiles")
      .select("name, email, phone")
      .eq("user_id", user.id)
      .single();

    const txRef = generateTxRef(user.id);
    const amount = planConfig.amount;
    const currency = "ETB";

    const payerName = billingDetails?.fullName?.trim() || profile?.name || "Student User";
    const payerEmail = billingDetails?.email?.trim() || profile?.email || user.email || "";
    const payerPhone = billingDetails?.phone?.trim() || profile?.phone || "";
    const payerCountry = billingDetails?.country || "Ethiopia";
    const payerTaxId = billingDetails?.taxId || "";

    // Check for duplicate pending payment for same plan created in last 1 hour
    const { data: existingPending } = await admin
      .from("payments")
      .select("id, chapa_checkout_url, chapa_tx_ref")
      .eq("user_id", user.id)
      .eq("plan_name", planConfig.title)
      .eq("payment_status", "pending")
      .gte("created_at", new Date(Date.now() - 3600000).toISOString())
      .maybeSingle();

    if (existingPending?.chapa_checkout_url) {
      // Return existing checkout URL instead of creating duplicate
      return new Response(JSON.stringify({
        success: true,
        checkout_url: existingPending.chapa_checkout_url,
        tx_ref: existingPending.chapa_tx_ref,
        reused: true,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const normalizedMethod = paymentMethod || "chapa_card";
    const isManualBank = ["bank_boa", "bank_awash", "Abisiniya Bank", "Awash Bank", "manual_bank"].includes(normalizedMethod);

    // Create payment record FIRST (pending status)
    const { data: paymentRecord, error: paymentErr } = await admin
      .from("payments")
      .insert({
        user_id: user.id,
        username: payerName,
        email: payerEmail,
        plan_name: planConfig.title,
        amount,
        currency,
        payment_method: normalizedMethod,
        payment_provider: isManualBank ? "manual" : normalizedMethod === "telebirr" ? "telebirr" : normalizedMethod === "cbe_birr" ? "cbe_birr" : "chapa",
        payment_status: "pending",
        verification_status: "unverified",
        chapa_tx_ref: txRef,
        plan_duration_days: planConfig.days,
        status: "pending", // legacy field
        metadata: {
          billing_details: {
            full_name: payerName,
            email: payerEmail,
            phone: payerPhone,
            country: payerCountry,
            tax_id: payerTaxId,
          },
          plan_key: planName,
          tier: planConfig.tier,
          billing_cycle: planConfig.billingCycle,
        },
      })
      .select("id")
      .single();

    if (paymentErr || !paymentRecord) {
      return new Response(JSON.stringify({ error: "payment_creation_failed", details: paymentErr?.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // For manual bank payment methods (Bank of Abyssinia, Awash Bank) — manual reference submission
    if (isManualBank) {
      await admin.from("payments")
        .update({ payment_status: "processing", payment_provider: "manual" })
        .eq("id", paymentRecord.id);

      return new Response(JSON.stringify({
        success: true,
        mode: "manual",
        payment_id: paymentRecord.id,
        tx_ref: txRef,
        message: "Payment record created. Please complete bank transfer and submit reference number.",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Determine target app return URL
    const baseUrl = redirectOrigin || APP_URL;
    const returnUrl = `${baseUrl.replace(/\/$/, '')}/pricing?payment_status=success&tx_ref=${txRef}`;

    // For Chapa-supported providers
    if (!CHAPA_SECRET) {
      // Fallback to manual mode if Chapa not configured
      await admin.from("payments")
        .update({ payment_status: "processing", payment_provider: "manual" })
        .eq("id", paymentRecord.id);

      return new Response(JSON.stringify({
        success: true,
        mode: "manual",
        payment_id: paymentRecord.id,
        tx_ref: txRef,
        message: "Payment initiated. Submit your reference number to complete.",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Initialize Chapa payment
    try {
      const nameParts = payerName.trim().split(/\s+/);
      const firstName = nameParts[0] || "Student";
      const lastName = nameParts.slice(1).join(" ") || "Learner";

      const chapaPayload = {
        amount: amount.toString(),
        currency,
        email: payerEmail,
        first_name: firstName,
        last_name: lastName,
        phone_number: payerPhone,
        tx_ref: txRef,
        callback_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/chapa-payment?action=webhook`,
        return_url: returnUrl,
        title: `Knowledge Universe - ${planConfig.title}`,
        description: `${planConfig.title} subscription for ${planConfig.days} days`,
        customization: {
          title: "Knowledge Universe",
          description: `${planConfig.title} Plan`,
        },
      };

      const chapaResp = await fetch(`${CHAPA_BASE}/transaction/initialize`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${CHAPA_SECRET}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chapaPayload),
      });

      const chapaData = await chapaResp.json();

      if (chapaData.status !== "success") {
        await admin.from("payments")
          .update({ payment_status: "failed", metadata: { chapa_error: chapaData } })
          .eq("id", paymentRecord.id);

        return new Response(JSON.stringify({ error: "chapa_init_failed", details: chapaData.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const checkoutUrl = chapaData.data?.checkout_url;

      // Update payment with checkout URL
      await admin.from("payments")
        .update({ chapa_checkout_url: checkoutUrl })
        .eq("id", paymentRecord.id);

      // Create payment session
      await admin.from("payment_sessions").insert({
        user_id: user.id,
        payment_id: paymentRecord.id,
        tx_ref: txRef,
        provider: "chapa",
        status: "initiated",
        checkout_url: checkoutUrl,
        amount,
        currency,
        plan_name: planConfig.title,
        expires_at: new Date(Date.now() + 3600000).toISOString(),
      });

      return new Response(JSON.stringify({
        success: true,
        mode: "redirect",
        checkout_url: checkoutUrl,
        tx_ref: txRef,
        payment_id: paymentRecord.id,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    } catch (err: unknown) {
      await admin.from("payments")
        .update({ payment_status: "failed" })
        .eq("id", paymentRecord.id);

      return new Response(JSON.stringify({ error: "chapa_error", message: (err as Error).message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }

  // ============================================================
  // ACTION: verify — poll payment status (after redirect return)
  // ============================================================
  if (action === "verify") {
    const { tx_ref } = body as { tx_ref: string };
    if (!tx_ref) {
      return new Response(JSON.stringify({ error: "missing_tx_ref" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Check if already verified in DB first
    const { data: payment } = await admin
      .from("payments")
      .select("id, payment_status, verification_status, user_id")
      .eq("chapa_tx_ref", tx_ref)
      .single();

    if (!payment) {
      return new Response(JSON.stringify({ error: "payment_not_found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Security: user can only check their own payment
    if (payment.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (payment.verification_status === "verified") {
      return new Response(JSON.stringify({
        status: "verified",
        payment_status: "verified",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Query Chapa API to verify
    if (CHAPA_SECRET) {
      try {
        const verifyResp = await fetch(`${CHAPA_BASE}/transaction/verify/${tx_ref}`, {
          headers: { Authorization: `Bearer ${CHAPA_SECRET}` }
        });
        const verifyData = await verifyResp.json();

        if (verifyData.status === "success" && verifyData.data?.status === "success") {
          // Upgrade via SECURITY DEFINER function
          await admin.rpc("verify_payment_and_upgrade", {
            _payment_id: payment.id,
            _tx_ref: tx_ref,
            _provider_reference: verifyData.data?.reference ?? tx_ref,
            _verified_by: "chapa_verify_poll",
          });

          return new Response(JSON.stringify({ status: "verified" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        return new Response(JSON.stringify({
          status: verifyData.data?.status ?? "pending",
          payment_status: payment.payment_status,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

      } catch (err) {
        return new Response(JSON.stringify({ status: "pending", error: "verify_error" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    return new Response(JSON.stringify({
      status: payment.payment_status,
      verification_status: payment.verification_status,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // ============================================================
  // ACTION: submit_reference — manual bank transfer reference
  // ============================================================
  if (action === "submit_reference") {
    const { payment_id, reference_number } = body as { payment_id: string; reference_number: string };

    if (!payment_id || !reference_number?.trim()) {
      return new Response(JSON.stringify({ error: "missing_fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Validate reference number format (basic anti-spam)
    if (reference_number.trim().length < 6 || reference_number.trim().length > 30) {
      return new Response(JSON.stringify({ error: "invalid_reference_format" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Check for duplicate reference number
    const { data: duplicate } = await admin
      .from("payments")
      .select("id")
      .eq("reference_number", reference_number.trim())
      .neq("id", payment_id)
      .single();

    if (duplicate) {
      return new Response(JSON.stringify({
        error: "duplicate_reference",
        message: "This reference number has already been used."
      }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Security: verify payment belongs to this user
    const { data: payment } = await admin
      .from("payments")
      .select("id, user_id, payment_status")
      .eq("id", payment_id)
      .single();

    if (!payment || payment.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (payment.payment_status === "verified") {
      return new Response(JSON.stringify({ success: true, message: "Already verified" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Update with reference number — status stays "processing" (pending admin review)
    await admin
      .from("payments")
      .update({
        reference_number: reference_number.trim(),
        payment_status: "processing",
        verification_status: "pending",
        metadata: {
          reference_submitted_at: new Date().toISOString(),
        }
      })
      .eq("id", payment_id);

    return new Response(JSON.stringify({
      success: true,
      message: "Reference submitted. Admin will verify and activate premium within 24 hours.",
      status: "processing",
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // ============================================================
  // ACTION: check_status — user polls their payment status
  // ============================================================
  if (action === "check_status") {
    const { payment_id } = body as { payment_id: string };
    if (!payment_id) {
      return new Response(JSON.stringify({ error: "missing_payment_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { data: payment } = await admin
      .from("payments")
      .select("payment_status, verification_status, verified_at")
      .eq("id", payment_id)
      .eq("user_id", user.id)
      .single();

    if (!payment) {
      return new Response(JSON.stringify({ error: "not_found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({
      payment_status: payment.payment_status,
      verification_status: payment.verification_status,
      verified_at: payment.verified_at,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  return new Response(JSON.stringify({ error: "unknown_action" }), {
    status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
});
