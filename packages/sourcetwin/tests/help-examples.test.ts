import { afterEach, describe, expect, it } from "vitest";
import { runCheck } from "../src/commands/check.js";
import { runCoverage } from "../src/commands/coverage.js";
import { runInit } from "../src/commands/init.js";
import { LOGIC_EXAMPLE, TERM_EXAMPLE } from "../src/help/topics.js";
import { createTestRepository, type TestRepository } from "./helpers/repository.js";

let repository: TestRepository | undefined;

afterEach(async () => {
  await repository?.cleanup();
  repository = undefined;
});

describe("offline help examples", () => {
  it("validates and measures the documented logic and term together", async () => {
    repository = await createTestRepository();
    await runInit(repository.root);
    await Promise.all([
      repository.write("src/subscriptions.ts", "export function cancelSubscription() {}\n"),
      repository.write("src/billing/invoice.ts", "export function invoice() {}\n"),
      repository.write(
        "tests/subscriptions.test.ts",
        "test('customer can cancel an active subscription', () => {});\n",
      ),
      repository.write("source-twin/subscriptions.md", LOGIC_EXAMPLE),
      repository.write("source-twin/terms/subscription.md", TERM_EXAMPLE),
      repository.write("source-twin/config.yml", `schema: 1
coverage:
  code: { include: [src/**/*.ts], exclude: [], entities: [function] }
  tests: { include: [tests/**/*.ts], exclude: [], entities: [test] }
`),
    ]);

    const checked = await runCheck(repository.root);
    const coverage = await runCoverage(repository.root);

    expect(checked.ok).toBe(true);
    expect(checked.diagnostics).toEqual([]);
    expect(coverage.ok).toBe(true);
    expect(coverage.data.code).toMatchObject({ total: 2, direct: 1, moduleLevel: 1 });
    expect(coverage.data.tests).toMatchObject({ total: 1, direct: 1 });
  });
});
