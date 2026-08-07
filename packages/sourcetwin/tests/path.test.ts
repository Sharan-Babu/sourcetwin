import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  existingPathInsideRoot,
  fromRepositoryPath,
  isInsideRoot,
  toRepositoryPath,
} from "../src/repository/path.js";
import { createTestRepository, type TestRepository } from "./helpers/repository.js";

let repository: TestRepository;

beforeEach(async () => {
  repository = await createTestRepository();
});

afterEach(async () => {
  await repository.cleanup();
});

describe("repository paths", () => {
  it("converts between absolute and forward-slash repository paths", () => {
    const absolute = fromRepositoryPath(repository.root, "src/feature/file.ts");

    expect(absolute).toBe(join(repository.root, "src", "feature", "file.ts"));
    expect(toRepositoryPath(repository.root, absolute)).toBe("src/feature/file.ts");
  });

  it("distinguishes the root, descendants, and outside paths", () => {
    expect(isInsideRoot(repository.root, repository.root)).toBe(true);
    expect(isInsideRoot(repository.root, join(repository.root, "src"))).toBe(true);
    expect(isInsideRoot(repository.root, join(repository.root, "..", "outside"))).toBe(false);
  });

  it("reports missing paths without throwing", async () => {
    await expect(existingPathInsideRoot(repository.root, "missing.ts")).resolves.toEqual({
      exists: false,
      file: false,
      directory: false,
    });
  });
});
