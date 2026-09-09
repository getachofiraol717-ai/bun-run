import { describe, it, expect } from "vitest";
import { PIPELINE, buildStepPrompt, parseVerdict } from "./orchestrator";

describe("PIPELINE", () => {
  it("runs the five collaboration stages in order", () => {
    expect(PIPELINE.map((s) => s.step)).toEqual([
      "coordinator",
      "planner",
      "worker",
      "merge",
      "verifier",
    ]);
  });
});

describe("buildStepPrompt", () => {
  it("always includes the task", () => {
    for (const def of PIPELINE) {
      expect(buildStepPrompt(def.step, { task: "Build a CSV exporter" })).toContain(
        "Task: Build a CSV exporter",
      );
    }
  });

  it("threads upstream context into downstream steps", () => {
    const planner = buildStepPrompt("planner", { task: "T", coordinator: "ROUTE-XYZ" });
    expect(planner).toContain("ROUTE-XYZ");

    const worker = buildStepPrompt("worker", { task: "T", plan: "PLAN-123" });
    expect(worker).toContain("PLAN-123");

    const merge = buildStepPrompt("merge", { task: "T", worker: "DRAFT-456" });
    expect(merge).toContain("DRAFT-456");

    const verifier = buildStepPrompt("verifier", { task: "T", merged: "FINAL-789" });
    expect(verifier).toContain("FINAL-789");
    expect(verifier.toLowerCase()).toContain("verdict:");
  });
});

describe("parseVerdict", () => {
  it("detects pass and fail case-insensitively", () => {
    expect(parseVerdict("Looks good.\nVerdict: PASS")).toBe("pass");
    expect(parseVerdict("Issues remain. verdict: fail")).toBe("fail");
  });
  it("returns unknown when no verdict line is present", () => {
    expect(parseVerdict("No clear conclusion here.")).toBe("unknown");
  });
});
