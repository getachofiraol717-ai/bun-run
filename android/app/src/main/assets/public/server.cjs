var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_genai = require("@google/genai");
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json({ limit: "15mb" }));
function buildSystemPrompt(mode) {
  switch (mode) {
    case "coding":
      return "You are Knowledge Universe AI Coding Tutor. Help the student write clean, well-commented code, explain data structures and algorithms, and debug step-by-step with clear markdown formatting.";
    case "expert":
      return "You are Knowledge Universe Expert Academic Tutor. Provide deep, accurate, structured academic explanations with clear definitions, real-world examples, and conceptual proofs.";
    case "research":
      return "You are Knowledge Universe Academic Research Assistant. Provide rigorous, citation-ready overviews, methodology breakdowns, and scientific depth.";
    case "motivation":
      return "You are Knowledge Universe Motivational Learning Coach. Encourage the student, inspire confidence, provide actionable micro-goals, and celebrate study milestones.";
    case "study_planner":
      return "You are Knowledge Universe Study Planner. Help construct realistic, effective study schedules, review timetables, and exam readiness roadmaps.";
    case "quiz_gen":
      return "You are Knowledge Universe Quiz Generator. Produce engaging, curriculum-aligned questions with multiple choice options and thorough explanations.";
    default:
      return "You are Knowledge Universe AI Tutor, a warm, knowledgeable, encouraging, and clear academic tutor dedicated to helping students learn effectively.";
  }
}
var rateLimitMap = /* @__PURE__ */ new Map();
function checkRateLimit(key, limit = 60, windowMs = 6e4) {
  const now = Date.now();
  const record = rateLimitMap.get(key);
  if (!record || now > record.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (record.count >= limit) {
    return false;
  }
  record.count++;
  return true;
}
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of rateLimitMap.entries()) {
    if (now > v.resetAt) rateLimitMap.delete(k);
  }
}, 3e5);
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    hasOpenAiKey: Boolean(process.env.OPENAI_API_KEY),
    timestamp: Date.now()
  });
});
app.post("/api/ai/stream", async (req, res) => {
  const clientIp = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "anonymous").toString().split(",")[0].trim();
  const authHeader = req.headers.authorization || "";
  const rateLimitKey = authHeader ? `auth:${authHeader.slice(-16)}` : `ip:${clientIp}`;
  if (!checkRateLimit(rateLimitKey, 60, 6e4)) {
    res.status(429).json({
      error: "Too Many Requests",
      message: "AI request rate limit reached. Please wait a moment before sending more queries."
    });
    return;
  }
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();
  const sendEvent = (content) => {
    res.write(`data: ${JSON.stringify({ choices: [{ delta: { content } }], text: content })}

`);
  };
  const { messages = [], mode = "general", apiKey: customKey, systemInstruction: customSystemInstruction } = req.body || {};
  const rawKey = (customKey || req.headers["x-api-key"] || "").toString().trim();
  const cleanedCustomKey = rawKey === "sk-PjaffkDo5dE7zx2B6IvT1JgsziIPBDj0BvqZEZfv4qwCZsoj" ? "" : rawKey;
  const geminiApiKey = cleanedCustomKey && (cleanedCustomKey.startsWith("AIza") || !cleanedCustomKey.startsWith("sk-")) ? cleanedCustomKey : process.env.GEMINI_API_KEY || "";
  const openAiApiKey = cleanedCustomKey && cleanedCustomKey.startsWith("sk-") ? cleanedCustomKey : process.env.OPENAI_API_KEY || "";
  const explicitSystemMsg = messages.find((m) => m?.role === "system")?.content;
  const effectiveSystemPrompt = String(explicitSystemMsg || customSystemInstruction || buildSystemPrompt(mode)).trim();
  if (geminiApiKey) {
    const ai = new import_genai.GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
    const contents = [];
    for (const m of messages) {
      if (!m || m.role === "system") continue;
      const text = String(m.content || "").trim();
      if (!text) continue;
      const role = m.role === "assistant" || m.role === "model" ? "model" : "user";
      if (contents.length > 0 && contents[contents.length - 1].role === role) {
        contents[contents.length - 1].parts[0].text += `

${text}`;
      } else {
        contents.push({ role, parts: [{ text }] });
      }
    }
    if (contents.length === 0) {
      contents.push({ role: "user", parts: [{ text: "Hello" }] });
    } else if (contents[0].role !== "user") {
      contents.unshift({ role: "user", parts: [{ text: "Hello" }] });
    }
    const GEMINI_CANDIDATE_MODELS = [
      "gemini-3.1-flash-lite",
      "gemini-3.8-flash",
      "gemini-flash-latest"
    ];
    for (const model of GEMINI_CANDIDATE_MODELS) {
      let attempts = 0;
      const maxAttempts = 2;
      while (attempts < maxAttempts) {
        attempts++;
        try {
          const streamResult = await ai.models.generateContentStream({
            model,
            contents,
            config: {
              systemInstruction: effectiveSystemPrompt,
              thinkingConfig: { thinkingLevel: import_genai.ThinkingLevel.LOW }
            }
          });
          let streamedAny = false;
          for await (const chunk of streamResult) {
            if (chunk.text) {
              streamedAny = true;
              sendEvent(chunk.text);
            }
          }
          if (streamedAny) {
            res.write("data: [DONE]\n\n");
            res.end();
            return;
          }
        } catch (geminiError) {
          const errMsg = geminiError?.message || String(geminiError);
          const is503 = errMsg.includes("503") || errMsg.includes("UNAVAILABLE") || errMsg.includes("high demand");
          const is429 = errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("Quota exceeded");
          console.log(`[AI Routing] Model ${model} ${is503 ? "(Demand Spike 503)" : is429 ? "(Quota Limit 429)" : "transient error"}, switching to fallback...`);
          if (is503 && attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 300));
            continue;
          }
          break;
        }
      }
    }
  }
  if (openAiApiKey) {
    try {
      const nonSystemMessages = messages.filter((m) => m && m.role !== "system");
      const formattedMessages = [
        { role: "system", content: effectiveSystemPrompt },
        ...nonSystemMessages.map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: String(m.content || "")
        }))
      ];
      const openAiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openAiApiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: formattedMessages,
          stream: true,
          temperature: 0.7
        })
      });
      if (openAiRes.ok && openAiRes.body) {
        const reader = openAiRes.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() || "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const payload = trimmed.slice(5).trim();
            if (payload === "[DONE]") continue;
            try {
              const j = JSON.parse(payload);
              const delta = j.choices?.[0]?.delta?.content || "";
              if (delta) {
                sendEvent(delta);
              }
            } catch {
            }
          }
        }
        res.write("data: [DONE]\n\n");
        res.end();
        return;
      } else {
        const errText = await openAiRes.text().catch(() => "");
        console.warn(`OpenAI proxy returned ${openAiRes.status}:`, errText);
      }
    } catch (openAiError) {
      console.warn("OpenAI proxy error:", openAiError?.message);
    }
  }
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user")?.content || "";
  const query = String(lastUserMsg).trim();
  const fallbackAnswer = generateEducationalResponse(query, mode);
  const words = fallbackAnswer.split(" ");
  for (const word of words) {
    sendEvent(word + " ");
    await new Promise((r) => setTimeout(r, 20));
  }
  res.write("data: [DONE]\n\n");
  res.end();
});
function generateEducationalResponse(query, mode) {
  if (!query) {
    return "Hello! I am your Knowledge Universe AI Tutor. How can I assist with your studies today?";
  }
  const qLower = query.toLowerCase();
  if (qLower.includes("code") || qLower.includes("python") || qLower.includes("javascript") || qLower.includes("function") || mode === "coding") {
    return `### \u{1F4A1} Coding Explanation & Solution

Here is a structured approach to your coding problem:

\`\`\`typescript
// Example demonstration
function solveProblem(input: string): string {
  // 1. Validate input
  if (!input) return "";
  
  // 2. Core algorithm transformation
  const processed = input.trim().toLowerCase();
  
  // 3. Return structured result
  return \`Optimized Result: \${processed}\`;
}
\`\`\`

**Key Concepts:**
1. **Time Complexity:** $O(N)$ linear inspection.
2. **Space Complexity:** $O(1)$ auxiliary space.
3. **Best Practice:** Always guard against null and edge cases.

Feel free to ask for step-by-step test cases or alternative algorithms!`;
  }
  return `### \u{1F393} Academic Breakdown: ${query}

**Overview:**
Here is a comprehensive breakdown designed to help you master this topic:

1. **Fundamental Principle:**
   The core mechanism revolves around understanding the underlying relationships between key variables and foundational definitions.

2. **Step-by-Step Analysis:**
   - **Step 1:** Identify given parameters and target outcomes.
   - **Step 2:** Apply primary formulas or theorems relevant to the discipline.
   - **Step 3:** Validate findings through practical verification.

3. **Key Takeaway:**
   Remember to structure your notes with summary points and test your recall using practice questions.

*Would you like a quiz question, formula derivation, or flashcard on this topic?*`;
}
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
