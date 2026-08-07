import { realpath, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { execa } from "execa";
import type { Diagnostic } from "../core/result.js";

export type RepositoryRootResult =
  | { readonly ok: true; readonly root: string }
  | { readonly ok: false; readonly diagnostic: Diagnostic };

async function existingDirectory(path: string): Promise<string | undefined> {
  try {
    if (!(await stat(path)).isDirectory()) return undefined;
    return await realpath(path);
  } catch {
    return undefined;
  }
}

export async function findRepositoryRoot(
  requestedRoot: string | undefined,
  cwd: string,
): Promise<RepositoryRootResult> {
  const candidate = await existingDirectory(resolve(cwd, requestedRoot ?? "."));
  if (!candidate) {
    return {
      ok: false,
      diagnostic: {
        code: "ST001",
        severity: "error",
        message: `Repository path does not exist or is not a directory: ${requestedRoot ?? cwd}`,
        suggestion: "Pass --root with a directory inside a Git repository.",
      },
    };
  }

  const git = await execa("git", ["-C", candidate, "rev-parse", "--show-toplevel"], {
    reject: false,
  });
  if (git.failed || !git.stdout.trim()) {
    return {
      ok: false,
      diagnostic: {
        code: "ST002",
        severity: "error",
        message: `Not inside a Git repository: ${candidate}`,
        suggestion: "Run the command inside a Git repository or pass --root.",
      },
    };
  }

  return { ok: true, root: await realpath(git.stdout.trim()) };
}
