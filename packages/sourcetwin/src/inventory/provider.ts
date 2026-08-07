import { builtinRuleDocuments } from "./builtins.js";
import { runAstGrep } from "./binary.js";
import { mapPathBatches } from "./batches.js";
import { detectedLanguages } from "./languages.js";
import {
  duplicateDiagnostics,
  locatorFromMatch,
  matchSchema,
  outlineEntities,
  outlineOwnerForMatch,
  outlineSchema,
  repositoryPath,
  uniqueEntities,
  type AstGrepMatch,
  type OutlineFile,
} from "./output.js";
import type {
  CustomInventoryRule,
  InventoryDiagnostic,
  InventoryEntity,
  InventoryProvider,
  InventoryProviderInput,
  InventoryScan,
  UnsupportedArea,
} from "./types.js";

const BUILTIN_CAPABILITIES: Readonly<Record<string, ReadonlySet<string>>> = {
  JavaScript: new Set(["function", "test"]),
  TypeScript: new Set(["function", "test"]),
  Tsx: new Set(["function", "test"]),
  Python: new Set(["function", "test"]),
  Go: new Set(["function", "test"]),
  Rust: new Set(["function"]),
  Java: new Set(["function"]),
};

function configArguments(config?: string): string[] {
  return config ? ["--config", config] : [];
}

async function outline(input: InventoryProviderInput): Promise<OutlineFile[]> {
  const outputs = await mapPathBatches(input.paths, async (paths) => {
    const output = await runAstGrep(input.repositoryRoot, [
      "outline", "--items", "structure", "--json=compact", "--color", "never",
      ...configArguments(input.astGrepConfig), "--", ...paths,
    ]);
    return outlineSchema.parse(JSON.parse(output || "[]") as unknown);
  });
  return outputs.flat();
}

async function scanMatches(
  input: InventoryProviderInput,
  arguments_: readonly string[],
  paths: readonly string[],
): Promise<AstGrepMatch[]> {
  const outputs = await mapPathBatches(paths, async (batch) => {
    const output = await runAstGrep(input.repositoryRoot, [
      "scan", ...arguments_, "--json=compact", "--include-metadata", "--color", "never",
      ...configArguments(input.astGrepConfig), "--", ...batch,
    ]);
    return matchSchema.array().parse(JSON.parse(output || "[]") as unknown);
  });
  return outputs.flat();
}

async function scanRule(
  input: InventoryProviderInput,
  paths: readonly string[],
  rule: CustomInventoryRule,
): Promise<{ entities: InventoryEntity[]; diagnostics: InventoryDiagnostic[] }> {
  const entities: InventoryEntity[] = [];
  const diagnostics: InventoryDiagnostic[] = [];
  for (const match of await scanMatches(input, ["--rule", rule.path], paths)) {
    const locator = locatorFromMatch(match, rule.locatorTemplate);
    if (locator) {
      entities.push({
        path: repositoryPath(match.file), kind: rule.kind, locator, line: match.range.start.line + 1,
        ...(match.range.byteOffset ? { offset: match.range.byteOffset.start } : {}),
      });
    } else {
      diagnostics.push({
        path: repositoryPath(match.file), kind: rule.kind, reason: "invalid-locator",
        message: `Inventory rule ${rule.id} emitted an empty or incomplete locator.`,
      });
    }
  }
  return { entities, diagnostics };
}

async function collectEntities(
  input: InventoryProviderInput,
  outlined: readonly OutlineFile[],
  parseMatches: readonly AstGrepMatch[],
  languages: ReadonlyMap<string, string>,
): Promise<{ entities: InventoryEntity[]; diagnostics: InventoryDiagnostic[] }> {
  const entities = outlined.flatMap(({ path, items }) =>
    input.kinds.includes("function") ? outlineEntities(repositoryPath(path), items) : []);
  const diagnostics: InventoryDiagnostic[] = [];
  for (const match of parseMatches) {
    const kind = match.metadata?.sourceTwinKind;
    if (kind === "test") {
      const testName = match.metaVariables?.single.NAME?.text;
      if (["JavaScript", "TypeScript", "Tsx"].includes(match.language) &&
        (!testName || !["'", '"', "`"].includes(testName[0] ?? ""))) continue;
      const locator = locatorFromMatch(match, String(match.metadata?.sourceTwinLocator ?? ""));
      if (locator) entities.push({
        path: repositoryPath(match.file), kind, locator, line: match.range.start.line + 1,
        ...(match.range.byteOffset ? { offset: match.range.byteOffset.start } : {}),
      });
    }
    if (kind === "function") {
      const path = repositoryPath(match.file);
      const file = outlined.find((item) => repositoryPath(item.path) === path);
      const name = locatorFromMatch(match, String(match.metadata?.sourceTwinLocator ?? ""));
      const qualifier = match.metadata?.sourceTwinQualifier;
      const owner = qualifier === "outline-owner" && file
        ? outlineOwnerForMatch(file.items, match)
        : undefined;
      if (name && (qualifier !== "outline-owner" || owner)) entities.push({
        path,
        kind,
        locator: owner ? `${owner}.${name}` : name,
        line: match.range.start.line + 1,
        ...(match.range.byteOffset ? { offset: match.range.byteOffset.start } : {}),
      });
    }
  }
  for (const rule of input.rules.filter(({ kind }) => input.kinds.includes(kind))) {
    const paths = input.paths.filter((path) => languages.get(path) === rule.language);
    const scanned = await scanRule(input, paths, rule);
    entities.push(...scanned.entities);
    diagnostics.push(...scanned.diagnostics);
  }
  return { entities, diagnostics };
}

function unsupportedAreas(
  input: InventoryProviderInput,
  languages: ReadonlyMap<string, string>,
  parseErrorPaths: readonly string[],
): UnsupportedArea[] {
  const areas: UnsupportedArea[] = [];
  for (const path of input.paths) {
    const language = languages.get(path);
    for (const kind of input.kinds) {
      const reason = parseErrorPaths.includes(path) ? "parse-error" as const
        : !language ? "unsupported-language" as const
          : BUILTIN_CAPABILITIES[language]?.has(kind) ||
            input.rules.some((rule) => rule.kind === kind && rule.language === language)
            ? undefined : "unsupported-kind" as const;
      if (reason) areas.push({ path, kind, reason });
    }
  }
  return areas.sort((left, right) =>
    left.path.localeCompare(right.path) || left.kind.localeCompare(right.kind));
}

export const AST_GREP_PROVIDER: InventoryProvider = {
  id: "ast-grep-cli",
  async scan(input: InventoryProviderInput): Promise<InventoryScan> {
    if (input.paths.length === 0 || input.kinds.length === 0) {
      return { entities: [], unsupportedAreas: [], parseErrorPaths: [], diagnostics: [] };
    }
    try {
      const ruleText = builtinRuleDocuments(new Set(input.kinds));
      const [outlined, matches] = await Promise.all([
        outline(input),
        scanMatches(input, ["--inline-rules", ruleText], input.paths),
      ]);
      const languages = detectedLanguages(input.paths, outlined.map((file) => ({
        ...file,
        path: repositoryPath(file.path),
      })));
      const parseErrorPaths = [...new Set(matches
        .filter((match) => match.metadata?.sourceTwinKind === "parse-error")
        .map(({ file }) => repositoryPath(file)))].sort();
      const collected = await collectEntities(input, outlined, matches, languages);
      const entities = uniqueEntities(
        collected.entities.filter(({ path }) => !parseErrorPaths.includes(path)),
      )
        .sort((left, right) =>
          left.path.localeCompare(right.path) || left.line - right.line || left.kind.localeCompare(right.kind));
      return {
        entities,
        unsupportedAreas: unsupportedAreas(input, languages, parseErrorPaths),
        parseErrorPaths,
        diagnostics: [...collected.diagnostics, ...duplicateDiagnostics(entities)],
      };
    } catch (error) {
      return {
        entities: [], unsupportedAreas: [], parseErrorPaths: [],
        diagnostics: [{
          path: "source-twin/config.yml", reason: "provider-error",
          message: String(error),
        }],
      };
    }
  },
};
