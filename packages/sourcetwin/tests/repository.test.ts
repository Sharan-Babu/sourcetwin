import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { findRepositoryRoot } from "../src/repository/root.js";
import { createTestRepository, type TestRepository } from "./helpers/repository.js";

let repository: TestRepository | undefined;
let temporaryPath: string | undefined;

afterEach(async () => {
  await repository?.cleanup();
  if (temporaryPath) await rm(temporaryPath, { force: true, recursive: true });
  repository = undefined;
  temporaryPath = undefined;
});

describe("repository discovery", () => {
  it("finds the Git root from a nested working directory", async () => {
    repository = await createTestRepository();
    const nested = join(repository.root, "src", "feature");
    await mkdir(nested, { recursive: true });

    await expect(findRepositoryRoot(undefined, nested)).resolves.toEqual({
      ok: true,
      root: repository.root,
    });
  });

  it("resolves an explicit path relative to the working directory", async () => {
    repository = await createTestRepository();
    temporaryPath = await mkdtemp(join(tmpdir(), "sourcetwin-cwd-"));

    const result = await findRepositoryRoot(repository.root, temporaryPath);
    expect(result).toEqual({ ok: true, root: repository.root });
  });

  it("reports a missing directory", async () => {
    temporaryPath = await mkdtemp(join(tmpdir(), "sourcetwin-cwd-"));
    const result = await findRepositoryRoot("missing", temporaryPath);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.diagnostic.code).toBe("ST001");
  });

  it("reports a path that is a file rather than a directory", async () => {
    temporaryPath = await mkdtemp(join(tmpdir(), "sourcetwin-cwd-"));
    const file = join(temporaryPath, "file.txt");
    await writeFile(file, "file\n");

    const result = await findRepositoryRoot(file, temporaryPath);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.diagnostic.code).toBe("ST001");
  });

  it("reports a directory outside Git", async () => {
    temporaryPath = await mkdtemp(join(tmpdir(), "sourcetwin-not-git-"));
    const result = await findRepositoryRoot(undefined, temporaryPath);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.diagnostic.code).toBe("ST002");
  });
});
