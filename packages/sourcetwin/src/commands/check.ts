import type { CommandResult, Diagnostic } from "../core/result.js";
import { loadConfig } from "../config/load.js";
import { validateConfigReferences } from "../config/references.js";
import { loadInventoryRules } from "../inventory/rules.js";
import { validateInventory } from "../inventory/validate.js";
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

  const [configDiagnostics, inventoryRules, project] = await Promise.all([
    validateConfigReferences(repositoryRoot, loaded.config),
    loadInventoryRules(repositoryRoot, loaded.config),
    validateProject(repositoryRoot),
  ]);
  const locatorDiagnostics = inventoryRules.diagnostics.some(({ severity }) => severity === "error")
    ? []
    : await validateInventory(
        repositoryRoot,
        loaded.config,
        project.mappings,
        inventoryRules.rules,
      );
  return result(
    [
      ...configDiagnostics,
      ...inventoryRules.diagnostics,
      ...project.diagnostics,
      ...locatorDiagnostics,
    ],
    {
      logicFiles: project.logicFiles,
      termFiles: project.termFiles,
      draftFiles: project.draftFiles,
      mappings: project.mappings.length,
    },
  );
}
