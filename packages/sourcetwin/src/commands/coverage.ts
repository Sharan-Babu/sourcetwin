import type { CommandResult, Diagnostic } from "../core/result.js";
import { loadConfig } from "../config/load.js";
import { validateConfigReferences } from "../config/references.js";
import { analyzeScope, type ScopeCoverage } from "../coverage/analyze.js";
import { validateProject } from "../validation/project.js";

interface CoverageData {
  readonly code: ScopeCoverage;
  readonly tests: ScopeCoverage;
}

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
};

function scopeDetails(name: string, scope: ScopeCoverage): string[] {
  if (!scope.configured) return [`${name}: not configured`];
  return [
    `${name}: ${scope.total} total; ${scope.direct} direct; ${scope.fileLevel} file-level; ${scope.moduleLevel} module-level; ${scope.unmapped} unmapped; ${scope.broken} broken; ${scope.unsupported} unsupported`,
    ...scope.unmappedPaths.map((path) => `  Unmapped: ${path}`),
    ...scope.brokenReferences.map((path) => `  Broken: ${path}`),
    ...scope.unsupportedKinds.map((kind) => `  Unsupported entity kind: ${kind}`),
  ];
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
  const configDiagnostics = await validateConfigReferences(repositoryRoot, loaded.config);
  if (configDiagnostics.length > 0) return failure(configDiagnostics);

  const project = await validateProject(repositoryRoot);
  const [code, tests] = await Promise.all([
    analyzeScope(
      repositoryRoot,
      loaded.config.coverage.code,
      project.mappings.filter(({ scope }) => scope === "code"),
    ),
    analyzeScope(
      repositoryRoot,
      loaded.config.coverage.tests,
      project.mappings.filter(({ scope }) => scope === "tests"),
    ),
  ]);
  const authoredDiagnostics = project.diagnostics.map((diagnostic) => ({
    ...diagnostic,
    severity: "warning" as const,
  }));
  return {
    command: "coverage",
    ok: true,
    summary: "Coverage analysis completed.",
    details: [...scopeDetails("Code", code), ...scopeDetails("Tests", tests)],
    diagnostics: authoredDiagnostics,
    data: { code, tests },
  };
}
