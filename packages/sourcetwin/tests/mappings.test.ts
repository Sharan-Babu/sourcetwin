import { mkdtemp, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { parseSourceMapping } from "../src/mappings/reference.js";
import { createTestRepository, type TestRepository } from "./helpers/repository.js";

let repository: TestRepository;
let externalPath: string | undefined;

beforeEach(async () => {
  repository = await createTestRepository();
  await repository.write("src/subscriptions.ts", "export function cancel() {}\n");
  await repository.write("src/billing/refund.ts", "export function refund() {}\n");
});

afterEach(async () => {
  await repository.cleanup();
  if (externalPath) await rm(externalPath, { force: true, recursive: true });
  externalPath = undefined;
});

describe("source mappings", () => {
  it.each([
    ["src/subscriptions.ts#cancel", "direct", "cancel"],
    ["src/subscriptions.ts", "file", undefined],
    ["src/billing/**", "module", undefined],
  ] as const)("parses %s", async (value, kind, locator) => {
    const result = await parseSourceMapping(
      value,
      "code",
      "source-twin/subscriptions.md",
      repository.root,
    );

    expect(result.diagnostics).toEqual([]);
    expect(result.mapping).toMatchObject({ kind, broken: false });
    expect(result.mapping?.locator).toBe(locator);
  });

  it.each(["/src/file.ts", "../file.ts", "src//subscriptions.ts", "src/*.ts", "src/file.ts#", "src#item/**"])(
    "rejects malformed reference %s",
    async (value) => {
      const result = await parseSourceMapping(
        value,
        "code",
        "source-twin/example.md",
        repository.root,
      );

      expect(result.mapping).toBeUndefined();
      expect(result.diagnostics[0]?.code).toBe("ST301");
    },
  );

  it("marks missing and wrong target types as broken", async () => {
    const missing = await parseSourceMapping(
      "src/missing.ts",
      "code",
      "source-twin/example.md",
      repository.root,
    );
    const wrongType = await parseSourceMapping(
      "src/subscriptions.ts/**",
      "code",
      "source-twin/example.md",
      repository.root,
    );

    expect(missing.mapping?.broken).toBe(true);
    expect(wrongType.mapping?.broken).toBe(true);
    expect(missing.diagnostics).toHaveLength(1);
  });

  it("does not follow a source symlink outside the repository", async () => {
    externalPath = await mkdtemp(join(tmpdir(), "sourcetwin-external-"));
    const outside = join(externalPath, "outside.ts");
    await repository.write("src/placeholder", "");
    await import("node:fs/promises").then(({ writeFile }) => writeFile(outside, "outside\n"));
    await symlink(outside, join(repository.root, "src", "outside.ts"));

    const result = await parseSourceMapping(
      "src/outside.ts",
      "code",
      "source-twin/example.md",
      repository.root,
    );
    expect(result.mapping?.broken).toBe(true);
  });
});
