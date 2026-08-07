import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";
import { createTestRepository, type TestRepository } from "./helpers/repository.js";

const execFileAsync = promisify(execFile);
const cliPath = fileURLToPath(new URL("../dist/cli.js", import.meta.url));

async function runCli(...arguments_: readonly string[]) {
  return execFileAsync(process.execPath, [cliPath, ...arguments_]);
}

let repository: TestRepository | undefined;

afterEach(async () => {
  await repository?.cleanup();
  repository = undefined;
});

describe("CLI foundation", () => {
  it("prints useful help", async () => {
    const { stderr, stdout } = await runCli("--help");

    expect(stderr).toBe("");
    expect(stdout).toContain("Usage: sourcetwin [options]");
    expect(stdout).toContain("plain-language semantic twin");
    expect(stdout).toContain("init");
  });

  it("prints the package version", async () => {
    const { stderr, stdout } = await runCli("--version");

    expect(stderr).toBe("");
    expect(stdout).toBe("0.1.0\n");
  });

  it("rejects unknown options", async () => {
    await expect(runCli("--unknown")).rejects.toMatchObject({
      code: 1,
      stderr: expect.stringContaining("unknown option '--unknown'"),
    });
  });

  it("provides command help and offline format topics", async () => {
    const command = await runCli("check", "--help");
    const topic = await runCli("help", "logic");

    expect(command.stdout).toContain("Usage: sourcetwin check");
    expect(command.stdout).toContain("--base <git-ref>");
    expect(command.stdout).toContain("--root <path>");
    expect(command.stdout).toContain("--json");
    expect(topic.stdout).toContain("# Logic files");
    expect(topic.stdout).toContain("subscriptions.cancellation");
  });

  it("rejects an unknown help topic", async () => {
    await expect(runCli("help", "unknown")).rejects.toMatchObject({
      code: 1,
      stderr: expect.stringContaining("Available topics: config, logic, terms, rules"),
    });
  });

  it("runs from an explicit root with text and JSON parity", async () => {
    repository = await createTestRepository();
    const initialized = await runCli("--root", repository.root, "init");
    await repository.commitAll("initialized");
    const checked = await runCli("check", "--root", repository.root, "--base", "HEAD", "--json");
    const checkedText = await runCli("check", "--root", repository.root, "--base", "HEAD");
    const parsed = JSON.parse(checked.stdout) as {
      readonly ok: boolean;
      readonly details: readonly string[];
      readonly data: {
        readonly logicFiles: number;
        readonly gitReview: { readonly base: string; readonly changes: readonly unknown[] };
      };
    };

    expect(initialized.stdout).toContain("Created source-twin/SKILL.md");
    expect(parsed).toMatchObject({
      ok: true,
      data: { logicFiles: 0, gitReview: { base: "HEAD", changes: [] } },
    });
    expect(parsed.details).toContain("Logic files: 0");
    expect(checkedText.stdout).toContain("Git base: HEAD");
  });

  it("rejects an explicitly empty Git base", async () => {
    repository = await createTestRepository();
    await runCli("--root", repository.root, "init");
    await repository.commitAll("initialized");

    await expect(runCli(
      "check",
      "--root",
      repository.root,
      "--base",
      "",
      "--json",
    )).rejects.toMatchObject({
      code: 1,
      stderr: expect.stringContaining("ST601"),
    });
  });
});
