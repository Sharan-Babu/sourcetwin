import { execa } from "execa";
import type { Diagnostic } from "../core/result.js";

export type GitChangeStatus =
  | "added"
  | "copied"
  | "deleted"
  | "modified"
  | "renamed"
  | "type-changed"
  | "unmerged"
  | "untracked";

export interface GitChange {
  readonly status: GitChangeStatus;
  readonly path: string;
  readonly previousPath?: string;
}

export interface GitComparison {
  readonly base: string;
  readonly commit: string;
  readonly changes: readonly GitChange[];
}

export interface GitComparisonResult {
  readonly comparison?: GitComparison;
  readonly diagnostic?: Diagnostic;
}

const STATUS: Readonly<Record<string, GitChangeStatus>> = {
  A: "added",
  C: "copied",
  D: "deleted",
  M: "modified",
  R: "renamed",
  T: "type-changed",
  U: "unmerged",
};

export function parseNameStatus(output: string): GitChange[] {
  const fields = output.split("\0");
  if (fields.at(-1) === "") fields.pop();
  const changes: GitChange[] = [];
  for (let index = 0; index < fields.length;) {
    const token = fields[index++] ?? "";
    const status = STATUS[token[0] ?? ""];
    if (!status) throw new Error(`Unsupported Git change status: ${token || "empty"}`);
    const previousPath = token.startsWith("R") || token.startsWith("C")
      ? fields[index++]
      : undefined;
    const path = fields[index++];
    if (!path || ((status === "renamed" || status === "copied") && !previousPath)) {
      throw new Error("Git returned an incomplete changed-path record.");
    }
    changes.push({ status, path, ...(previousPath ? { previousPath } : {}) });
  }
  return changes;
}

function failure(base: string, detail?: string): GitComparisonResult {
  return {
    diagnostic: {
      code: "ST601",
      severity: "error",
      message: `Git comparison base could not be used: ${JSON.stringify(base)}`,
      suggestion: detail || "Pass an existing branch, tag, or commit to --base.",
    },
  };
}

export async function compareWorkingTree(
  repositoryRoot: string,
  base: string,
): Promise<GitComparisonResult> {
  const resolved = await execa(
    "git",
    ["rev-parse", "--verify", "--end-of-options", `${base}^{commit}`],
    { cwd: repositoryRoot, reject: false },
  );
  if (resolved.failed || !resolved.stdout.trim()) return failure(base);
  const commit = resolved.stdout.trim();
  try {
    const [tracked, untracked] = await Promise.all([
      execa("git", [
        "diff", "--name-status", "-z", "--find-renames", "--no-ext-diff", commit, "--",
      ], { cwd: repositoryRoot, stripFinalNewline: false }),
      execa("git", ["ls-files", "--others", "--exclude-standard", "-z"], {
        cwd: repositoryRoot,
        stripFinalNewline: false,
      }),
    ]);
    const changes = parseNameStatus(tracked.stdout);
    for (const path of untracked.stdout.split("\0").filter(Boolean)) {
      changes.push({ status: "untracked", path });
    }
    changes.sort((left, right) =>
      left.path.localeCompare(right.path) || left.status.localeCompare(right.status));
    return { comparison: { base, commit, changes } };
  } catch {
    return failure(base, "Git could not compare the selected base with the working tree.");
  }
}
