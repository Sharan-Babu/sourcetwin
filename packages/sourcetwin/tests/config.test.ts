import { mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadConfig } from "../src/config/load.js";
import { validateConfigReferences } from "../src/config/references.js";
import { DEFAULT_CONFIG } from "../src/init/templates.js";
import { createTestRepository, type TestRepository } from "./helpers/repository.js";

let repository: TestRepository;
let externalPath: string | undefined;

beforeEach(async () => {
  repository = await createTestRepository();
});

afterEach(async () => {
  await repository.cleanup();
  if (externalPath) await rm(externalPath, { force: true, recursive: true });
  externalPath = undefined;
});

describe("configuration", () => {
  it("loads the strict schema 1 format", async () => {
    await repository.write("source-twin/config.yml", DEFAULT_CONFIG);

    const result = await loadConfig(repository.root);
    expect(result.diagnostics).toEqual([]);
    expect(result.config?.coverage.code.entities).toEqual([]);
  });

  it("reports a missing configuration", async () => {
    const result = await loadConfig(repository.root);

    expect(result.config).toBeUndefined();
    expect(result.diagnostics[0]?.code).toBe("ST101");
  });

  it("rejects a configuration file symlinked outside the repository", async () => {
    externalPath = await mkdtemp(join(tmpdir(), "sourcetwin-config-"));
    const outside = join(externalPath, "config.yml");
    await writeFile(outside, DEFAULT_CONFIG);
    await repository.write("source-twin/.keep", "");
    await symlink(outside, join(repository.root, "source-twin", "config.yml"));

    const result = await loadConfig(repository.root);
    expect(result.config).toBeUndefined();
    expect(result.diagnostics[0]?.code).toBe("ST101");
  });

  it("rejects a Source Twin directory symlinked outside the repository", async () => {
    externalPath = await mkdtemp(join(tmpdir(), "sourcetwin-config-"));
    await writeFile(join(externalPath, "config.yml"), DEFAULT_CONFIG);
    await symlink(externalPath, join(repository.root, "source-twin"));

    const result = await loadConfig(repository.root);
    expect(result.config).toBeUndefined();
    expect(result.diagnostics[0]?.code).toBe("ST101");
  });

  it("reports invalid and duplicate YAML with a line", async () => {
    await repository.write("source-twin/config.yml", "schema: 1\nschema: [\n");

    const result = await loadConfig(repository.root);
    expect(result.config).toBeUndefined();
    expect(result.diagnostics[0]).toMatchObject({
      code: "ST102",
      location: { path: "source-twin/config.yml", line: expect.any(Number) },
    });
  });

  it("explains an unsupported repository schema", async () => {
    await repository.write("source-twin/config.yml", DEFAULT_CONFIG.replace("schema: 1", "schema: 2"));

    const result = await loadConfig(repository.root);
    expect(result.config).toBeUndefined();
    expect(result.diagnostics[0]?.message).toContain("cannot read schema 2");
    expect(result.diagnostics[0]?.message).toContain("supported schemas: 1");
  });

  it.each([
    ["unknown field", `${DEFAULT_CONFIG}threshold: 90\n`],
    ["invalid entity", DEFAULT_CONFIG.replace("entities: []", "entities: [Function]")],
    ["escaping pattern", DEFAULT_CONFIG.replace("include: []", "include: [../src/**]")],
  ])("rejects an %s", async (_name, config) => {
    await repository.write("source-twin/config.yml", config);

    const result = await loadConfig(repository.root);
    expect(result.config).toBeUndefined();
    expect(result.diagnostics[0]?.code).toBe("ST104");
  });

  it("validates configured inventory file paths", async () => {
    await repository.write(
      "source-twin/config.yml",
      `${DEFAULT_CONFIG}inventory:\n  rules: [source-twin/rules/routes.yml]\n`,
    );
    const loaded = await loadConfig(repository.root);
    expect(loaded.config).toBeDefined();

    const missing = await validateConfigReferences(repository.root, loaded.config!);
    expect(missing).toHaveLength(1);
    await repository.write("source-twin/rules/routes.yml", "rule: {}\n");
    await expect(validateConfigReferences(repository.root, loaded.config!)).resolves.toEqual([]);
  });

  it("accepts an explicit advanced ast-grep configuration inside the repository", async () => {
    await repository.write(
      "source-twin/config.yml",
      `${DEFAULT_CONFIG}inventory:\n  astGrepConfig: source-twin/ast-grep.yml\n`,
    );
    await repository.write("source-twin/ast-grep.yml", "ruleDirs: []\n");
    const loaded = await loadConfig(repository.root);

    const diagnostics = await validateConfigReferences(repository.root, loaded.config!);
    expect(diagnostics).toEqual([]);
  });
});
