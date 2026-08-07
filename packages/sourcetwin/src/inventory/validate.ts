import type { CoverageScopeConfig, SourceTwinConfig } from "../config/schema.js";
import type { Diagnostic } from "../core/result.js";
import { measuredPaths } from "../coverage/paths.js";
import type { SourceMapping } from "../mappings/reference.js";
import { scanInventory } from "./scan.js";
import type { CustomInventoryRule, InventoryDiagnostic } from "./types.js";

function locatorDiagnostic(mapping: SourceMapping): Diagnostic {
  return {
    code: "ST302",
    severity: "error",
    message: `Source locator does not match an inventoried entity: ${mapping.path}#${mapping.locator}`,
    location: { path: mapping.sourceTwinPath },
    suggestion: "Use a locator reported by sourcetwin coverage, or choose broader path mapping.",
    help: "sourcetwin help logic",
  };
}

function parseDiagnostic(path: string): Diagnostic {
  return {
    code: "ST303",
    severity: "warning",
    message: `Structural locators could not be verified because parsing found an error: ${path}`,
    location: { path },
    suggestion: "Correct the source syntax, then run sourcetwin check again.",
  };
}

function inventoryDiagnostic(diagnostic: InventoryDiagnostic): Diagnostic {
  return {
    code: "ST304",
    severity: "error",
    message: diagnostic.message,
    location: { path: diagnostic.path },
    suggestion: diagnostic.reason === "ambiguous-locator"
      ? "Use a qualified project rule or a broader file mapping."
      : "Correct the inventory rule or provider configuration.",
    help: "sourcetwin help rules",
  };
}

function unsupportedKindDiagnostic(scope: "code" | "tests", kind: string): Diagnostic {
  return {
    code: "ST106",
    severity: "error",
    message: `No applicable inventory provider exists for ${scope} entity kind: ${kind}`,
    location: { path: "source-twin/config.yml" },
    suggestion: "Use a supported kind, add a project rule, or choose path-only coverage.",
    help: "sourcetwin help config",
  };
}

async function validateScope(
  repositoryRoot: string,
  scope: "code" | "tests",
  config: CoverageScopeConfig,
  mappings: readonly SourceMapping[],
  rules: readonly CustomInventoryRule[],
  astGrepConfig?: string,
): Promise<Diagnostic[]> {
  if (config.entities.length === 0) return [];
  const measured = await measuredPaths(repositoryRoot, config);
  const direct = mappings.filter((mapping) =>
    mapping.scope === scope && mapping.kind === "direct" && !mapping.broken);
  const paths = [...new Set([...measured, ...direct.map(({ path }) => path)])].sort();
  const scanned = await scanInventory(
    repositoryRoot,
    paths,
    config.entities,
    rules,
    astGrepConfig,
  );
  const diagnostics: Diagnostic[] = [
    ...scanned.diagnostics.map(inventoryDiagnostic),
    ...scanned.parseErrorPaths.map(parseDiagnostic),
  ];
  if (scanned.diagnostics.some(({ reason }) => reason === "provider-error")) return diagnostics;

  for (const kind of config.entities) {
    const configured = kind === "function" || kind === "test" || rules.some((rule) => rule.kind === kind);
    if (!configured) {
      diagnostics.push(unsupportedKindDiagnostic(scope, kind));
      continue;
    }
    if (measured.length > 0 && measured.every((path) =>
      scanned.unsupportedAreas.some((area) =>
        area.path === path && area.kind === kind && area.reason !== "parse-error"))) {
      diagnostics.push(unsupportedKindDiagnostic(scope, kind));
    }
  }
  for (const mapping of direct) {
    if (scanned.parseErrorPaths.includes(mapping.path)) continue;
    const unsupported = new Set(scanned.unsupportedAreas
      .filter(({ path }) => path === mapping.path)
      .map(({ kind }) => kind));
    if (config.entities.every((kind) => unsupported.has(kind))) continue;
    const found = scanned.entities.some(({ path, locator }) =>
      path === mapping.path && locator === mapping.locator);
    if (!found) diagnostics.push(locatorDiagnostic(mapping));
  }
  return diagnostics;
}

export async function validateInventory(
  repositoryRoot: string,
  config: SourceTwinConfig,
  mappings: readonly SourceMapping[],
  rules: readonly CustomInventoryRule[],
): Promise<Diagnostic[]> {
  const [code, tests] = await Promise.all([
    validateScope(
      repositoryRoot,
      "code",
      config.coverage.code,
      mappings,
      rules,
      config.inventory?.astGrepConfig,
    ),
    validateScope(
      repositoryRoot,
      "tests",
      config.coverage.tests,
      mappings,
      rules,
      config.inventory?.astGrepConfig,
    ),
  ]);
  return [...code, ...tests];
}
