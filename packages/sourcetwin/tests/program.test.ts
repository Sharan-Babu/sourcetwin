import { afterEach, describe, expect, it } from "vitest";
import { createProgram } from "../src/cli/program.js";
import type { CliRuntime } from "../src/cli/execute.js";
import { createTestRepository, type TestRepository } from "./helpers/repository.js";

let repository: TestRepository | undefined;

afterEach(async () => {
  await repository?.cleanup();
  repository = undefined;
});

function runtimeFor(root: string) {
  const output: string[] = [];
  const errors: string[] = [];
  const exitCodes: number[] = [];
  const runtime: CliRuntime = {
    cwd: () => root,
    writeOutput: (value) => output.push(value),
    writeError: (value) => errors.push(value),
    setExitCode: (value) => exitCodes.push(value),
  };
  return { runtime, output, errors, exitCodes };
}

describe("CLI program", () => {
  it("exposes stable identity and useful root help", () => {
    const program = createProgram();

    expect(program.name()).toBe("sourcetwin");
    expect(program.version()).toBe("0.1.0");
    expect(program.helpInformation()).toContain(
      "Maintain a version-controlled, plain-language semantic twin",
    );
  });

  it("wires init, check, and coverage to the shared runtime", async () => {
    repository = await createTestRepository();
    const capture = runtimeFor(repository.root);

    await createProgram(capture.runtime).parseAsync(["node", "sourcetwin", "init"]);
    await createProgram(capture.runtime).parseAsync([
      "node",
      "sourcetwin",
      "check",
      "--root",
      repository.root,
      "--json",
    ]);
    await createProgram(capture.runtime).parseAsync(["node", "sourcetwin", "coverage"]);

    expect(capture.output).toHaveLength(3);
    expect(capture.output.join("\n")).toContain("Initialized Source Twin");
    expect(capture.output.join("\n")).toContain("Source Twin is valid");
    expect(capture.exitCodes).toEqual([0, 0, 0]);
  });

  it("shows root and topic help and reports unknown topics", async () => {
    repository = await createTestRepository();
    const capture = runtimeFor(repository.root);

    await createProgram(capture.runtime).parseAsync(["node", "sourcetwin", "help"]);
    await createProgram(capture.runtime).parseAsync(["node", "sourcetwin", "help", "terms"]);
    await createProgram(capture.runtime).parseAsync(["node", "sourcetwin", "help", "unknown"]);

    expect(capture.output[0]).toContain("Usage: sourcetwin");
    expect(capture.output[1]).toContain("# Terms");
    expect(capture.errors[0]).toContain("Unknown help topic");
    expect(capture.exitCodes).toEqual([0, 0, 1]);
  });

  it("returns structured offline help in JSON mode", async () => {
    repository = await createTestRepository();
    const capture = runtimeFor(repository.root);

    await createProgram(capture.runtime).parseAsync([
      "node",
      "sourcetwin",
      "help",
      "logic",
      "--json",
    ]);

    const result = JSON.parse(capture.output[0] ?? "") as {
      readonly command: string;
      readonly ok: boolean;
      readonly data: { readonly topic: string; readonly content: string };
    };
    expect(result).toMatchObject({ command: "help", ok: true, data: { topic: "logic" } });
    expect(result.data.content).toContain("# Logic files");
  });
});
