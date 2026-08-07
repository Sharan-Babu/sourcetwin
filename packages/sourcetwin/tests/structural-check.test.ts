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
  await runInit(repository.root);
});

afterEach(async () => {
  await repository.cleanup();
});

describe("structural check", () => {
  it("accepts a built-in entity kind before measured files exist", async () => {
    const configPath = join(repository.root, "source-twin/config.yml");
    const config = await readFile(configPath, "utf8");
    await repository.write("source-twin/config.yml", config.replace("entities: []", "entities: [function]"));
    await expect(runCheck(repository.root)).resolves.toMatchObject({ ok: true, diagnostics: [] });
  });

  it("fails when an entity kind has no built-in or project rule", async () => {
    const configPath = join(repository.root, "source-twin/config.yml");
    const config = await readFile(configPath, "utf8");
    await repository.write("source-twin/config.yml", config.replace("entities: []", "entities: [unknown-kind]"));
    const result = await runCheck(repository.root);
    expect(result).toMatchObject({ ok: false, diagnostics: [{ code: "ST106", severity: "error" }] });
  });

  it("validates exact locators only where structural coverage is enabled", async () => {
    await repository.write("src/service.ts", "export function start() {}\n");
    await repository.write(
      "source-twin/config.yml",
      "schema: 1\ncoverage:\n  code: { include: [src/**/*.ts], exclude: [], entities: [function] }\n  tests: { include: [], exclude: [], entities: [] }\n",
    );
    await repository.write(
      "source-twin/service.md",
      "---\nid: service\nsource:\n  code: [src/service.ts#missing]\n---\n# Service\n\nStarts.\n",
    );
    const broken = await runCheck(repository.root);
    expect(broken.diagnostics.some(({ code }) => code === "ST302")).toBe(true);
    await repository.write(
      "source-twin/service.md",
      "---\nid: service\nsource:\n  code: [src/service.ts#start]\n---\n# Service\n\nStarts.\n",
    );
    await expect(runCheck(repository.root)).resolves.toMatchObject({ ok: true });
  });

  it("validates Python function locators through the built-in provider", async () => {
    await repository.write("src/task.py", "def task(): pass\n");
    await repository.write(
      "source-twin/config.yml",
      "schema: 1\ncoverage:\n  code: { include: [src/**/*.py], exclude: [], entities: [function] }\n  tests: { include: [], exclude: [], entities: [] }\n",
    );
    await repository.write(
      "source-twin/task.md",
      "---\nid: task\nsource:\n  code: [src/task.py#task]\n---\n# Task\n\nRuns.\n",
    );
    expect(await runCheck(repository.root)).toMatchObject({ ok: true });
    expect((await runCoverage(repository.root)).data.code.entities)
      .toMatchObject({ total: 1, unsupported: 0 });
  });

  it("does not guess exact locators through parser errors", async () => {
    await repository.write("src/broken.ts", "export function (");
    await repository.write("tests/service.test.ts", 'test("starts safely", () => {});\n');
    await repository.write(
      "source-twin/config.yml",
      "schema: 1\ncoverage:\n  code: { include: [src/**/*.ts], exclude: [], entities: [function] }\n  tests: { include: [tests/**/*.ts], exclude: [], entities: [test] }\n",
    );
    await repository.write(
      "source-twin/service.md",
      "---\nid: service\nsource:\n  code: [src/broken.ts#unknown]\n  tests: [tests/service.test.ts#starts safely]\n---\n# Service\n\nStarts safely.\n",
    );
    const result = await runCheck(repository.root);
    expect(result).toMatchObject({ ok: true, diagnostics: [{ code: "ST303", severity: "warning" }] });
  });
});
