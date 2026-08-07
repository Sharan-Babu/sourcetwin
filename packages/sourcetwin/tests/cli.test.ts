import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const cliPath = fileURLToPath(new URL("../dist/cli.js", import.meta.url));

async function runCli(...arguments_: readonly string[]) {
  return execFileAsync(process.execPath, [cliPath, ...arguments_]);
}

describe("CLI foundation", () => {
  it("prints useful help", async () => {
    const { stderr, stdout } = await runCli("--help");

    expect(stderr).toBe("");
    expect(stdout).toContain("Usage: sourcetwin [options]");
    expect(stdout).toContain("plain-language semantic twin");
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
});
