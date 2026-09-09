import { describe, it, expect } from "vitest";
import { serializeValue, formatSandboxOutput, type SandboxResult } from "./sandboxRunner";

describe("serializeValue", () => {
  it("passes strings through unchanged", () => {
    expect(serializeValue("hello")).toBe("hello");
  });
  it("stringifies primitives and nullish values", () => {
    expect(serializeValue(42)).toBe("42");
    expect(serializeValue(true)).toBe("true");
    expect(serializeValue(null)).toBe("null");
    expect(serializeValue(undefined)).toBe("undefined");
  });
  it("JSON-encodes plain objects and arrays", () => {
    expect(serializeValue({ a: 1, b: [2, 3] })).toBe('{"a":1,"b":[2,3]}');
  });
  it("renders Error instances as name: message", () => {
    expect(serializeValue(new TypeError("boom"))).toBe("TypeError: boom");
  });
  it("never throws on circular structures", () => {
    const a: Record<string, unknown> = {};
    a.self = a;
    expect(() => serializeValue(a)).not.toThrow();
  });
});

describe("formatSandboxOutput", () => {
  const base: SandboxResult = { ok: true, status: "success", logs: [], duration_ms: 1 };

  it("joins logs and tags non-log levels", () => {
    const out = formatSandboxOutput({
      ...base,
      logs: [
        { level: "log", text: "hi" },
        { level: "error", text: "nope" },
      ],
    });
    expect(out).toBe("hi\n[error] nope");
  });

  it("appends the return value with an arrow", () => {
    const out = formatSandboxOutput({ ...base, logs: [{ level: "log", text: "x" }], result: "84" });
    expect(out).toBe("x\n=> 84");
  });

  it("omits an undefined return value", () => {
    const out = formatSandboxOutput({ ...base, logs: [{ level: "log", text: "x" }], result: "undefined" });
    expect(out).toBe("x");
  });
});
