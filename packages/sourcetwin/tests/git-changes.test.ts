import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { compareWorkingTree, parseNameStatus } from "../src/git/changes.js";
import { createTestRepository, type TestRepository } from "./helpers/repository.js";

let repository: TestRepository;

beforeEach(async () => {
  repository = await createTestRepository();
});

afterEach(async () => {
  await repository.cleanup();
});

describe("Git working-tree comparison", () => {
  it("parses NUL-safe names, rename scores, copies, and deletions", () => {
    expect(parseNameStatus(
      "M\0src/line\nbreak.ts\0R100\0src/old name.ts\0src/new name.ts\0" +
      "C75\0src/source.ts\0src/copy.ts\0D\0src/deleted.ts\0",
    )).toEqual([
      { status: "modified", path: "src/line\nbreak.ts" },
      { status: "renamed", previousPath: "src/old name.ts", path: "src/new name.ts" },
      { status: "copied", previousPath: "src/source.ts", path: "src/copy.ts" },
      { status: "deleted", path: "src/deleted.ts" },
    ]);
    expect(() => parseNameStatus("X\0src/file.ts\0"))
      .toThrow("Unsupported Git change status");
    expect(() => parseNameStatus("R100\0src/old.ts\0"))
      .toThrow("incomplete changed-path record");
    expect(parseNameStatus("A\0added.ts\0T\0typed.ts\0U\0conflicted.ts")).toEqual([
      { status: "added", path: "added.ts" },
      { status: "type-changed", path: "typed.ts" },
      { status: "unmerged", path: "conflicted.ts" },
    ]);
  });

  it("includes staged, unstaged, renamed, and untracked files against any ref", async () => {
    await Promise.all([
      repository.write("src/staged.ts", "before\n"),
      repository.write("src/unstaged.ts", "before\n"),
      repository.write("src/old name.ts", "same\n"),
    ]);
    const commit = await repository.commitAll();
    await repository.git(["tag", "review-base", commit]);

    await repository.write("src/staged.ts", "after\n");
    await repository.git(["add", "src/staged.ts"]);
    await repository.write("src/unstaged.ts", "after\n");
    await repository.git(["mv", "src/old name.ts", "src/new name.ts"]);
    await repository.write("src/untracked name.ts", "new\n");

    const result = await compareWorkingTree(repository.root, "review-base");
    expect(result.diagnostic).toBeUndefined();
    expect(result.comparison).toMatchObject({ base: "review-base", commit });
    expect(result.comparison?.changes).toEqual(expect.arrayContaining([
      { status: "renamed", previousPath: "src/old name.ts", path: "src/new name.ts" },
      { status: "modified", path: "src/staged.ts" },
      { status: "modified", path: "src/unstaged.ts" },
      { status: "untracked", path: "src/untracked name.ts" },
    ]));
  });

  it("returns an actionable error for an unknown branch, tag, or commit", async () => {
    const result = await compareWorkingTree(repository.root, "missing-ref");
    expect(result).toMatchObject({ diagnostic: { code: "ST601", severity: "error" } });
    expect(result.comparison).toBeUndefined();
  });

  it("contains Git comparison failures after a ref resolves", async () => {
    await repository.write("tracked.ts", "tracked\n");
    await repository.commitAll();
    await repository.write(".git/index", "not a Git index\n");

    const result = await compareWorkingTree(repository.root, "HEAD");
    expect(result).toMatchObject({ diagnostic: { code: "ST601", severity: "error" } });
    expect(result.diagnostic?.suggestion).not.toContain("Command failed with");
  });
});
