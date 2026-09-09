export interface ParsedProjectFile {
  path: string;
  content: string;
  language?: string;
}

export interface ParsedProjectManifest {
  name: string;
  description: string;
  files: ParsedProjectFile[];
}

/**
 * Robustly parses an AI-generated text response into a structured project manifest.
 * Handles standard JSON, Markdown code fences, trailing commas, unescaped newlines,
 * and direct regex block extraction if JSON formatting is imperfect.
 */
export function parseProjectManifest(
  rawText: string,
  defaultName = 'AI Project',
  defaultDesc = 'AI-generated interactive project'
): ParsedProjectManifest {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('No project content received from AI');
  }

  const trimmed = rawText.trim();

  // 1. Direct JSON attempt or markdown fence stripped attempt
  const cleanFence = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  try {
    const direct = JSON.parse(cleanFence);
    if (direct && Array.isArray(direct.files) && direct.files.length > 0) {
      return normalizeManifest(direct, defaultName, defaultDesc);
    }
  } catch {
    /* proceed to regex JSON match */
  }

  // 2. Extract outer JSON object with regex
  const firstBrace = cleanFence.indexOf('{');
  const lastBrace = cleanFence.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const jsonCandidate = cleanFence.slice(firstBrace, lastBrace + 1);
    try {
      const parsed = JSON.parse(jsonCandidate);
      if (parsed && Array.isArray(parsed.files) && parsed.files.length > 0) {
        return normalizeManifest(parsed, defaultName, defaultDesc);
      }
    } catch {
      // Try sanitizing common LLM JSON syntax issues
      try {
        const sanitized = jsonCandidate
          .replace(/,\s*([\]}])/g, '$1') // remove trailing commas
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, (c) =>
            c === '\n' || c === '\r' || c === '\t' ? c : ''
          );
        const parsed = JSON.parse(sanitized);
        if (parsed && Array.isArray(parsed.files) && parsed.files.length > 0) {
          return normalizeManifest(parsed, defaultName, defaultDesc);
        }
      } catch {
        /* proceed to structural regex parsing */
      }
    }
  }

  // 3. Fallback: Parse individual files from JSON-like syntax or Markdown code blocks
  const extractedFiles: ParsedProjectFile[] = [];

  // 3a. Extract individual {"path": "...", "content": "..."} blocks
  const fileBlockRegex = /\{\s*"path"\s*:\s*"([^"]+)"\s*,\s*"content"\s*:\s*"([\s\S]*?)(?="\s*\}|"\s*,\s*"language)/g;
  let fileMatch: RegExpExecArray | null;
  while ((fileMatch = fileBlockRegex.exec(cleanFence)) !== null) {
    const path = fileMatch[1].replace(/^\/+/, '');
    const content = fileMatch[2]
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
    if (path && content) {
      extractedFiles.push({ path, content });
    }
  }

  // 3b. Extract Markdown code blocks (e.g. ```html index.html ... ```) if no JSON files found
  if (extractedFiles.length === 0) {
    const codeBlockRegex = /```([a-zA-Z0-9_-]+)?(?:\s+(?:filename=)?([a-zA-Z0-9_./-]+))?\n([\s\S]*?)```/g;
    let blockMatch: RegExpExecArray | null;
    let indexCount = 0;
    while ((blockMatch = codeBlockRegex.exec(trimmed)) !== null) {
      const lang = (blockMatch[1] || 'html').toLowerCase();
      let filename = blockMatch[2] || '';
      const code = blockMatch[3]?.trim();

      if (!filename) {
        if (lang === 'html' || lang === 'htm') filename = 'index.html';
        else if (lang === 'css') filename = 'style.css';
        else if (lang === 'js' || lang === 'javascript') filename = 'app.js';
        else if (lang === 'ts' || lang === 'typescript') filename = 'app.ts';
        else if (lang === 'py' || lang === 'python') filename = 'main.py';
        else if (lang === 'json') filename = 'data.json';
        else if (lang === 'md') filename = 'README.md';
        else filename = `file_${++indexCount}.${lang}`;
      }

      if (code) {
        extractedFiles.push({ path: filename.replace(/^\/+/, ''), content: code });
      }
    }
  }

  // Extract name and description from raw text if present
  let extractedName = defaultName;
  let extractedDesc = defaultDesc;

  const nameMatch = rawText.match(/"name"\s*:\s*"([^"]+)"/);
  if (nameMatch?.[1]) extractedName = nameMatch[1];

  const descMatch = rawText.match(/"description"\s*:\s*"([^"]+)"/);
  if (descMatch?.[1]) extractedDesc = descMatch[1];

  if (extractedFiles.length > 0) {
    return {
      name: extractedName,
      description: extractedDesc,
      files: extractedFiles,
    };
  }

  throw new Error('AI output could not be parsed into a project structure. Please try again with a clear description.');
}

function normalizeManifest(
  raw: any,
  defaultName: string,
  defaultDesc: string
): ParsedProjectManifest {
  const files: ParsedProjectFile[] = (raw.files || [])
    .filter((f: any) => f && typeof f === 'object' && f.path)
    .map((f: any) => ({
      path: String(f.path).replace(/^\/+/, ''),
      content: String(f.content ?? ''),
      language: f.language ? String(f.language) : undefined,
    }));

  if (files.length === 0) {
    throw new Error('Project manifest contains no valid files');
  }

  return {
    name: String(raw.name || defaultName).trim(),
    description: String(raw.description || defaultDesc).trim(),
    files,
  };
}
