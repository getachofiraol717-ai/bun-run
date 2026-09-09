// Ingest a document: chunk text, embed via Lovable AI, store in doc_chunks.
// Body: { title: string, text: string, chatId?: string, sourceUrl?: string, pageCount?: number }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CHUNK_SIZE = 1200;   // chars
const CHUNK_OVERLAP = 150;
const MAX_CHARS = 250_000; // cap per upload to protect cost
const BATCH = 32;          // embed up to N chunks per request

function chunkText(text: string): string[] {
  const clean = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!clean) return [];
  const out: string[] = [];
  let i = 0;
  while (i < clean.length) {
    const end = Math.min(i + CHUNK_SIZE, clean.length);
    // try to break at paragraph or sentence
    let cut = end;
    if (end < clean.length) {
      const lastPara = clean.lastIndexOf("\n\n", end);
      const lastSent = clean.lastIndexOf(". ", end);
      cut = Math.max(lastPara, lastSent, i + Math.floor(CHUNK_SIZE * 0.6));
      if (cut <= i) cut = end;
    }
    out.push(clean.slice(i, cut).trim());
    i = Math.max(cut - CHUNK_OVERLAP, cut);
  }
  return out.filter(Boolean);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const API_KEY = req.headers.get("x-api-key") || Deno.env.get("OPENAI_API_KEY") || Deno.env.get("LOVABLE_API_KEY");
    if (!API_KEY) throw new Error("AI API key not configured");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const auth = req.headers.get("Authorization") || "";
    if (!auth) return new Response(JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: auth } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { title = "Untitled", text = "", chatId, sourceUrl, pageCount } = await req.json();
    if (typeof text !== "string" || text.trim().length < 20) {
      return new Response(JSON.stringify({ error: "Text too short to ingest" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const truncated = text.slice(0, MAX_CHARS);
    const chunks = chunkText(truncated);
    if (chunks.length === 0) {
      return new Response(JSON.stringify({ error: "No chunks produced" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: doc, error: docErr } = await admin.from("user_documents").insert({
      user_id: user.id, chat_id: chatId || null, title,
      source_url: sourceUrl || null, page_count: pageCount || null,
      char_count: truncated.length,
    }).select().single();
    if (docErr || !doc) throw new Error(docErr?.message || "Failed to create document");

    // Link chat → document if chatId provided
    if (chatId) {
      await admin.from("ai_chats").update({ document_id: doc.id }).eq("id", chatId).eq("user_id", user.id);
    }

    // Embed in batches
    let inserted = 0;
    for (let b = 0; b < chunks.length; b += BATCH) {
      const batch = chunks.slice(b, b + BATCH);
      const embRes = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "text-embedding-3-small", input: batch }),
      });
      if (!embRes.ok) {
        const t = await embRes.text();
        // best-effort cleanup
        await admin.from("user_documents").delete().eq("id", doc.id);
        return new Response(JSON.stringify({ error: `Embedding failed: ${t}` }),
          { status: embRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const embJson = await embRes.json();
      const rows = batch.map((content, i) => ({
        document_id: doc.id,
        user_id: user.id,
        chunk_index: b + i,
        content,
        embedding: embJson.data?.[i]?.embedding,
      })).filter(r => Array.isArray(r.embedding));
      if (rows.length) {
        const { error: insErr } = await admin.from("doc_chunks").insert(rows);
        if (insErr) {
          await admin.from("user_documents").delete().eq("id", doc.id);
          throw new Error(insErr.message);
        }
        inserted += rows.length;
      }
    }

    return new Response(JSON.stringify({
      ok: true, documentId: doc.id, chunks: inserted, chars: truncated.length,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
