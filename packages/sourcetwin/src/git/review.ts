import type { Diagnostic } from "../core/result.js";
import type { SourceMapping } from "../mappings/reference.js";
import type { GitChange, GitComparison } from "./changes.js";
import {
  changedCanonicalLogicFiles,
  classifiedPath,
  isSupportingTwin,
} from "./twin-paths.js";

export interface PairedChange {
  readonly logicPath: string;
  readonly sourcePaths: readonly string[];
}

export interface SourceOnlyChange {
  readonly path: string;
  readonly logicPaths: readonly string[];
}

export interface GitReview {
  readonly base: string;
  readonly commit: string;
  readonly changes: readonly GitChange[];
  readonly twinOnly: readonly string[];
  readonly sourceOnly: readonly SourceOnlyChange[];
  readonly paired: readonly PairedChange[];
  readonly setupChanges: readonly string[];
  readonly supportingTwinChanges: readonly string[];
}

function affectedPaths(change: GitChange): string[] {
  return change.previousPath ? [change.previousPath, change.path] : [change.path];
}

function mappingApplies(mapping: SourceMapping, path: string): boolean {
  return mapping.path === path ||
    (mapping.kind === "module" && path.startsWith(`${mapping.path}/`));
}

function relatedMappings(
  mappings: readonly SourceMapping[],
  change: GitChange,
): SourceMapping[] {
  const paths = affectedPaths(change);
  return mappings.filter((mapping) => paths.some((path) => mappingApplies(mapping, path)));
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values)].sort();
}

export function reviewGitChanges(
  comparison: GitComparison,
  mappings: readonly SourceMapping[],
): GitReview {
  const changedLogic = uniqueSorted(changedCanonicalLogicFiles(comparison.changes)
    .map(({ reviewPath }) => reviewPath));
  const changedLogicSet = new Set(changedLogic);
  const sourceChanges = comparison.changes.filter((change) =>
    relatedMappings(mappings, change).length > 0);
  const paired: PairedChange[] = [];
  const twinOnly: string[] = [];
  for (const logicPath of changedLogic) {
    const sourcePaths = sourceChanges.filter((change) =>
      relatedMappings(mappings.filter(({ sourceTwinPath }) => sourceTwinPath === logicPath), change)
        .length > 0).map(({ path }) => path);
    if (sourcePaths.length === 0) twinOnly.push(logicPath);
    else paired.push({ logicPath, sourcePaths: uniqueSorted(sourcePaths) });
  }
  const sourceOnly = sourceChanges.flatMap((change) => {
    const logicPaths = uniqueSorted(relatedMappings(mappings, change)
      .map(({ sourceTwinPath }) => sourceTwinPath))
      .filter((path) => !changedLogicSet.has(path));
    if (logicPaths.length === 0) return [];
    return [{ path: change.path, logicPaths }];
  });
  return {
    base: comparison.base,
    commit: comparison.commit,
    changes: comparison.changes,
    twinOnly,
    sourceOnly,
    paired,
    setupChanges: uniqueSorted(comparison.changes.flatMap((change) =>
      classifiedPath(change, (path) =>
        path === "source-twin/config.yml" || path.startsWith("source-twin/rules/")))),
    supportingTwinChanges: uniqueSorted(comparison.changes.flatMap((change) =>
      classifiedPath(change, isSupportingTwin))),
  };
}

export function gitReviewDiagnostics(review: GitReview): Diagnostic[] {
  return [
    ...review.twinOnly.map((path): Diagnostic => ({
      code: "ST602", severity: "warning", location: { path },
      message: "Source Twin logic changed without a mapped code or test change.",
      suggestion: "If this is twin-first work, implement it next; otherwise confirm the mirror is current.",
    })),
    ...review.sourceOnly.map(({ path, logicPaths }): Diagnostic => ({
      code: "ST603", severity: "warning", location: { path },
      message: `Mapped source changed without its Source Twin logic: ${logicPaths.join(", ")}`,
      suggestion: "Review the behavior change and update the related Source Twin file when needed.",
    })),
    ...review.paired.map(({ logicPath, sourcePaths }): Diagnostic => ({
      code: "ST604", severity: "warning", location: { path: logicPath },
      message: `Source Twin logic and mapped source changed together: ${sourcePaths.join(", ")}`,
      suggestion: "Review both sides together and confirm they describe the same behavior.",
    })),
    ...uniqueSorted([...review.setupChanges, ...review.supportingTwinChanges]).map((path): Diagnostic => ({
      code: "ST605", severity: "warning", location: { path },
      message: "Source Twin setup, taxonomy, draft, or writing guidance changed.",
      suggestion: "Review these changes and rerun check and coverage after related edits.",
    })),
  ];
}
