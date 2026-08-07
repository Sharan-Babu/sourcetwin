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

describe("structural command errors", () => {
  it("fails check and coverage when a custom locator is ambiguous", async () => {
    await repository.write("source-twin/config.yml", `schema: 1
coverage:
  code: { include: [src/**/*.ts], exclude: [], entities: [http-route] }
  tests: { include: [], exclude: [], entities: [] }
inventory:
  rules: [source-twin/rules/routes.yml]
`);
    await repository.write("source-twin/rules/routes.yml", `id: post-route
language: TypeScript
rule:
  pattern: router.post($PATH, $$$HANDLERS)
metadata:
  sourceTwinKind: http-route
  sourceTwinLocator: POST $PATH
`);
    await repository.write("src/routes.ts", "router.post(\"/users\", first);\nrouter.post(\"/users\", second);\n");
    await repository.write(
      "source-twin/routes.md",
      "---\nid: routes\nsource:\n  code: [src/routes.ts#POST /users]\n---\n# Routes\n\nCreates users.\n",
    );
    expect(await runCheck(repository.root)).toMatchObject({ ok: false, diagnostics: [{ code: "ST304" }] });
    expect(await runCoverage(repository.root)).toMatchObject({ ok: false, diagnostics: [{ code: "ST304" }] });
  });

  it("keeps an unused valid inventory rule as a warning", async () => {
    await repository.write("source-twin/config.yml", `schema: 1
coverage:
  code: { include: [], exclude: [], entities: [] }
  tests: { include: [], exclude: [], entities: [] }
inventory:
  rules: [source-twin/rules/jobs.yml]
`);
    await repository.write("source-twin/rules/jobs.yml", `id: queued-job
language: TypeScript
rule:
  pattern: queue.add($JOB)
metadata:
  sourceTwinKind: queued-job
  sourceTwinLocator: $JOB
`);
    expect(await runCheck(repository.root)).toMatchObject({ ok: true, diagnostics: [{ code: "ST108" }] });
    expect(await runCoverage(repository.root)).toMatchObject({ ok: true, diagnostics: [{ code: "ST108" }] });
  });

  it("turns provider failures into actionable validation errors", async () => {
    await repository.write("src/service.ts", "export function start() {}\n");
    await repository.write("source-twin/ast-grep.yml", "customLanguages: [invalid]\n");
    await repository.write("source-twin/config.yml", `schema: 1
coverage:
  code: { include: [src/**/*.ts], exclude: [], entities: [function] }
  tests: { include: [], exclude: [], entities: [] }
inventory:
  astGrepConfig: source-twin/ast-grep.yml
`);
    await repository.write(
      "source-twin/service.md",
      "---\nid: service\nsource:\n  code: [src/service.ts#start]\n---\n# Service\n\nStarts.\n",
    );
    expect(await runCheck(repository.root)).toMatchObject({
      ok: false,
      diagnostics: [expect.objectContaining({ code: "ST304", severity: "error" })],
    });
  });

  it("requires path-only tests where no test rule is proven", async () => {
    await repository.write("src/service.rs", "fn start() {}\n");
    await repository.write("source-twin/config.yml", `schema: 1
coverage:
  code: { include: [], exclude: [], entities: [] }
  tests: { include: [src/**/*.rs], exclude: [], entities: [test] }
`);
    expect(await runCheck(repository.root)).toMatchObject({
      ok: false,
      diagnostics: [expect.objectContaining({ code: "ST106" })],
    });
  });

  it("rejects an exact locator shared by different enabled entity kinds", async () => {
    await repository.write(
      "src/service.ts",
      "export function start() {}; test(\"start\", () => {});\n",
    );
    await repository.write("source-twin/config.yml", `schema: 1
coverage:
  code: { include: [src/**/*.ts], exclude: [], entities: [function, test] }
  tests: { include: [], exclude: [], entities: [] }
`);
    await repository.write(
      "source-twin/service.md",
      "---\nid: service\nsource:\n  code: [src/service.ts#start]\n---\n# Service\n\nStarts.\n",
    );

    expect(await runCheck(repository.root)).toMatchObject({
      ok: false,
      diagnostics: [expect.objectContaining({ code: "ST304" })],
    });
  });
});
