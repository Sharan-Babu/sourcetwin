import { afterEach, describe, expect, it } from "vitest";
import {
  BASE_MAPPING_PROCESS_LIMIT,
  loadBaseMappings,
} from "../src/git/base-mappings.js";
import type { GitComparison } from "../src/git/changes.js";
import { createTestRepository, type TestRepository } from "./helpers/repository.js";

let repository: TestRepository | undefined;

afterEach(async () => {
  await repository?.cleanup();
  repository = undefined;
});

function logic(id: string, source: string): string {
  return `---
id: ${id}
source:
  code: [${source}]
---
# ${id}

Behavior.
`;
}

describe("base-revision mappings", () => {
  it("bounds historical Git reads", () => {
    expect(BASE_MAPPING_PROCESS_LIMIT).toBeGreaterThanOrEqual(1);
    expect(BASE_MAPPING_PROCESS_LIMIT).toBeLessThanOrEqual(8);
  });

  it("loads valid former mappings and ignores invalid former documents", async () => {
    repository = await createTestRepository();
    await Promise.all([
      repository.write("src/old.ts", "old\n"),
      repository.write("source-twin/valid.md", logic("valid", "src/old.ts")),
      repository.write("source-twin/no-source.md", "---\nid: no.source\n---\n# No source\n"),
      repository.write("source-twin/bad-reference.md", logic("bad.reference", "../bad")),
    ]);
    const commit = await repository.commitAll("baseline");
    const comparison: GitComparison = {
      base: "HEAD",
      commit,
      changes: [
        { status: "modified", path: "source-twin/valid.md" },
        { status: "modified", path: "source-twin/no-source.md" },
        { status: "modified", path: "source-twin/bad-reference.md" },
      ],
    };

    const mappings = await loadBaseMappings(repository.root, comparison);

    expect(mappings).toEqual([
      expect.objectContaining({
        sourceTwinPath: "source-twin/valid.md",
        path: "src/old.ts",
      }),
    ]);
  });

  it("tolerates a comparison path that has no base blob", async () => {
    repository = await createTestRepository();
    await repository.write("README.md", "Fixture.\n");
    const commit = await repository.commitAll("empty baseline");

    await expect(loadBaseMappings(repository.root, {
      base: "HEAD",
      commit,
      changes: [{ status: "modified", path: "source-twin/missing.md" }],
    })).resolves.toEqual([]);
  });
});
