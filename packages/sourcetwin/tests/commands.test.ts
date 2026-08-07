import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { runCheck } from "../src/commands/check.js";
import { runCoverage } from "../src/commands/coverage.js";
import { runInit } from "../src/commands/init.js";
import { createTestRepository, type TestRepository } from "./helpers/repository.js";

let repository: TestRepository;

beforeEach(async () => {
  repository = await createTestRepository();
});

afterEach(async () => {
  await repository.cleanup();
});

describe("commands", () => {
  it("initializes only the minimal foundation and refuses to overwrite it", async () => {
    const initialized = await runInit(repository.root);

    expect(initialized.ok).toBe(true);
    expect(initialized.data.created).toEqual([
      "source-twin/config.yml",
      "source-twin/README.md",
      "source-twin/SKILL.md",
    ]);
    expect(initialized.data.integrationGuidance).toContain("Ask the user");
    await repository.write("source-twin/README.md", "# Custom\n");
    const repeated = await runInit(repository.root);
    expect(repeated).toMatchObject({ ok: false, diagnostics: [{ code: "ST401" }] });
    await expect(readFile(join(repository.root, "source-twin/README.md"), "utf8")).resolves.toBe(
      "# Custom\n",
    );
  });

  it("checks a fresh path-only Source Twin", async () => {
    await runInit(repository.root);

    const result = await runCheck(repository.root);
    expect(result).toMatchObject({ ok: true, data: { logicFiles: 0, mappings: 0 } });
  });

  it("fails check for invalid configuration", async () => {
    const result = await runCheck(repository.root);

    expect(result.ok).toBe(false);
    expect(result.diagnostics[0]?.code).toBe("ST101");
  });

  it("reports plural check errors", async () => {
    await runInit(repository.root);
    await repository.write(
      "source-twin/broken.md",
      "---\nid: Bad\n---\n# One\n# Two\n",
    );

    const result = await runCheck(repository.root);
    expect(result.summary).toMatch(/has \d+ errors/);
  });

  it("propagates initialization filesystem failures", async () => {
    await expect(runInit(join(repository.root, "missing-parent"))).rejects.toMatchObject({
      code: "ENOENT",
    });
  });

  it("fails check when an entity kind has no inventory provider", async () => {
    await runInit(repository.root);
    const configPath = join(repository.root, "source-twin/config.yml");
    const config = await readFile(configPath, "utf8");
    await repository.write(
      "source-twin/config.yml",
      config.replace("entities: []", "entities: [function]"),
    );

    const result = await runCheck(repository.root);
    expect(result.ok).toBe(false);
    expect(result.diagnostics[0]?.code).toBe("ST106");
  });

  it("reports path coverage without failing for gaps or authored errors", async () => {
    await runInit(repository.root);
    await repository.write("src/covered.ts", "covered\n");
    await repository.write("src/unmapped.ts", "unmapped\n");
    await repository.write(
      "source-twin/config.yml",
      "schema: 1\ncoverage:\n  code:\n    include: [src/**/*.ts]\n    exclude: []\n    entities: []\n  tests:\n    include: []\n    exclude: []\n    entities: []\n",
    );
    await repository.write(
      "source-twin/logic.md",
      "---\nid: logic\nsource:\n  code: [src/covered.ts, src/missing.ts]\n---\n# Logic\n\nUses {{missing-term}}.\n",
    );

    const result = await runCoverage(repository.root);
    expect(result.ok).toBe(true);
    expect(result.data.code).toMatchObject({ total: 2, fileLevel: 1, unmapped: 1, broken: 1 });
    expect(result.diagnostics.every(({ severity }) => severity === "warning")).toBe(true);
  });

  it("fails coverage only when setup prevents analysis", async () => {
    const missingConfig = await runCoverage(repository.root);
    expect(missingConfig.ok).toBe(false);

    await runInit(repository.root);
    await repository.write(
      "source-twin/config.yml",
      "schema: 1\ncoverage:\n  code: { include: [], exclude: [], entities: [] }\n  tests: { include: [], exclude: [], entities: [] }\ninventory:\n  rules: [source-twin/rules/missing.yml]\n",
    );
    const missingRule = await runCoverage(repository.root);
    expect(missingRule.ok).toBe(false);
    expect(missingRule.diagnostics[0]?.code).toBe("ST105");
  });
});
