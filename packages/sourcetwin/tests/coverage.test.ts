import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { CoverageScopeConfig } from "../src/config/schema.js";
import { analyzeScope } from "../src/coverage/analyze.js";
import type { SourceMapping } from "../src/mappings/reference.js";
import { createTestRepository, type TestRepository } from "./helpers/repository.js";

let repository: TestRepository;

beforeEach(async () => {
  repository = await createTestRepository();
  await Promise.all([
    repository.write("src/direct.ts", "export function direct() {}\n"),
    repository.write("src/file.ts", "export function file() {}\n"),
    repository.write("src/module/inside.ts", "export function inside() {}\n"),
    repository.write("src/unmapped.ts", "export function unmapped() {}\n"),
    repository.write("src/excluded.ts", "excluded\n"),
  ]);
});

afterEach(async () => {
  await repository.cleanup();
});

function mapping(values: Partial<SourceMapping> & Pick<SourceMapping, "kind" | "path">): SourceMapping {
  return {
    sourceTwinPath: "source-twin/example.md",
    scope: "code",
    broken: false,
    ...values,
  };
}

describe("path coverage", () => {
  it("separates direct, file, module, unmapped, broken, and unsupported areas", async () => {
    const config: CoverageScopeConfig = {
      include: ["src/**/*.ts", "src/direct.ts"],
      exclude: ["src/excluded.ts"],
      entities: ["unknown-kind"],
    };
    const mappings = [
      mapping({ kind: "direct", path: "src/direct.ts", locator: "run" }),
      mapping({ kind: "file", path: "src/file.ts" }),
      mapping({ kind: "module", path: "src/module" }),
      mapping({ kind: "file", path: "src/missing.ts", broken: true }),
      mapping({ kind: "direct", path: "src/missing-direct.ts", locator: "run", broken: true }),
      mapping({ kind: "module", path: "src/missing-module", broken: true }),
    ];

    const result = await analyzeScope(repository.root, config, mappings);
    expect(result).toMatchObject({
      configured: true,
      total: 4,
      direct: 1,
      fileLevel: 1,
      moduleLevel: 1,
      unmapped: 1,
      broken: 3,
      unsupported: 4,
      unsupportedKinds: ["unknown-kind"],
      unmappedPaths: ["src/unmapped.ts"],
      brokenReferences: [
        "src/missing-direct.ts#run",
        "src/missing-module/**",
        "src/missing.ts",
      ],
    });
  });

  it("treats an empty include list as not configured", async () => {
    const result = await analyzeScope(
      repository.root,
      { include: [], exclude: [], entities: [] },
      [],
    );

    expect(result).toMatchObject({ configured: false, total: 0, unsupported: 0 });
    expect(result.paths).toEqual([]);
  });

  it("uses the strongest mapping when declarations overlap", async () => {
    const result = await analyzeScope(
      repository.root,
      { include: ["src/direct.ts"], exclude: [], entities: [] },
      [
        mapping({ kind: "module", path: "src" }),
        mapping({ kind: "file", path: "src/direct.ts" }),
        mapping({ kind: "direct", path: "src/direct.ts", locator: "run" }),
      ],
    );

    expect(result).toMatchObject({ direct: 1, fileLevel: 0, moduleLevel: 0 });
  });

  it("classifies extracted entities by exact, file, module, and unmapped coverage", async () => {
    const result = await analyzeScope(
      repository.root,
      { include: ["src/**/*.ts"], exclude: ["src/excluded.ts"], entities: ["function"] },
      [
        mapping({ kind: "direct", path: "src/direct.ts", locator: "direct" }),
        mapping({ kind: "file", path: "src/file.ts" }),
        mapping({ kind: "module", path: "src/module" }),
      ],
    );

    expect(result.entities).toMatchObject({
      configured: true,
      total: 4,
      direct: 1,
      fileLevel: 1,
      moduleLevel: 1,
      unmapped: 1,
      unsupported: 0,
    });
    expect(result.entities.unmappedItems).toEqual([
      expect.objectContaining({ path: "src/unmapped.ts", kind: "function", locator: "unmapped" }),
    ]);
  });

  it("reports stale exact locators as broken instead of direct coverage", async () => {
    const result = await analyzeScope(
      repository.root,
      { include: ["src/direct.ts"], exclude: [], entities: ["function"] },
      [mapping({ kind: "direct", path: "src/direct.ts", locator: "gone" })],
    );

    expect(result).toMatchObject({
      direct: 0,
      unmapped: 1,
      broken: 1,
      brokenReferences: ["src/direct.ts#gone"],
      entities: { direct: 0, unmapped: 1 },
    });
  });

  it("does not mark a locator stale when the source could not be parsed", async () => {
    const result = await analyzeScope(
      repository.root,
      { include: ["src/direct.ts"], exclude: [], entities: ["function"] },
      [mapping({ kind: "direct", path: "src/direct.ts", locator: "direct" })],
      [],
      undefined,
      {
        id: "parse-error-test",
        async scan() {
          return {
            entities: [],
            unsupportedAreas: [{ path: "src/direct.ts", kind: "function", reason: "parse-error" }],
            parseErrorPaths: ["src/direct.ts"],
            diagnostics: [],
          };
        },
      },
    );

    expect(result).toMatchObject({ direct: 1, broken: 0, unsupported: 1 });
    expect(result.brokenReferences).toEqual([]);
  });
});
