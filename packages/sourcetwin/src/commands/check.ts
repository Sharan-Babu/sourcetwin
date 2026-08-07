import type { CommandResult, Diagnostic } from "../core/result.js";
import { loadConfig } from "../config/load.js";
import { validateConfigReferences } from "../config/references.js";
import { loadInventoryRules } from "../inventory/rules.js";
import { validateInventory } from "../inventory/validate.js";
import { loadBaseMappings } from "../git/base-mappings.js";
import { compareWorkingTree } from "../git/changes.js";
import { gitReviewDiagnostics, reviewGitChanges, type GitReview } from "../git/review.js";
import type { SourceMapping } from "../mappings/reference.js";
import { validateProject } from "../validation/project.js";

interface CheckData {
  readonly logicFiles: number;
  readonly termFiles: number;
  readonly draftFiles: number;
  readonly mappings: number;
  readonly gitReview?: GitReview;
}

export interface CheckOptions {
  readonly base?: string;
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
      ...(data.gitReview ? [
        `Git base: ${data.gitReview.base} (${data.gitReview.commit.slice(0, 12)})`,
        `Git changes: ${data.gitReview.changes.length}; twin-only: ${data.gitReview.twinOnly.length}; mapped-source-only: ${data.gitReview.sourceOnly.length}; paired: ${data.gitReview.paired.length}; supporting/setup: ${data.gitReview.setupChanges.length + data.gitReview.supportingTwinChanges.length}`,
      ] : []),
    ],
    diagnostics,
    data,
  };
}

function reviewMappings(
  current: readonly SourceMapping[],
  previous: readonly SourceMapping[],
): readonly SourceMapping[] {
  const unique = new Map<string, (typeof current)[number]>();
  for (const mapping of [...current, ...previous]) {
    const key = [
      mapping.sourceTwinPath,
      mapping.scope,
      mapping.kind,
      mapping.path,
      mapping.locator ?? "",
    ].join("\0");
    unique.set(key, mapping);
  }
  return [...unique.values()];
}

export async function runCheck(
  repositoryRoot: string,
  options: CheckOptions = {},
): Promise<CommandResult<CheckData>> {
  const loaded = await loadConfig(repositoryRoot);
  if (!loaded.config) {
    return result(loaded.diagnostics, { logicFiles: 0, termFiles: 0, draftFiles: 0, mappings: 0 });
  }

  const [configDiagnostics, inventoryRules, project, comparison] = await Promise.all([
    validateConfigReferences(repositoryRoot, loaded.config),
    loadInventoryRules(repositoryRoot, loaded.config),
    validateProject(repositoryRoot),
    options.base !== undefined ? compareWorkingTree(repositoryRoot, options.base) : undefined,
  ]);
  const locatorDiagnostics = inventoryRules.diagnostics.some(({ severity }) => severity === "error")
    ? []
    : await validateInventory(
        repositoryRoot,
        loaded.config,
        project.mappings,
        inventoryRules.rules,
      );
  const baseMappings = comparison?.comparison
    ? await loadBaseMappings(repositoryRoot, comparison.comparison)
    : [];
  const gitReview = comparison?.comparison
    ? reviewGitChanges(comparison.comparison, reviewMappings(project.mappings, baseMappings))
    : undefined;
  return result(
    [
      ...configDiagnostics,
      ...inventoryRules.diagnostics,
      ...project.diagnostics,
      ...locatorDiagnostics,
      ...(comparison?.diagnostic ? [comparison.diagnostic] : []),
      ...(gitReview ? gitReviewDiagnostics(gitReview) : []),
    ],
    {
      logicFiles: project.logicFiles,
      termFiles: project.termFiles,
      draftFiles: project.draftFiles,
      mappings: project.mappings.length,
      ...(gitReview ? { gitReview } : {}),
    },
  );
}
