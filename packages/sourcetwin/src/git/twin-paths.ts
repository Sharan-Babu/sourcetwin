import type { GitChange } from "./changes.js";

export interface ChangedCanonicalLogic {
  readonly reviewPath: string;
  readonly basePath?: string;
}

export function classifiedPath(
  change: GitChange,
  predicate: (path: string) => boolean,
): string[] {
  if (predicate(change.path)) return [change.path];
  return change.previousPath && predicate(change.previousPath) ? [change.previousPath] : [];
}

export function isCanonicalLogic(path: string): boolean {
  return path.startsWith("source-twin/") && path.endsWith(".md") &&
    !path.startsWith("source-twin/drafts/") &&
    !path.startsWith("source-twin/terms/") &&
    path !== "source-twin/README.md" && path !== "source-twin/SKILL.md";
}

export function isSupportingTwin(path: string): boolean {
  return path.startsWith("source-twin/terms/") ||
    path.startsWith("source-twin/drafts/") ||
    path === "source-twin/README.md" || path === "source-twin/SKILL.md";
}

export function changedCanonicalLogicFiles(
  changes: readonly GitChange[],
): ChangedCanonicalLogic[] {
  return changes.flatMap((change) => {
    const currentIsCanonical = isCanonicalLogic(change.path);
    const previousIsCanonical = Boolean(
      change.previousPath && isCanonicalLogic(change.previousPath),
    );
    if (!currentIsCanonical && !previousIsCanonical) return [];
    const reviewPath = currentIsCanonical ? change.path : change.previousPath!;
    const existedAtBase = change.status !== "added" && change.status !== "untracked";
    const basePath = existedAtBase
      ? (change.previousPath ?? change.path)
      : undefined;
    return [{ reviewPath, ...(basePath ? { basePath } : {}) }];
  });
}
