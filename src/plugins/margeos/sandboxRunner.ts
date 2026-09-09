// Real sandboxed JavaScript execution for MargeOS.
// Lovable runs in the browser, so an OS process sandbox is impossible — instead
// user code runs inside a dedicated Web Worker: a separate thread with no DOM
// access, created from a Blob URL, and hard-killed via terminate() on timeout.
// This is genuine isolation + a real resource limit, not a simulated console.

/** Stringify a value for log/result display. Shared with the worker (below). */
export function serializeValue(v: unknown): string {
  try {
    if (typeof v === "string") return v;
    if (v === undefined) return "undefined";
    if (v === null) return "null";
    if (v instanceof Error) return `${v.name}: ${v.message}`;
    if (typeof v === "function") return v.toString();
    const json = JSON.stringify(v);
    return json ?? String(v);
  } catch {
    return String(v);
  }
}

// The worker reuses the exact serializeValue above by injecting its source, so
// log formatting is identical on both sides and unit-testable in isolation.
const WORKER_SOURCE = `
const serializeValue = ${serializeValue.toString()};
self.onmessage = async (e) => {
  const logs = [];
  const cap = (level) => (...args) => logs.push({ level, text: args.map(serializeValue).join(" ") });
  self.console = { log: cap("log"), info: cap("info"), warn: cap("warn"), error: cap("error"), debug: cap("debug") };
  try {
    const fn = new Function("return (async () => {" + e.data.code + "\\n})()");
    const result = await fn();
    self.postMessage({ ok: true, logs, result: serializeValue(result) });
  } catch (err) {
    self.postMessage({ ok: false, logs, error: (err && err.message) ? String(err.message) : String(err) });
  }
};
`;

export interface SandboxLog {
  level: string;
  text: string;
}

export type SandboxStatus = "success" | "error" | "timeout";

export interface SandboxResult {
  ok: boolean;
  status: SandboxStatus;
  logs: SandboxLog[];
  result?: string;
  error?: string;
  duration_ms: number;
}

export interface RunSandboxOptions {
  timeoutMs?: number;
}

/**
 * Execute `code` in an isolated worker and resolve with captured logs, the
 * return value, and timing. Always resolves (never rejects); failures and
 * timeouts are reported via `status`.
 */
export function runInSandbox(code: string, opts: RunSandboxOptions = {}): Promise<SandboxResult> {
  const timeoutMs = Math.max(100, opts.timeoutMs ?? 3000);
  const started = Date.now();

  return new Promise<SandboxResult>((resolve) => {
    let worker: Worker | null = null;
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const finish = (r: SandboxResult) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      try { worker?.terminate(); } catch { /* ignore */ }
      resolve(r);
    };

    try {
      const url = URL.createObjectURL(new Blob([WORKER_SOURCE], { type: "application/javascript" }));
      worker = new Worker(url);
      URL.revokeObjectURL(url);

      timer = setTimeout(
        () => finish({ ok: false, status: "timeout", logs: [], error: `Execution exceeded ${timeoutMs}ms`, duration_ms: Date.now() - started }),
        timeoutMs,
      );

      worker.onmessage = (e: MessageEvent) => {
        const d = e.data as { ok: boolean; logs?: SandboxLog[]; result?: string; error?: string };
        finish({
          ok: d.ok,
          status: d.ok ? "success" : "error",
          logs: d.logs ?? [],
          result: d.result,
          error: d.error,
          duration_ms: Date.now() - started,
        });
      };

      worker.onerror = (e: ErrorEvent) => {
        e.preventDefault?.();
        finish({ ok: false, status: "error", logs: [], error: e.message || "worker error", duration_ms: Date.now() - started });
      };

      worker.postMessage({ code });
    } catch (err) {
      finish({ ok: false, status: "error", logs: [], error: err instanceof Error ? err.message : String(err), duration_ms: Date.now() - started });
    }
  });
}

/** Render a result's logs + return value into a single text blob for storage. */
export function formatSandboxOutput(res: SandboxResult): string {
  const lines = res.logs.map((l) => (l.level === "log" ? l.text : `[${l.level}] ${l.text}`));
  if (res.result !== undefined && res.result !== "undefined") lines.push(`=> ${res.result}`);
  return lines.join("\n");
}
