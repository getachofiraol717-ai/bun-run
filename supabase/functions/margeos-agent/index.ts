// ============================================================
// MargeOS Multi-Agent Runtime (Phase 2)
// - Routes a user task to one of 11 agent personas via Lovable AI
// - Streams or returns the agent's response
// - Supports a /memory.search action that embeds the query and
//   calls public.match_margeos_memory for semantic recall
// - Supports a /memory.embed action that backfills the embedding
//   for a stored memory entry
// ============================================================

import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = { ...cors, "Content-Type": "application/json" };
const sse  = { ...cors, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" };

const j = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: json });

// ── Agent personas ─────────────────────────────────────────────
const AGENTS: Record<string, { model: string; system: string }> = {
  coordinator: {
    model: "gemini-3.6-flash",
    system: `You are the MargeOS Coordinator. You break a user task into clear,
numbered steps and assign each step to the most appropriate specialist agent
(qwen, merge, executor, planner, verifier, memory, teacher, coding, research, admin).
Respond in concise Markdown. Always end with a short "Hand-off" line naming the next agent.`,
  },
  qwen: {
    model: "gemini-3.6-flash",
    system: `You are the Qwen-class reasoning agent inside MargeOS. You handle deep
analytical reasoning, problem decomposition, and multi-step logical inference.`,
  },
  merge: {
    model: "gemini-3.6-flash",
    system: `You are the Merge agent. You receive multiple partial answers or drafts
and synthesize them into one coherent, de-duplicated, well-structured result.`,
  },
  executor: {
    model: "gemini-3.6-flash",
    system: `You are the Executor. You translate plans into concrete actions. Output
ONLY a JSON object {"actions":[{"kind":"shell"|"fs"|"http"|"note","detail":"..."}]} —
no prose. Each action must be safe and reversible.`,
  },
  planner: {
    model: "gemini-3.6-flash",
    system: `You are the Planner. Produce a numbered Markdown plan with success criteria.`,
  },
  verifier: {
    model: "gemini-3.6-flash",
    system: `You are the Verifier. Critique the given output, list issues, and return
"verdict: pass|fail" on the last line.`,
  },
  memory: {
    model: "gemini-3.6-flash",
    system: `You are the Memory agent. Summarize the conversation into 1-3 long-term
memory entries. Output JSON: {"entries":[{"key":"...","content":"..."}]}.`,
  },
  teacher: {
    model: "gemini-3.6-flash",
    system: `You are the Teacher. Explain the topic clearly, then give a 3-question
quick check. Use friendly Markdown.`,
  },
  coding: {
    model: "gemini-3.6-flash",
    system: `You are the Coding agent. Produce production-quality TypeScript/React
code with brief inline comments. Wrap code in fenced blocks with language hints.`,
  },
  research: {
    model: "gemini-3.6-flash",
    system: `You are the Research agent. Provide a structured briefing with sources
named generically (no fabricated URLs). Cover: background, key findings, open
questions.`,
  },
  admin: {
    model: "gemini-3.6-flash",
    system: `You are the Admin agent. Respond only to administrative / housekeeping
questions about workspaces, files, tasks. Refuse anything outside MargeOS scope.`,
  },
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

async function embed(KEY: string, text: string): Promise<number[] | null> {
  const r = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { "Authorization": `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text.slice(0, 6000),
    }),
  });
  if (!r.ok) return null;
  const data = await r.json();
  return data?.data?.[0]?.embedding ?? null;
}

function friendly(status: number) {
  if (status === 402) return "⚠️ AI credits exhausted. Please contact the workspace admin.";
  if (status === 429) return "⚠️ MargeOS is rate-limited. Try again in a moment.";
  return "⚠️ MargeOS could not reach the AI engine.";
}

function fallbackSse(msg: string) {
  const enc = new TextEncoder();
  const body = new ReadableStream({
    start(c) {
      c.enqueue(enc.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: msg } }] })}\n\n`));
      c.enqueue(enc.encode("data: [DONE]\n\n"));
      c.close();
    },
  });
  return new Response(body, { status: 200, headers: sse });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const KEY = req.headers.get("x-api-key") || Deno.env.get("OPENAI_API_KEY") || Deno.env.get("LOVABLE_API_KEY");
    if (!KEY) return j({ error: "API key not configured" }, 500);

    const body = await req.json().catch(() => ({} as any));
    const action: string = body?.action ?? "agent";

    // ── Auth (used for memory ops & logging) ─────────────────────
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const svc = createClient(SUPABASE_URL, SERVICE);
    const { data: userData } = await userClient.auth.getUser();
    const user_id = userData?.user?.id ?? null;

    // ── memory.embed: backfill embedding for an entry ────────────
    if (action === "memory.embed") {
      if (!user_id) return j({ error: "unauthenticated" }, 401);
      const { id } = body;
      const { data: row } = await svc
        .from("margeos_memory_entries")
        .select("id, user_id, content")
        .eq("id", id)
        .maybeSingle();
      if (!row || row.user_id !== user_id) return j({ error: "not_found" }, 404);
      const vec = await embed(KEY, row.content);
      if (!vec) return j({ error: "embed_failed" }, 502);
      await svc.from("margeos_memory_entries").update({ embedding: vec as any }).eq("id", id);
      return j({ ok: true, dims: vec.length });
    }

    // ── memory.search: semantic recall ───────────────────────────
    if (action === "memory.search") {
      if (!user_id) return j({ error: "unauthenticated" }, 401);
      const { query, workspace_id = null, k = 8 } = body;
      if (!query) return j({ error: "missing_query" }, 400);
      const vec = await embed(KEY, String(query));
      if (!vec) return j({ error: "embed_failed" }, 502);
      const { data, error } = await userClient.rpc("match_margeos_memory", {
        query_embedding: vec as any,
        match_count: k,
        _workspace_id: workspace_id,
      });
      if (error) return j({ error: error.message }, 500);
      return j({ matches: data ?? [] });
    }

    // ── vault.embed: backfill embedding for a knowledge entry ────
    if (action === "vault.embed") {
      if (!user_id) return j({ error: "unauthenticated" }, 401);
      const { id } = body;
      const { data: row } = await svc
        .from("margeos_knowledge_entries")
        .select("id, user_id, title, content")
        .eq("id", id)
        .maybeSingle();
      if (!row || row.user_id !== user_id) return j({ error: "not_found" }, 404);
      const vec = await embed(KEY, `${row.title}\n\n${row.content}`);
      if (!vec) return j({ error: "embed_failed" }, 502);
      await svc.from("margeos_knowledge_entries").update({ embedding: vec as any }).eq("id", id);
      return j({ ok: true, dims: vec.length });
    }

    // ── vault.search: semantic recall over the knowledge vault ───
    if (action === "vault.search") {
      if (!user_id) return j({ error: "unauthenticated" }, 401);
      const { query, category = null, k = 8 } = body;
      if (!query) return j({ error: "missing_query" }, 400);
      const vec = await embed(KEY, String(query));
      if (!vec) return j({ error: "embed_failed" }, 502);
      const { data, error } = await userClient.rpc("match_margeos_knowledge", {
        query_embedding: vec as any,
        match_count: k,
        _category: category,
      });
      if (error) return j({ error: error.message }, 500);
      return j({ matches: data ?? [] });
    }

    // ── tutor.generate: lesson/quiz/exam/flashcards/roadmap ──────
    if (action === "tutor.generate") {
      if (!user_id) return j({ error: "unauthenticated" }, 401);
      const {
        kind = "lesson",
        topic = "",
        level = "high-school",
        count = 5,
        language = "English",
        save = true,
      } = body;
      if (!topic) return j({ error: "missing_topic" }, 400);

      const sysByKind: Record<string, string> = {
        lesson: `You are MargeOS Teacher. Produce a complete lesson on the topic. Return JSON only:
{"title":string,"summary":string,"sections":[{"heading":string,"content":string,"example":string}],"key_takeaways":string[]}.`,
        quiz: `You are MargeOS Teacher. Generate ${count} quiz questions on the topic. Return JSON only:
{"title":string,"questions":[{"q":string,"choices":string[],"answer_index":number,"explanation":string}]}.`,
        exam: `You are MargeOS Teacher. Generate a graded mock exam of ${count} questions on the topic with mixed difficulty. Return JSON only:
{"title":string,"duration_minutes":number,"questions":[{"q":string,"type":"mcq"|"short"|"long","choices":string[],"answer":string,"points":number}]}.`,
        flashcards: `You are MargeOS Teacher. Make ${count} flashcards on the topic. Return JSON only:
{"title":string,"cards":[{"front":string,"back":string}]}.`,
        roadmap: `You are MargeOS Teacher. Build a personalized study roadmap on the topic. Return JSON only:
{"title":string,"weeks":[{"week":number,"focus":string,"goals":string[],"resources":string[]}]}.`,
      };
      const system = sysByKind[kind] ?? sysByKind.lesson;
      const userMsg = `Topic: ${topic}\nLevel: ${level}\nLanguage: ${language}\nReturn pure JSON with no commentary.`;

      const upstream = await callGateway(KEY, {
        model: "gemini-3.6-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: userMsg },
        ],
        stream: false,
        temperature: 0.4,
        max_tokens: 2500,
      });
      if (!upstream.ok) {
        const t = await upstream.text();
        return j({ error: friendly(upstream.status), upstream: t }, 200);
      }
      const data = await upstream.json();
      const raw = data.choices?.[0]?.message?.content ?? "{}";
      let parsed: any = null;
      try {
        let s = String(raw).trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
        const start = s.search(/[\[{]/);
        if (start > 0) s = s.slice(start);
        const lastBrace = Math.max(s.lastIndexOf("}"), s.lastIndexOf("]"));
        if (lastBrace !== -1) s = s.slice(0, lastBrace + 1);
        parsed = JSON.parse(s);
      } catch { parsed = { title: topic, raw }; }

      let saved_id: string | null = null;
      if (save) {
        const { data: ins } = await svc.from("margeos_knowledge_entries").insert({
          user_id,
          category: kind,
          title: parsed?.title ?? `${kind}: ${topic}`,
          content: JSON.stringify(parsed, null, 2),
          source: "tutor.generate",
          tags: [kind, level],
          metadata: { topic, level, language },
        }).select("id").single();
        saved_id = ins?.id ?? null;
        if (saved_id) {
          const vec = await embed(KEY, `${parsed?.title ?? topic}\n\n${JSON.stringify(parsed).slice(0, 4000)}`);
          if (vec) await svc.from("margeos_knowledge_entries").update({ embedding: vec as any }).eq("id", saved_id);
        }
      }
      return j({ kind, topic, saved_id, result: parsed });
    }

    // ── agent: dispatch to a persona ─────────────────────────────
    const agent: string = (body?.agent ?? "coordinator").toLowerCase();
    const cfg = AGENTS[agent] ?? AGENTS.coordinator;
    const prompt: string = body?.prompt ?? body?.input ?? "";
    const workspace_id: string | null = body?.workspace_id ?? null;
    const task_id: string | null = body?.task_id ?? null;
    const wantStream: boolean = body?.stream !== false;

    // pull recent semantic memory for context
    let memoryContext = "";
    if (user_id && prompt) {
      try {
        const qvec = await embed(KEY, prompt);
        if (qvec) {
          const { data: matches } = await userClient.rpc("match_margeos_memory", {
            query_embedding: qvec as any,
            match_count: 5,
            _workspace_id: workspace_id,
          });
          if (Array.isArray(matches) && matches.length) {
            memoryContext = "\n\n[RELEVANT LONG-TERM MEMORY]\n" +
              matches.map((m: any) => `• (${m.scope}) ${m.key ?? ""} — ${m.content}`).join("\n");
          }
        }
      } catch { /* best-effort */ }
    }

    const messages = [
      { role: "system", content: cfg.system + memoryContext },
      { role: "user", content: prompt || "Begin." },
    ];

    if (!wantStream) {
      const upstream = await callGateway(KEY, {
        model: cfg.model, messages, stream: false, temperature: 0.5, max_tokens: 1500,
      });
      if (!upstream.ok) return j({ error: friendly(upstream.status) }, 200);
      const data = await upstream.json();
      const text = data.choices?.[0]?.message?.content ?? "";
      // log to agent_logs (best-effort)
      if (user_id) {
        await svc.from("margeos_agent_logs").insert({
          user_id, workspace_id, task_id, agent, role: "assistant",
          content: text, tokens: data.usage?.completion_tokens ?? null, metadata: { model: cfg.model },
        });
      }
      return j({ agent, text });
    }

    // streaming path
    const upstream = await callGateway(KEY, {
      model: cfg.model, messages, stream: true, temperature: 0.5, max_tokens: 1500,
    });
    if (!upstream.ok || !upstream.body) return fallbackSse(friendly(upstream.status));

    // tee the stream so we can both forward and aggregate for logging
    const [forward, capture] = upstream.body.tee();
    (async () => {
      try {
        const reader = capture.getReader();
        const dec = new TextDecoder();
        let buf = "", full = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";
          for (const line of lines) {
            const m = line.match(/^data: (.+)$/);
            if (!m || m[1] === "[DONE]") continue;
            try {
              const evt = JSON.parse(m[1]);
              full += evt?.choices?.[0]?.delta?.content ?? "";
            } catch { /* skip */ }
          }
        }
        if (user_id && full) {
          await svc.from("margeos_agent_logs").insert({
            user_id, workspace_id, task_id, agent, role: "assistant",
            content: full, tokens: null, metadata: { model: cfg.model, streamed: true },
          });
        }
      } catch { /* best-effort */ }
    })();

    return new Response(forward, { headers: sse });
  } catch (e: any) {
    return j({ error: e?.message ?? String(e) }, 500);
  }
});
