import type { CommandResult, Diagnostic } from "../core/result.js";
import { loadConfig } from "../config/load.js";
import { validateConfigReferences } from "../config/references.js";
import { analyzeScope, type EntityCoverage, type ScopeCoverage } from "../coverage/analyze.js";
import { loadInventoryRules } from "../inventory/rules.js";
import { validateProject } from "../validation/project.js";

interface CoverageData {
  readonly code: ScopeCoverage;
  readonly tests: ScopeCoverage;
}

const EMPTY_ENTITIES: EntityCoverage = {
  configured: false,
  total: 0,
  direct: 0,
  fileLevel: 0,
  moduleLevel: 0,
  unmapped: 0,
  unsupported: 0,
  requestedKinds: [],
  items: [],
  unmappedItems: [],
  unsupportedAreas: [],
  diagnostics: [],
};

const EMPTY_SCOPE: ScopeCoverage = {
  configured: false,
  total: 0,
  direct: 0,
  fileLevel: 0,
  moduleLevel: 0,
  unmapped: 0,
  broken: 0,
  unsupported: 0,
  unsupportedKinds: [],
  paths: [],
  unmappedPaths: [],
  unsupportedPaths: [],
  brokenReferences: [],
  entities: EMPTY_ENTITIES,
};

function scopeDetails(name: string, scope: ScopeCoverage): string[] {
  if (!scope.configured) return [`${name}: not configured`];
  const details = [
    `${name}: ${scope.total} total; ${scope.direct} direct; ${scope.fileLevel} file-level; ${scope.moduleLevel} module-level; ${scope.unmapped} unmapped; ${scope.broken} broken; ${scope.unsupported} unsupported`,
    ...scope.unmappedPaths.map((path) => `  Unmapped: ${path}`),
    ...scope.brokenReferences.map((path) => `  Broken: ${path}`),
  ];
  if (scope.entities.configured) {
    details.push(
      `${name} entities: ${scope.entities.total} total; ${scope.entities.direct} direct; ${scope.entities.fileLevel} file-level; ${scope.entities.moduleLevel} module-level; ${scope.entities.unmapped} unmapped; ${scope.entities.unsupported} unsupported`,
      ...scope.entities.unmappedItems.map(({ kind, locator, path }) =>
        `  Unmapped ${kind}: ${path}#${locator}`),
      ...scope.entities.unsupportedAreas.map(({ kind, path, reason }) =>
        `  Unsupported ${kind}: ${path} (${reason})`),
    );
  }
  return details;
}

function failure(diagnostics: readonly Diagnostic[]): CommandResult<CoverageData> {
  return {
    command: "coverage",
    ok: false,
    summary: "Coverage analysis could not run.",
    details: [],
    diagnostics,
    data: { code: EMPTY_SCOPE, tests: EMPTY_SCOPE },
  };
}

export async function runCoverage(repositoryRoot: string): Promise<CommandResult<CoverageData>> {
  const loaded = await loadConfig(repositoryRoot);
  if (!loaded.config) return failure(loaded.diagnostics);
  const [configDiagnostics, inventoryRules] = await Promise.all([
    validateConfigReferences(repositoryRoot, loaded.config),
    loadInventoryRules(repositoryRoot, loaded.config),
  ]);
  const setupDiagnostics = [...configDiagnostics, ...inventoryRules.diagnostics];
  if (setupDiagnostics.some(({ severity }) => severity === "error")) return failure(setupDiagnostics);

  const project = await validateProject(repositoryRoot);
  const [code, tests] = await Promise.all([
    analyzeScope(
      repositoryRoot,
      loaded.config.coverage.code,
      project.mappings.filter(({ scope }) => scope === "code"),
      inventoryRules.rules,
      loaded.config.inventory?.astGrepConfig,
    ),
    analyzeScope(
      repositoryRoot,
      loaded.config.coverage.tests,
      project.mappings.filter(({ scope }) => scope === "tests"),
      inventoryRules.rules,
      loaded.config.inventory?.astGrepConfig,
    ),
  ]);
  const inventoryDiagnostics: Diagnostic[] = [...code.entities.diagnostics, ...tests.entities.diagnostics]
    .map((diagnostic) => ({
      code: "ST304",
      severity: "error" as const,
      message: diagnostic.message,
      location: { path: diagnostic.path },
      suggestion: "Correct the inventory rule or make the locator unique.",
      help: "sourcetwin help rules",
    }));
  if (inventoryDiagnostics.length > 0) return failure([...setupDiagnostics, ...inventoryDiagnostics]);
  const authoredDiagnostics = project.diagnostics.map((diagnostic) => ({
    ...diagnostic,
    severity: "warning" as const,
  }));
  return {
    command: "coverage",
    ok: true,
    summary: "Coverage analysis completed.",
    details: [...scopeDetails("Code", code), ...scopeDetails("Tests", tests)],
    diagnostics: [...setupDiagnostics, ...authoredDiagnostics],
    data: { code, tests },
  };
}
