import { supabase } from "@/integrations/supabase/client";
import { generateTeachingText } from "./AIConversationService";
import { parseProjectManifest } from "@/pages/creator/projectParser";

const SYSTEM_PROJECT_INSTR = `You are AI Tutor's Project Generator. Given the user's study topic or project idea, output ONLY a valid JSON object (no markdown, no preamble) of the form:
{"name":"...","description":"...","files":[{"path":"index.html","content":"..."},{"path":"style.css","content":"..."},{"path":"app.js","content":"..."}]}
Rules:
- 3 to 8 files max.
- Use clean vanilla HTML/CSS/JS unless a specific framework is requested.
- index.html must load style.css and app.js.
- Include a README.md explaining the interactive learning app.
- ALL file content must be valid JSON-escaped strings.`;

export interface GeneratedProjectFile {
  path: string;
  content: string;
}

export interface GeneratedProjectManifest {
  name: string;
  description: string;
  files: GeneratedProjectFile[];
}

export interface GenerateProjectOptions {
  prompt: string;
  subject?: string;
  userId?: string;
  provider?: "gemini" | "chatgpt" | "claude";
  onToken?: (delta: string) => void;
  signal?: AbortSignal;
}

export async function generateProjectWithAITutor(
  opts: GenerateProjectOptions
): Promise<{ project: GeneratedProjectManifest; projectId: string; url: string }> {
  const userInstruction = `${SYSTEM_PROJECT_INSTR}\n\nProject idea / study request:\n${opts.prompt}`;

  const res = await generateTeachingText({
    userInstruction,
    subject: opts.subject,
    provider: opts.provider ?? "gemini",
    onChunk: opts.onToken,
    signal: opts.signal,
  });

  let manifest: GeneratedProjectManifest | null = null;
  const rawText = res.text || "";

  if (rawText) {
    try {
      manifest = parseProjectManifest(rawText, "AI Study Project", opts.prompt.slice(0, 150));
    } catch {
      manifest = null;
    }
  }

  if (!manifest || !manifest.files || manifest.files.length === 0) {
    throw new Error(
      res.error ||
      "AI generation unavailable or model did not return a valid project manifest. Please retry with a more specific prompt."
    );
  }

  // Save project to Creator store / local storage
  const id = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const projObj = {
    id,
    user_id: opts.userId || "guest_user",
    name: manifest.name || "AI Study Project",
    description: manifest.description || opts.prompt.slice(0, 200),
    language: "web",
    template: "ai-generated",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    const db = supabase as any;
    if (opts.userId) {
      const { data: p } = await db.from("creator_projects").insert({
        user_id: opts.userId,
        name: projObj.name,
        description: projObj.description,
        language: "web",
        template: "ai-generated",
      }).select().single();

      if (p) {
        projObj.id = p.id;
        const files = (manifest.files || []).slice(0, 12).map((f) => ({
          project_id: p.id,
          path: String(f.path).replace(/^\/+/, ""),
          content: String(f.content || ""),
          language: "plaintext",
        }));
        await db.from("creator_files").insert(files);
      }
    }
  } catch (e) {
    console.warn("Supabase insert fallback to local:", e);
  }

  try {
    const existingProjs = JSON.parse(localStorage.getItem("ku_creator_projects_local") || "[]");
    localStorage.setItem("ku_creator_projects_local", JSON.stringify([projObj, ...existingProjs.filter((x: any) => x.id !== projObj.id)]));

    const formattedFiles = (manifest.files || []).slice(0, 12).map((f, idx) => ({
      id: `f_${Date.now()}_${idx}`,
      path: String(f.path).replace(/^\/+/, ""),
      content: String(f.content || ""),
      language: "plaintext",
    }));
    localStorage.setItem(`ku_creator_files_${projObj.id}`, JSON.stringify(formattedFiles));
  } catch { /* ignore */ }

  return {
    project: manifest,
    projectId: projObj.id,
    url: `/creator/workspace/${projObj.id}`,
  };
}
