// ============================================================
// Library AI — Knowledge Universe Phase 1: Intelligent Library
// Companion chat • Summaries • Formula Intelligence • Flashcards
// Quiz Generator • Smart Notes • Multi-book comparison • Translation
// ============================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };
const sseHeaders = { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" };

function jsonResponse(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: jsonHeaders });
}

function fallbackSse(message: string) {
  const enc = new TextEncoder();
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(enc.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: message } }] })}\n\n`));
      controller.enqueue(enc.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });
  return new Response(body, { status: 200, headers: sseHeaders });
}

function friendlyError(status: number): string {
  if (status === 402) return "⚠️ KU's AI credits are exhausted right now. Please contact the admin.";
  if (status === 429) return "⚠️ KU is busy right now. Please wait a moment and try again.";
  return "⚠️ KU had trouble reaching the AI engine. Please try again.";
}

// ── Teaching modes for the Reading Companion ───────────────────────
type CompanionMode = "beginner" | "student" | "expert" | "child" | "exam";
const COMPANION_MODE_PROMPTS: Record<CompanionMode, string> = {
  beginner: "Use very simple, plain language. Avoid jargon. Define any technical word the moment you use it. Short sentences.",
  student:  "Use clear educational language appropriate for a school student. Balance explanation with the right amount of detail.",
  expert:   "Use advanced, precise terminology. Assume strong prior knowledge. Be concise and technical.",
  child:    "Explain like you're talking to a curious 8-10 year old. Use stories, fun analogies, and simple everyday examples.",
  exam:     "Focus ONLY on what's important for exams. Be concise, highlight key facts, definitions, and likely exam questions. Use bullet points.",
};

// ── Languages the AI can translate/teach in ────────────────────────
const LANG_NAMES: Record<string, string> = {
  en: "English", am: "Amharic (አማርኛ)", om: "Afaan Oromoo", ti: "Tigrinya (ትግርኛ)",
  ar: "Arabic (العربية)", fr: "French", es: "Spanish", sw: "Swahili",
};

async function callGateway(KEY: string, body: Record<string, unknown>) {
  return fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

// Extract JSON from a model response that might be wrapped in ```json fences
function extractJSON(text: string): any {
  let t = text.trim();
  t = t.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  const start = t.search(/[\[{]/);
  if (start > 0) t = t.slice(start);
  const lastBrace = Math.max(t.lastIndexOf("}"), t.lastIndexOf("]"));
  if (lastBrace !== -1) t = t.slice(0, lastBrace + 1);
  return JSON.parse(t);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const {
      action,
      messages = [],
      mode = "student",
      language = "en",
      pageText = "",
      contextText = "",
      bookTitle = "",
      subject = "",
      grade,
      scope = "page",
      summaryLevel = "5min",
      difficulty = "adaptive",
      questionTypes = ["mcq", "true_false", "fill_blank"],
      count = 5,
      notes = [],
      textA = "", textB = "", titleA = "", titleB = "",
    } = body || {};

    const KEY = req.headers.get("x-api-key") || Deno.env.get("OPENAI_API_KEY") || Deno.env.get("LOVABLE_API_KEY");
    if (!KEY) return jsonResponse({ error: "API key not configured" }, 500);

    const companionMode: CompanionMode = (COMPANION_MODE_PROMPTS as any)[mode] ? mode : "student";
    const langName = LANG_NAMES[language] || LANG_NAMES.en;
    const bookCtx = bookTitle
      ? `Book: "${bookTitle}"${subject ? ` | Subject: ${subject}` : ""}${grade ? ` | Grade: ${grade}` : ""}`
      : "";

    // ──────────────────────────────────────────────────────────────
    // ACTION: companion — page-aware Q&A chat (streaming)
    // ──────────────────────────────────────────────────────────────
    if (action === "companion") {
      let system = `You are the KU Reading Companion — an AI tutor embedded directly inside a PDF reader.
${bookCtx}
Teaching mode (${companionMode}): ${COMPANION_MODE_PROMPTS[companionMode]}
Respond in ${langName}. If the student writes in another language, still respond in ${langName} unless they explicitly ask for a different language.
Always answer using the CURRENT PAGE CONTENT below as your primary source. If the answer isn't on this page, say so and answer from general knowledge, clearly noting that.
Use Markdown formatting (headings, bold, lists). Keep answers focused and well-organized.

[CURRENT PAGE CONTENT]
---
${String(pageText).slice(0, 8000)}
---`;

      const ctx = (Array.isArray(messages) ? messages : [])
        .filter((m: any) => m?.content && typeof m.content === "string")
        .slice(-12)
        .map((m: any) => ({ role: m.role, content: m.content }));

      const upstream = await callGateway(KEY, {
        model: "gemini-3.6-flash",
        messages: [{ role: "system", content: system }, ...ctx],
        stream: true,
        temperature: 0.6,
        max_tokens: 1500,
      });
      if (!upstream.ok) return fallbackSse(friendlyError(upstream.status));
      return new Response(upstream.body, { headers: sseHeaders });
    }

    // ──────────────────────────────────────────────────────────────
    // ACTION: summary — 30s / 5min / full, page / chapter / book scope (streaming)
    // ──────────────────────────────────────────────────────────────
    if (action === "summary") {
      const levelInstr: Record<string, string> = {
        "30s":  "Write an ULTRA-short summary readable in 30 seconds: 2-3 bullet points max, just the absolute core idea.",
        "5min": "Write a 5-minute summary: key concepts, definitions, and important points organized with headings and bullet lists.",
        "full": "Write a comprehensive, well-structured summary covering ALL major points, definitions, formulas, and examples. Use ## headings.",
      };
      const scopeLabel: Record<string, string> = {
        page: "the current page", chapter: "this chapter (multiple pages)", book: "the entire book (sampled pages)",
      };
      const system = `You are the KU Reading Companion, generating a study summary.
${bookCtx}
Scope: ${scopeLabel[scope] || "the current page"}.
${levelInstr[summaryLevel] || levelInstr["5min"]}
Respond in ${langName}. Use Markdown.

[CONTENT TO SUMMARIZE]
---
${String(contextText || pageText).slice(0, 16000)}
---`;

      const upstream = await callGateway(KEY, {
        model: scope === "book" ? "gemini-3.1-pro-preview" : "gemini-3.6-flash",
        messages: [{ role: "system", content: system }, { role: "user", content: "Generate the summary now." }],
        stream: true,
        temperature: 0.5,
        max_tokens: summaryLevel === "full" ? 3000 : 1000,
      });
      if (!upstream.ok) return fallbackSse(friendlyError(upstream.status));
      return new Response(upstream.body, { headers: sseHeaders });
    }

    // ──────────────────────────────────────────────────────────────
    // ACTION: compare — multi-book reference intelligence (streaming)
    // ──────────────────────────────────────────────────────────────
    if (action === "compare") {
      const question = (messages?.[messages.length - 1]?.content) || "Compare how these two books explain this topic.";
      const system = `You are the KU Reading Companion comparing two reference books to give the student the best possible understanding.
Respond in ${langName}. Use Markdown with headings for each book, then a "## 🔄 Combined Understanding" section that merges both into one clearer explanation with an additional example.

[BOOK A: "${titleA || "Book A"}"]
---
${String(textA).slice(0, 6000)}
---

[BOOK B: "${titleB || "Book B"}"]
---
${String(textB).slice(0, 6000)}
---`;
      const upstream = await callGateway(KEY, {
        model: "gemini-3.1-pro-preview",
        messages: [{ role: "system", content: system }, { role: "user", content: question }],
        stream: true,
        temperature: 0.6,
        max_tokens: 2500,
      });
      if (!upstream.ok) return fallbackSse(friendlyError(upstream.status));
      return new Response(upstream.body, { headers: sseHeaders });
    }

    // ──────────────────────────────────────────────────────────────
    // ACTION: formula — detect formulas + explain + practice (JSON)
    // ──────────────────────────────────────────────────────────────
    if (action === "formula") {
      const system = `You are a Formula Intelligence engine for a study app.
Scan the page text below. Find every mathematical/scientific formula or equation (e.g. "F = ma", "E = mc^2", chemical equations, etc.).
For EACH formula found, return an object with:
- "formula": the formula as written
- "name": common name (e.g. "Newton's Second Law"), or "" if unknown
- "symbols": array of {"symbol": "F", "meaning": "Force (N)"}
- "explanation": 2-3 sentence plain explanation in ${langName}
- "example": a short worked example using real numbers, in ${langName}
- "practice": array of 2 practice problems as {"question": "...", "answer": "..."}, in ${langName}

Return ONLY a JSON array. If no formulas are found, return [].

[PAGE TEXT]
---
${String(pageText).slice(0, 6000)}
---`;
      const upstream = await callGateway(KEY, {
        model: "gemini-3.6-flash",
        messages: [{ role: "system", content: system }, { role: "user", content: "Find and explain the formulas." }],
        stream: false,
        temperature: 0.3,
        max_tokens: 2500,
      });
      if (!upstream.ok) return jsonResponse({ error: friendlyError(upstream.status) }, 200);
      const data = await upstream.json();
      const text = data.choices?.[0]?.message?.content || "[]";
      try {
        return jsonResponse({ formulas: extractJSON(text) });
      } catch {
        return jsonResponse({ formulas: [] });
      }
    }

    // ──────────────────────────────────────────────────────────────
    // ACTION: flashcards — auto-generate from text (JSON)
    // ──────────────────────────────────────────────────────────────
    if (action === "flashcards") {
      const diffInstr: Record<string, string> = {
        easy: "Make simple recall flashcards — basic definitions and facts.",
        medium: "Make flashcards that require understanding, not just memorization.",
        hard: "Make challenging flashcards requiring synthesis, application, or multi-step reasoning.",
        adaptive: "Make a MIX of easy, medium, and hard flashcards (roughly balanced).",
      };
      const system = `You are a Flashcard Engine. Create ${count} high-quality flashcards from the content below.
${diffInstr[difficulty] || diffInstr.adaptive}
Cover definitions, concepts, formulas, vocabulary, and likely exam questions as appropriate to the content.
Each flashcard: {"front": "question or term", "back": "answer or definition", "difficulty": "easy"|"medium"|"hard"}
Respond in ${langName}. Return ONLY a JSON array of flashcard objects, nothing else.

[CONTENT]
---
${String(contextText || pageText).slice(0, 12000)}
---`;
      const upstream = await callGateway(KEY, {
        model: "gemini-3.6-flash",
        messages: [{ role: "system", content: system }, { role: "user", content: `Generate ${count} flashcards.` }],
        stream: false,
        temperature: 0.5,
        max_tokens: 2500,
      });
      if (!upstream.ok) return jsonResponse({ error: friendlyError(upstream.status) }, 200);
      const data = await upstream.json();
      const text = data.choices?.[0]?.message?.content || "[]";
      try {
        return jsonResponse({ flashcards: extractJSON(text) });
      } catch {
        return jsonResponse({ flashcards: [], error: "Could not parse AI response" });
      }
    }

    // ──────────────────────────────────────────────────────────────
    // ACTION: quiz — generate quiz questions from text (JSON)
    // ──────────────────────────────────────────────────────────────
    if (action === "quiz") {
      const typeDescriptions: Record<string, string> = {
        mcq: '{"type":"mcq","question":"...","options":["A","B","C","D"],"answer":"A","explanation":"..."}',
        true_false: '{"type":"true_false","question":"...","answer":"true"|"false","explanation":"..."}',
        fill_blank: '{"type":"fill_blank","question":"... ___ ...","answer":"...","explanation":"..."}',
        essay: '{"type":"essay","question":"...","answer":"model answer / key points","explanation":"grading guidance"}',
        formula: '{"type":"formula","question":"a formula-based problem","answer":"numeric/symbolic answer with steps","explanation":"..."}',
      };
      const wanted = (Array.isArray(questionTypes) ? questionTypes : ["mcq"]).filter((t: string) => typeDescriptions[t]);
      const formats = (wanted.length ? wanted : ["mcq"]).map((t: string) => typeDescriptions[t]).join("\n");
      const system = `You are a Quiz Generator for ${scopeLabelOf(scope)}.
${bookCtx}
Create ${count} questions total, mixing these types as appropriate:
${formats}
Adapt difficulty to: ${difficulty}.
Respond in ${langName}. Return ONLY a JSON array of question objects (each matching one of the formats above), nothing else.

[CONTENT]
---
${String(contextText || pageText).slice(0, 12000)}
---`;
      const upstream = await callGateway(KEY, {
        model: scope === "book" ? "gemini-3.1-pro-preview" : "gemini-3.6-flash",
        messages: [{ role: "system", content: system }, { role: "user", content: `Generate ${count} questions.` }],
        stream: false,
        temperature: 0.6,
        max_tokens: 3000,
      });
      if (!upstream.ok) return jsonResponse({ error: friendlyError(upstream.status) }, 200);
      const data = await upstream.json();
      const text = data.choices?.[0]?.message?.content || "[]";
      try {
        return jsonResponse({ questions: extractJSON(text) });
      } catch {
        return jsonResponse({ questions: [], error: "Could not parse AI response" });
      }
    }

    // ──────────────────────────────────────────────────────────────
    // ACTION: notes_organize — organize/summarize notes + suggest flashcards (JSON)
    // ──────────────────────────────────────────────────────────────
    if (action === "notes_organize") {
      const notesText = (Array.isArray(notes) ? notes : [])
        .map((n: any, i: number) => `${i + 1}. [p.${n.page ?? "?"}] ${n.text || ""}`)
        .join("\n");
      const system = `You are the KU Smart Notes organizer.
${bookCtx}
The student's raw notes/highlights are below. 
1. Organize them into a clean, well-structured Markdown study summary grouped by topic (not by page order).
2. Then suggest 3-6 flashcards (front/back) based on these notes.

Respond in ${langName}. Return ONLY valid JSON: {"summary": "markdown string", "flashcards": [{"front":"...","back":"..."}]}

[RAW NOTES]
---
${notesText.slice(0, 8000)}
---`;
      const upstream = await callGateway(KEY, {
        model: "gemini-3.6-flash",
        messages: [{ role: "system", content: system }, { role: "user", content: "Organize my notes." }],
        stream: false,
        temperature: 0.5,
        max_tokens: 2500,
      });
      if (!upstream.ok) return jsonResponse({ error: friendlyError(upstream.status) }, 200);
      const data = await upstream.json();
      const text = data.choices?.[0]?.message?.content || "{}";
      try {
        return jsonResponse(extractJSON(text));
      } catch {
        return jsonResponse({ summary: text, flashcards: [] });
      }
    }

    // ──────────────────────────────────────────────────────────────
    // ACTION: learning_path — generate a beginner/intermediate/advanced
    // learning path from book/page content (JSON)
    // ──────────────────────────────────────────────────────────────
    if (action === "learning_path") {
      const system = `You are a Learning Path Planner for a study app.
${bookCtx}
Design a progressive learning path from the content below with three levels: beginner, intermediate, advanced.
Return ONLY valid JSON matching this exact shape (no extra commentary, no markdown fences):
{
  "beginner":     [{"id":"b1","order":1,"title":"...","level":"beginner","chapterId":null,"topicIds":[],"pageStart":1,"pageEnd":1,"completed":false}],
  "intermediate": [{"id":"i1","order":10,"title":"...","level":"intermediate","chapterId":null,"topicIds":[],"pageStart":1,"pageEnd":1,"completed":false}],
  "advanced":     [{"id":"a1","order":20,"title":"...","level":"advanced","chapterId":null,"topicIds":[],"pageStart":1,"pageEnd":1,"completed":false}]
}
Rules:
- 3-5 steps per level. "order" strictly increasing across the whole path (beginner < intermediate < advanced).
- Each "title" is a concrete learning objective (verb-first), written in ${langName}.
- Set pageStart/pageEnd from the source if page hints appear in the content; otherwise use 1.
- "completed" is always false.

[CONTENT]
---
${String(contextText || pageText).slice(0, 12000)}
---`;
      const upstream = await callGateway(KEY, {
        model: "gemini-3.6-flash",
        messages: [{ role: "system", content: system }, { role: "user", content: "Generate the learning path now." }],
        stream: false,
        temperature: 0.4,
        max_tokens: 2500,
      });
      if (!upstream.ok) return jsonResponse({ error: friendlyError(upstream.status) }, 200);
      const data = await upstream.json();
      const text = data.choices?.[0]?.message?.content || "{}";
      try {
        const path = extractJSON(text);
        return jsonResponse({ path });
      } catch {
        return jsonResponse({ path: { beginner: [], intermediate: [], advanced: [] }, error: "Could not parse AI response" });
      }
    }

    return jsonResponse({ error: `Unknown action: ${action}` }, 400);
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function scopeLabelOf(scope: string): string {
  if (scope === "chapter") return "this chapter";
  if (scope === "book") return "the entire book";
  return "this page";
}
