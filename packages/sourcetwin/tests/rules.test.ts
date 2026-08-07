import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadConfig } from "../src/config/load.js";
import { RULE_EXAMPLE } from "../src/help/topics.js";
import { loadInventoryRules } from "../src/inventory/rules.js";
import { scanInventory } from "../src/inventory/scan.js";
import { createTestRepository, type TestRepository } from "./helpers/repository.js";

let repository: TestRepository;

beforeEach(async () => { repository = await createTestRepository(); });
afterEach(async () => { await repository.cleanup(); });

async function configuredRules(paths: readonly string[]) {
  await repository.write("source-twin/config.yml", `schema: 1
coverage:
  code: { include: [src/**/*], exclude: [], entities: [http-route, job] }
  tests: { include: [], exclude: [], entities: [] }
inventory:
  rules: [${paths.join(", ")}]
`);
  const loaded = await loadConfig(repository.root);
  return loadInventoryRules(repository.root, loaded.config!);
}

describe("custom inventory rule loading", () => {
  it("extracts a readable entity locator from an ast-grep capture", async () => {
    await repository.write("source-twin/rules/routes.yml", RULE_EXAMPLE);
    await repository.write("src/routes.ts", 'router.post("/users", handler);\n');
    const loaded = await configuredRules(["source-twin/rules/routes.yml"]);
    expect(loaded.diagnostics).toEqual([]);
    const result = await scanInventory(repository.root, ["src/routes.ts"], ["http-route"], loaded.rules);
    expect(result.entities).toEqual([
      { path: "src/routes.ts", kind: "http-route", locator: "POST /users", line: 1, offset: 0 },
    ]);
  });

  it("reports malformed YAML, schema errors, invalid matchers, and duplicate ids", async () => {
    await repository.write("source-twin/rules/yaml.yml", "rule: [\n");
    await repository.write("source-twin/rules/schema.yml", "id: Bad\n");
    await repository.write("source-twin/rules/root.yml", "[]\n");
    await repository.write(
      "source-twin/rules/invalid.yml",
      "id: invalid\nlanguage: TypeScript\nrule: { kind: not_a_kind, pattern: $NODE }\nmetadata: { sourceTwinKind: job, sourceTwinLocator: $NODE }\n",
    );
    for (const suffix of ["a", "b"]) {
      await repository.write(
        `source-twin/rules/duplicate-${suffix}.yml`,
        "id: repeated\nlanguage: TypeScript\nrule: { pattern: $CALL($$$ARGS) }\nmetadata: { sourceTwinKind: job, sourceTwinLocator: $CALL }\n",
      );
    }
    const loaded = await configuredRules([
      "source-twin/rules/yaml.yml", "source-twin/rules/schema.yml",
      "source-twin/rules/root.yml", "source-twin/rules/invalid.yml",
      "source-twin/rules/duplicate-a.yml", "source-twin/rules/duplicate-b.yml",
    ]);
    expect(loaded.diagnostics.length).toBeGreaterThanOrEqual(5);
    expect(loaded.diagnostics.every(({ code }) => code === "ST107")).toBe(true);
    expect(loaded.diagnostics.some(({ message }) => message.includes("Duplicate inventory rule")))
      .toBe(true);
  });

  it("loads optional ast-grep constraints and utility rules", async () => {
    await repository.write("source-twin/rules/constrained.yml", `id: constrained-call
language: TypeScript
rule:
  pattern: $CALL($ARG)
constraints:
  CALL: { regex: ^run$ }
utils:
  any-call: { kind: call_expression }
metadata:
  sourceTwinKind: job
  sourceTwinLocator: $CALL
`);
    const loaded = await configuredRules(["source-twin/rules/constrained.yml"]);
    expect(loaded).toMatchObject({ diagnostics: [], rules: [{ id: "constrained-call" }] });
  });

  it("validates rules with an explicit ast-grep configuration", async () => {
    await repository.write("source-twin/ast-grep.yml", "ruleDirs: []\n");
    await repository.write("source-twin/rules/jobs.yml", `id: job
language: TypeScript
rule: { pattern: queue.add($JOB) }
metadata: { sourceTwinKind: job, sourceTwinLocator: $JOB }
`);
    await repository.write("source-twin/config.yml", `schema: 1
coverage:
  code: { include: [src/**/*.ts], exclude: [], entities: [job] }
  tests: { include: [], exclude: [], entities: [] }
inventory:
  rules: [source-twin/rules/jobs.yml]
  astGrepConfig: source-twin/ast-grep.yml
`);
    const config = await loadConfig(repository.root);
    const loaded = await loadInventoryRules(repository.root, config.config!);
    expect(loaded.diagnostics).toEqual([]);
  });
});
