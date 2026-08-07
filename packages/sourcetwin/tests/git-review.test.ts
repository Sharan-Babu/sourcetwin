import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runCheck } from "../src/commands/check.js";
import { runInit } from "../src/commands/init.js";
import { createTestRepository, type TestRepository } from "./helpers/repository.js";

let repository: TestRepository;

function logic(id: string, source: string, body: string): string {
  return `---
id: ${id}
source:
  code: [${source}]
---
# ${id}

${body}
`;
}

beforeEach(async () => {
  repository = await createTestRepository();
  await runInit(repository.root);
  await repository.write("source-twin/config.yml", `schema: 1
coverage:
  code: { include: [src/**/*.ts], exclude: [], entities: [] }
  tests: { include: [tests/**/*.ts], exclude: [], entities: [] }
`);
  await Promise.all([
    repository.write("src/source-only.ts", "before\n"),
    repository.write("src/twin-only.ts", "before\n"),
    repository.write("src/paired.ts", "before\n"),
    repository.write("src/module/item.ts", "before\n"),
    repository.write(
      "source-twin/source-only.md",
      logic("source.only", "src/source-only.ts", "Before."),
    ),
    repository.write(
      "source-twin/twin-only.md",
      logic("twin.only", "src/twin-only.ts", "Before."),
    ),
    repository.write("source-twin/paired.md", logic("paired", "src/paired.ts", "Before.")),
    repository.write(
      "source-twin/paired-secondary.md",
      logic("paired.secondary", "src/paired.ts", "Another view."),
    ),
    repository.write(
      "source-twin/module.md",
      logic("module", "src/module/**", "Module behavior."),
    ),
    repository.write("source-twin/terms/state.md", "---\nid: state\n---\n# State\n\nBefore.\n"),
  ]);
});

afterEach(async () => {
  await repository.cleanup();
});

describe("Git-aware Source Twin review", () => {
  it("separates twin-first, code-first, paired, setup, and supporting changes", async () => {
    const base = await repository.commitAll("baseline");
    await Promise.all([
      repository.write("src/source-only.ts", "after\n"),
      repository.write("src/paired.ts", "after\n"),
      repository.write("src/module/item.ts", "after\n"),
      repository.write("src/unmapped.ts", "new and intentionally unmapped\n"),
      repository.write(
        "source-twin/twin-only.md",
        logic("twin.only", "src/twin-only.ts", "Proposed next behavior."),
      ),
      repository.write("source-twin/paired.md", logic("paired", "src/paired.ts", "After.")),
      repository.write("source-twin/terms/state.md", "---\nid: state\n---\n# State\n\nAfter.\n"),
      repository.write("source-twin/config.yml", `schema: 1
coverage:
  code: { include: [src/**/*.ts], exclude: [src/excluded.ts], entities: [] }
  tests: { include: [tests/**/*.ts], exclude: [], entities: [] }
`),
    ]);

    const result = await runCheck(repository.root, { base });
    expect(result.ok).toBe(true);
    expect(result.diagnostics.map(({ code }) => code)).toEqual(expect.arrayContaining([
      "ST602", "ST603", "ST604", "ST605",
    ]));
    expect(result.data.gitReview).toMatchObject({
      base,
      twinOnly: ["source-twin/twin-only.md"],
      sourceOnly: expect.arrayContaining([
        { path: "src/source-only.ts", logicPaths: ["source-twin/source-only.md"] },
        { path: "src/paired.ts", logicPaths: ["source-twin/paired-secondary.md"] },
        { path: "src/module/item.ts", logicPaths: ["source-twin/module.md"] },
      ]),
      paired: [{ logicPath: "source-twin/paired.md", sourcePaths: ["src/paired.ts"] }],
      setupChanges: ["source-twin/config.yml"],
      supportingTwinChanges: ["source-twin/terms/state.md"],
    });
    expect(result.details).toEqual(expect.arrayContaining([
      expect.stringContaining("mapped-source-only: 3"),
    ]));
    expect(result.diagnostics.filter(({ code }) => code === "ST605")).toEqual([
      expect.objectContaining({ location: { path: "source-twin/config.yml" } }),
      expect.objectContaining({ location: { path: "source-twin/terms/state.md" } }),
    ]);
  });

  it("fails for an invalid explicit base and never guesses one", async () => {
    await repository.commitAll("baseline");
    const ordinary = await runCheck(repository.root);
    const invalid = await runCheck(repository.root, { base: "not-a-ref" });

    expect(ordinary.ok).toBe(true);
    expect(ordinary.data.gitReview).toBeUndefined();
    expect(ordinary.diagnostics.some(({ code }) => code.startsWith("ST6"))).toBe(false);
    expect(invalid).toMatchObject({ ok: false, diagnostics: [{ code: "ST601" }] });
  });

  it("uses the current path when a canonical logic file is renamed", async () => {
    const base = await repository.commitAll("baseline");
    await repository.git([
      "mv",
      "source-twin/source-only.md",
      "source-twin/source-only-renamed.md",
    ]);

    const result = await runCheck(repository.root, { base });
    expect(result.data.gitReview?.twinOnly).toEqual([
      "source-twin/source-only-renamed.md",
    ]);
    expect(result.data.gitReview?.twinOnly).not.toContain("source-twin/source-only.md");
  });

  it("keeps the old path when canonical logic is moved outside Source Twin", async () => {
    const base = await repository.commitAll("baseline");
    await repository.git([
      "mv",
      "source-twin/source-only.md",
      "source-only-archive.md",
    ]);

    const result = await runCheck(repository.root, { base });
    expect(result.data.gitReview?.twinOnly).toContain("source-twin/source-only.md");
  });

  it("reviews authored mappings even when they are outside measured coverage", async () => {
    await Promise.all([
      repository.write("scripts/deploy.ts", "before\n"),
      repository.write(
        "source-twin/deploy.md",
        logic("deploy", "scripts/deploy.ts", "Deployment behavior."),
      ),
    ]);
    const base = await repository.commitAll("baseline");
    await repository.write("scripts/deploy.ts", "after\n");

    const result = await runCheck(repository.root, { base });

    expect(result.data.gitReview?.sourceOnly).toContainEqual({
      path: "scripts/deploy.ts",
      logicPaths: ["source-twin/deploy.md"],
    });
  });

  it("pairs deleted logic with source through its base-revision mapping", async () => {
    const base = await repository.commitAll("baseline");
    await repository.git(["rm", "source-twin/source-only.md", "src/source-only.ts"]);

    const result = await runCheck(repository.root, { base });

    expect(result.data.gitReview?.paired).toContainEqual({
      logicPath: "source-twin/source-only.md",
      sourcePaths: ["src/source-only.ts"],
    });
    expect(result.data.gitReview?.twinOnly).not.toContain("source-twin/source-only.md");
  });

  it("treats a newly authored canonical file as twin-first work", async () => {
    const base = await repository.commitAll("baseline");
    await repository.write(
      "source-twin/proposed.md",
      logic("proposed", "src/source-only.ts", "Proposed behavior."),
    );

    const result = await runCheck(repository.root, { base });

    expect(result.data.gitReview?.twinOnly).toContain("source-twin/proposed.md");
  });
});
