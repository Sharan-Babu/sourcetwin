import type { CommandResult, Diagnostic } from "../core/result.js";
import { loadConfig } from "../config/load.js";
import { validateConfigReferences } from "../config/references.js";
import { validateProject } from "../validation/project.js";

interface CheckData {
  readonly logicFiles: number;
  readonly termFiles: number;
  readonly draftFiles: number;
  readonly mappings: number;
}

function result(diagnostics: readonly Diagnostic[], data: CheckData): CommandResult<CheckData> {
  const errors = diagnostics.filter(({ severity }) => severity === "error").length;
  return {
    command: "check",
    ok: errors === 0,
    summary: errors === 0 ? "Source Twin is valid." : `Source Twin has ${errors} error${errors === 1 ? "" : "s"}.`,
    details: [
      `Logic files: ${data.logicFiles}`,
      `Term files: ${data.termFiles}`,
      `Draft files: ${data.draftFiles}`,
      `Source mappings: ${data.mappings}`,
    ],
    diagnostics,
    data,
  };
}

export async function runCheck(repositoryRoot: string): Promise<CommandResult<CheckData>> {
  const loaded = await loadConfig(repositoryRoot);
  if (!loaded.config) {
    return result(loaded.diagnostics, { logicFiles: 0, termFiles: 0, draftFiles: 0, mappings: 0 });
  }

  const [configDiagnostics, project] = await Promise.all([
    validateConfigReferences(repositoryRoot, loaded.config),
    validateProject(repositoryRoot),
  ]);
  const unsupportedKinds = [...new Set([
    ...loaded.config.coverage.code.entities,
    ...loaded.config.coverage.tests.entities,
  ])];
  const unsupportedDiagnostics: Diagnostic[] = unsupportedKinds.map((kind) => ({
    code: "ST106",
    severity: "error",
    message: `No structural inventory provider is available for enabled entity kind: ${kind}`,
    location: { path: "source-twin/config.yml" },
    suggestion: "Use path-only coverage or configure a supported inventory rule.",
    help: "sourcetwin help config",
  }));
  return result(
    [...configDiagnostics, ...unsupportedDiagnostics, ...project.diagnostics],
    {
      logicFiles: project.logicFiles,
      termFiles: project.termFiles,
      draftFiles: project.draftFiles,
      mappings: project.mappings.length,
    },
  );
}
