import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadConfig } from "../src/config/load.js";
import { loadInventoryRules } from "../src/inventory/rules.js";
import { scanInventory } from "../src/inventory/scan.js";
import { createTestRepository, type TestRepository } from "./helpers/repository.js";

let repository: TestRepository;
beforeEach(async () => { repository = await createTestRepository(); });
afterEach(async () => { await repository.cleanup(); });

async function configuredRules(path: string) {
  await repository.write("source-twin/config.yml", `schema: 1
coverage:
  code: { include: [src/**/*], exclude: [], entities: [job, http-route] }
  tests: { include: [], exclude: [], entities: [] }
inventory:
  rules: [${path}]
`);
  const loaded = await loadConfig(repository.root);
  return loadInventoryRules(repository.root, loaded.config!);
}

describe("custom rule locators", () => {
  it("rejects locator captures that the rule cannot emit", async () => {
    await repository.write("source-twin/rules/missing.yml", `id: missing-capture
language: TypeScript
rule: { pattern: queue.add($JOB) }
metadata: { sourceTwinKind: job, sourceTwinLocator: job $MISSING }
`);
    const loaded = await configuredRules("source-twin/rules/missing.yml");
    expect(loaded.rules).toEqual([]);
    expect(loaded.diagnostics).toEqual([
      expect.objectContaining({ code: "ST107", message: expect.stringContaining("MISSING") }),
    ]);
  });

  it("requires locator templates to be based on a capture", async () => {
    await repository.write("source-twin/rules/fixed.yml", `id: fixed-locator
language: TypeScript
rule: { pattern: queue.clear() }
metadata: { sourceTwinKind: job, sourceTwinLocator: fixed }
`);
    const loaded = await configuredRules("source-twin/rules/fixed.yml");
    expect(loaded.diagnostics).toEqual([
      expect.objectContaining({ code: "ST107", message: expect.stringContaining("must use") }),
    ]);
  });

  it("reports a rule branch that cannot produce its promised locator", async () => {
    await repository.write("source-twin/rules/branch.yml", `id: branch-locator
language: TypeScript
rule:
  any:
    - pattern: queue.add($JOB)
    - pattern: queue.clear()
metadata: { sourceTwinKind: job, sourceTwinLocator: $JOB }
`);
    await repository.write("src/jobs.ts", "queue.clear();\n");
    const loaded = await configuredRules("source-twin/rules/branch.yml");
    const result = await scanInventory(repository.root, ["src/jobs.ts"], ["job"], loaded.rules);
    expect(result.diagnostics).toEqual([
      expect.objectContaining({ reason: "invalid-locator" }),
    ]);
  });

  it("warns when a valid project rule is not enabled", async () => {
    await repository.write("source-twin/rules/jobs.yml", `id: queued-job
language: TypeScript
rule: { pattern: queue.add($JOB) }
metadata: { sourceTwinKind: queued-job, sourceTwinLocator: $JOB }
`);
    await repository.write("source-twin/config.yml", `schema: 1
coverage:
  code: { include: [], exclude: [], entities: [] }
  tests: { include: [], exclude: [], entities: [] }
inventory:
  rules: [source-twin/rules/jobs.yml]
`);
    const config = await loadConfig(repository.root);
    const loaded = await loadInventoryRules(repository.root, config.config!);
    expect(loaded.diagnostics).toEqual([
      expect.objectContaining({ code: "ST108", severity: "warning" }),
    ]);
  });

  it("reports duplicate custom locators instead of deduplicating them", async () => {
    await repository.write("source-twin/rules/routes.yml", `id: route
language: TypeScript
rule: { pattern: 'router.post($PATH, $$$HANDLERS)' }
metadata: { sourceTwinKind: http-route, sourceTwinLocator: POST $PATH }
`);
    await repository.write("src/routes.ts", "router.post(\"/users\", first);\nrouter.post(\"/users\", second);\n");
    const loaded = await configuredRules("source-twin/rules/routes.yml");
    expect(loaded).toEqual({ rules: [expect.any(Object)], diagnostics: [] });
    const result = await scanInventory(
      repository.root, ["src/routes.ts"], ["http-route"], loaded.rules,
    );
    expect(result.diagnostics).toEqual([
      expect.objectContaining({ reason: "ambiguous-locator", locator: "POST /users" }),
    ]);
  });
});
