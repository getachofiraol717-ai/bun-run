// Edge Function: ai-tutor-lesson
// Generates a structured lesson (subject/difficulty aware) as JSON, using standard OpenAI API.
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getCorsHeaders } from "../_shared/cors.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const MODEL = "gpt-4o-mini";

// In-memory token bucket rate limiter per IP / User
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const MAX_REQUESTS_PER_WINDOW = 30; // 30 queries per 5 minutes
const WINDOW_MS = 5 * 60 * 1000;

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  entry.count += 1;
  return true;
}

const SYSTEM = `You are Knowledge Universe's expert AI tutor. Do NOT reply like a chatbot.
Always respond with a STRICT JSON object shaped like:
{
  "title": string,
  "subject": "programming"|"mathematics"|"physics"|"chemistry"|"biology"|"history"|"geography"|"language"|"pdf"|"general",
  "difficulty": "beginner"|"intermediate"|"advanced",
  "cards": Card[]
}
Each Card is one of:
- {"type":"explanation","title"?:string,"body":string}   // markdown allowed
- {"type":"code","title"?:string,"language":string,"code":string,"explanation"?:string}
- {"type":"formula","title"?:string,"latex":string,"explanation"?:string}
- {"type":"diagram","title"?:string,"description":string,"ascii"?:string}
- {"type":"timeline","title"?:string,"events":[{"when":string,"what":string}]}
- {"type":"summary","title"?:string,"bullets":string[]}
- {"type":"practice","title"?:string,"prompt":string,"hint"?:string,"answer"?:string}
- {"type":"quiz","title"?:string,"question":string,"options":string[],"correctIndex":number,"explanation"?:string}
- {"type":"flashcard","title"?:string,"front":string,"back":string}
- {"type":"reference","title"?:string,"source":string,"quote"?:string,"url"?:string}
- {"type":"mistakes","title"?:string,"items":string[]}
- {"type":"tips","title"?:string,"items":string[]}
- {"type":"challenge","title"?:string,"prompt":string}
- {"type":"next","title"?:string,"topics":string[]}
- {"type":"progress","title"?:string,"percent":number,"note"?:string}

Rules:
- Compose 4–8 cards that TEACH, not just answer. Always include an "explanation" card first, then subject-specific cards, ending with a "quiz" and a "next" card.
- Programming → include a "code" card. Math/Physics → include a "formula" card. History → include a "timeline". Biology/Chemistry → include a "diagram".
- Adapt depth to the difficulty and (if provided) student's grade.
- Return ONLY the JSON object. No markdown fences, no prose outside JSON.`;

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Rate limiting check by IP or Auth header
  const clientIdentifier = req.headers.get("x-forwarded-for") || req.headers.get("authorization") || "anonymous";
  if (!checkRateLimit(clientIdentifier)) {
    return new Response(JSON.stringify({ error: "rate_limited", message: "Too many AI requests. Please wait a few minutes." }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const effectiveKey = req.headers.get("x-api-key") || OPENAI_API_KEY;
  if (!effectiveKey) {
    return new Response(JSON.stringify({ error: "OPENAI_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  let body: any;
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const question = String(body?.question || "").trim();
  if (!question) {
    return new Response(JSON.stringify({ error: "question required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const subject = String(body?.subject || "general");
  const difficulty = String(body?.difficulty || "intermediate");
  const context = body?.context || {};
  const history: Array<{ role: string; content: string }> = Array.isArray(body?.history) ? body.history.slice(-8) : [];

  const userPrompt = [
    `Subject: ${subject}`,
    `Difficulty: ${difficulty}`,
    context.grade ? `Student grade: ${context.grade}` : "",
    context.language ? `Preferred language: ${context.language}` : "",
    context.activePdfTitle ? `Active document: ${context.activePdfTitle}` : "",
    "",
    `Question: ${question}`,
  ].filter(Boolean).join("\n");

  const messages = [
    { role: "system", content: SYSTEM },
    ...history.map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content })),
    { role: "user", content: userPrompt },
  ];

  try {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${effectiveKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        response_format: { type: "json_object" },
      }),
    });
    if (!resp.ok) {
      const text = await resp.text();
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: "rate_limited", detail: text }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (resp.status === 402) {
        return new Response(JSON.stringify({ error: "credits_exhausted", detail: text }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "gateway_error", status: resp.status, detail: text }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content;
    let parsed: any;
    try { parsed = typeof content === "string" ? JSON.parse(content) : content; }
    catch {
      return new Response(JSON.stringify({ error: "model_returned_invalid_json", raw: content }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lesson = {
      id: crypto.randomUUID(),
      title: String(parsed?.title || "Lesson"),
      subject: String(parsed?.subject || subject),
      difficulty: String(parsed?.difficulty || difficulty),
      cards: Array.isArray(parsed?.cards) ? parsed.cards : [],
      createdAt: Date.now(),
    };
    return new Response(JSON.stringify({ lesson }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "unexpected", detail: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
