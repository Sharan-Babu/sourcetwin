import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runAstGrep } from "../src/inventory/binary.js";
import { AST_GREP_PROCESS_LIMIT, mapPathBatches, pathBatches } from "../src/inventory/batches.js";
import {
  duplicateDiagnostics,
  locatorFromMatch,
  outlineEntities,
  outlineOwnerForMatch,
  repositoryPath,
  uniqueEntities,
  type AstGrepMatch,
} from "../src/inventory/output.js";
import { scanInventory } from "../src/inventory/scan.js";
import { createTestRepository } from "./helpers/repository.js";

function match(single: Record<string, string>, multi: Record<string, string[]> = {}): AstGrepMatch {
  return {
    file: "src\\routes.ts",
    language: "TypeScript",
    range: { start: { line: 0 } },
    metaVariables: {
      single: Object.fromEntries(Object.entries(single).map(([key, text]) => [key, { text }])),
      multi: Object.fromEntries(Object.entries(multi).map(([key, values]) =>
        [key, values.map((text) => ({ text }))])),
    },
  };
}

describe("ast-grep output normalization", () => {
  it("builds locators from single and multiple captures and rejects missing values", () => {
    expect(locatorFromMatch(match({ PATH: '"/users"' }), "POST $PATH")).toBe("POST /users");
    expect(locatorFromMatch(match({}, { HANDLERS: ["first", "second"] }), "$$$HANDLERS"))
      .toBe("first, second");
    expect(locatorFromMatch(match({}), "$MISSING")).toBeUndefined();
    expect(locatorFromMatch(match({}), "fixed locator")).toBe("fixed locator");
  });

  it("normalizes paths, function expressions, members, and duplicate locators", () => {
    expect(repositoryPath("src\\service.ts")).toBe("src/service.ts");
    const entities = outlineEntities("src/service.ts", [
      {
        symbolType: "function",
        name: "create",
        signature: "create = function () {}",
        range: { start: { line: 1 } },
      },
      {
        symbolType: "constant",
        name: "text",
        signature: 'text = "=>"',
        range: { start: { line: 2 } },
      },
      {
        symbolType: "class",
        name: "Service",
        signature: "class Service",
        range: { start: { line: 2 } },
        members: [{
          symbolType: "method",
          name: "run",
          signature: "",
          range: { start: { line: 3 } },
        }],
      },
    ]);
    expect(entities).toEqual([
      { path: "src/service.ts", kind: "function", locator: "create", line: 2 },
      { path: "src/service.ts", kind: "function", locator: "Service.run", line: 4 },
    ]);
    expect(duplicateDiagnostics([...entities, { ...entities[0]!, line: 20 }])).toEqual([
      expect.objectContaining({ reason: "ambiguous-locator", locator: "create" }),
    ]);
    expect(duplicateDiagnostics([...entities, { ...entities[0]!, kind: "test" }])).toEqual([]);
    expect(duplicateDiagnostics(entities)).toEqual([]);
  });

  it("removes repeated parser records without merging distinct occurrences", () => {
    const first = { path: "src/service.ts", kind: "function", locator: "run", line: 1 };
    const second = { ...first, line: 2 };
    const withOffset = { ...first, offset: 10 };

    expect(uniqueEntities([first, first, second, withOffset, withOffset]))
      .toEqual([first, second, withOffset]);
  });

  it("finds the nearest structural owner for an AST match", () => {
    const selected: AstGrepMatch = {
      ...match({ NAME: "handler" }),
      range: { start: { line: 2 }, byteOffset: { start: 30, end: 45 } },
    };
    const items = [{
      symbolType: "class",
      name: "Service",
      signature: "class Service",
      range: { start: { line: 0 }, byteOffset: { start: 0, end: 60 } },
      members: [{
        symbolType: "field",
        name: "handler",
        signature: "",
        range: { start: { line: 2 }, byteOffset: { start: 30, end: 45 } },
      }],
    }];

    expect(outlineOwnerForMatch(items, selected)).toBe("Service");
    expect(outlineOwnerForMatch([], selected, "Parent")).toBe("Parent");
    expect(outlineOwnerForMatch(items, match({ NAME: "handler" }))).toBeUndefined();
  });

  it("contains provider failures without exposing a command trace", async () => {
    const repository = await createTestRepository();
    try {
      await expect(runAstGrep(repository.root, ["not-a-command"])).rejects.toThrow("ast-grep failed:");
      const result = await scanInventory(
        repository.root,
        ["src/missing.ts"],
        ["function"],
        [],
        "missing-ast-grep.yml",
      );
      expect(result.diagnostics).toEqual([
        expect.objectContaining({ reason: "provider-error" }),
      ]);
    } finally {
      await repository.cleanup();
    }
  });

  it("gives a safe error when the native tool cannot start", async () => {
    const repository = await createTestRepository();
    try {
      await expect(runAstGrep(join(repository.root, "missing-directory"), ["--version"]))
        .rejects.toThrow("ast-grep failed to run.");
    } finally {
      await repository.cleanup();
    }
  });

  it("short-circuits when paths or entity kinds are empty", async () => {
    const repository = await createTestRepository();
    try {
      await expect(scanInventory(repository.root, [], ["function"], []))
        .resolves.toMatchObject({ entities: [], diagnostics: [] });
      await expect(scanInventory(repository.root, ["src/file.ts"], [], []))
        .resolves.toMatchObject({ entities: [], diagnostics: [] });
    } finally {
      await repository.cleanup();
    }
  });

  it("does not run a parser batch for an empty path scope", async () => {
    expect(pathBatches([])).toEqual([]);
    await expect(mapPathBatches([], async () => {
      throw new Error("An empty scope must not start a parser.");
    })).resolves.toEqual([]);
  });

  it("batches long path lists without changing inventory results", async () => {
    const repository = await createTestRepository();
    try {
      const paths = Array.from({ length: 80 }, (_, index) =>
        `src/${"service".repeat(10)}-${index}.ts`);
      await Promise.all(paths.map((path, index) =>
        repository.write(path, `export function task${index}() {}\n`)));
      const result = await scanInventory(repository.root, paths, ["function"], []);
      expect(result.diagnostics).toEqual([]);
      expect(result.entities).toHaveLength(paths.length);
    } finally {
      await repository.cleanup();
    }
  });

  it("bounds concurrent native parser batches", async () => {
    let active = 0;
    let peak = 0;
    const paths = Array.from({ length: AST_GREP_PROCESS_LIMIT + 3 }, (_, index) =>
      `${"x".repeat(6001)}-${index}`);

    const results = await mapPathBatches(paths, async ([path]) => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise<void>((resolve) => setImmediate(resolve));
      active -= 1;
      return path;
    });

    expect(results).toHaveLength(paths.length);
    expect(peak).toBeLessThanOrEqual(AST_GREP_PROCESS_LIMIT);
  });
});
