import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { executeCommand, type CliRuntime } from "../src/cli/execute.js";
import type { CommandResult } from "../src/core/result.js";
import { createTestRepository, type TestRepository } from "./helpers/repository.js";

let repository: TestRepository | undefined;
let temporaryPath: string | undefined;

afterEach(async () => {
  await repository?.cleanup();
  if (temporaryPath) await rm(temporaryPath, { force: true, recursive: true });
  repository = undefined;
  temporaryPath = undefined;
});

function captureRuntime(cwd: string) {
  const output: string[] = [];
  const errors: string[] = [];
  const exitCodes: number[] = [];
  const runtime: CliRuntime = {
    cwd: () => cwd,
    writeOutput: (value) => output.push(value),
    writeError: (value) => errors.push(value),
    setExitCode: (value) => exitCodes.push(value),
  };
  return { runtime, output, errors, exitCodes };
}

describe("command execution", () => {
  it("renders repository discovery failures as structured errors", async () => {
    temporaryPath = await mkdtemp(join(tmpdir(), "sourcetwin-execute-"));
    const capture = captureRuntime(temporaryPath);

    await executeCommand("check", { json: true }, capture.runtime, async () => {
      throw new Error("must not run");
    });

    expect(capture.output).toEqual([]);
    expect(JSON.parse(capture.errors[0]!)).toMatchObject({ ok: false, diagnostics: [{ code: "ST002" }] });
    expect(capture.exitCodes).toEqual([1]);
  });

  it("contains unexpected command failures", async () => {
    repository = await createTestRepository();
    const capture = captureRuntime(repository.root);

    await executeCommand("check", { json: false }, capture.runtime, async () => {
      throw new Error("inventory failed");
    });

    expect(capture.errors[0]).toContain("error ST500: inventory failed");
    expect(capture.exitCodes).toEqual([1]);
  });

  it("contains non-Error failures without exposing an unsafe value", async () => {
    repository = await createTestRepository();
    const capture = captureRuntime(repository.root);

    await executeCommand("coverage", { json: false }, capture.runtime, async () => {
      throw "failed";
    });

    expect(capture.errors[0]).toContain("An unexpected error occurred");
  });

  it("writes successful results to standard output", async () => {
    repository = await createTestRepository();
    const capture = captureRuntime(repository.root);
    const result: CommandResult<{ readonly value: number }> = {
      command: "check",
      ok: true,
      summary: "Done.",
      details: ["Value: 1"],
      diagnostics: [],
      data: { value: 1 },
    };

    await executeCommand("check", { json: false }, capture.runtime, async () => result);
    expect(capture.output).toEqual(["Done.\nValue: 1\n"]);
    expect(capture.exitCodes).toEqual([0]);
  });
});
