import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { execa } from "execa";

const require = createRequire(import.meta.url);
const binaryName = process.platform === "win32" ? "ast-grep.exe" : "ast-grep";
const binaryPath = join(dirname(require.resolve("@ast-grep/cli/package.json")), binaryName);

export async function runAstGrep(
  repositoryRoot: string,
  arguments_: readonly string[],
  input?: string,
): Promise<string> {
  try {
    const result = await execa(binaryPath, arguments_, {
      cwd: repositoryRoot,
      ...(input === undefined ? {} : { input }),
      reject: true,
      stderr: "pipe",
      stdout: "pipe",
    });
    return result.stdout;
  } catch (error) {
    const stderrValue: unknown = (error as { readonly stderr?: unknown }).stderr;
    const stderr = typeof stderrValue === "string"
      ? stderrValue.trim()
      : "";
    throw new Error(stderr ? `ast-grep failed: ${stderr}` : "ast-grep failed to run.");
  }
}
