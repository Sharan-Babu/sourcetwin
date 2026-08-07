import type { Diagnostic } from "../core/result.js";
import { existingPathInsideRoot } from "../repository/path.js";

export type MappingKind = "direct" | "file" | "module";
export type MappingScope = "code" | "tests";

export interface SourceMapping {
  readonly sourceTwinPath: string;
  readonly scope: MappingScope;
  readonly kind: MappingKind;
  readonly path: string;
  readonly locator?: string;
  readonly broken: boolean;
}

const INVALID_PATH = /(^|\/)\.\.?(\/|$)|[\\*?\[\]{}]/;

function mappingDiagnostic(sourceTwinPath: string, message: string): Diagnostic {
  return {
    code: "ST301",
    severity: "error",
    message,
    location: { path: sourceTwinPath },
    suggestion: "Use path, path#readable-locator, or directory/**.",
    help: "sourcetwin help logic",
  };
}

export async function parseSourceMapping(
  value: string,
  scope: MappingScope,
  sourceTwinPath: string,
  repositoryRoot: string,
): Promise<{ readonly mapping?: SourceMapping; readonly diagnostics: readonly Diagnostic[] }> {
  const recursive = value.endsWith("/**");
  const withoutModuleSuffix = recursive ? value.slice(0, -3) : value;
  const hashIndex = withoutModuleSuffix.indexOf("#");
  const path = hashIndex === -1
    ? withoutModuleSuffix
    : withoutModuleSuffix.slice(0, hashIndex);
  const locator = hashIndex === -1 ? undefined : withoutModuleSuffix.slice(hashIndex + 1).trim();

  if (
    !path ||
    path.startsWith("/") ||
    path.endsWith("/") ||
    path.includes("//") ||
    INVALID_PATH.test(path) ||
    (recursive && hashIndex !== -1) ||
    (hashIndex !== -1 && !locator)
  ) {
    return {
      diagnostics: [mappingDiagnostic(sourceTwinPath, `Invalid source reference: ${value}`)],
    };
  }

  const target = await existingPathInsideRoot(repositoryRoot, path);
  const expectedType = recursive ? target.directory : target.file;
  const broken = !target.exists || !expectedType;
  const mapping: SourceMapping = {
    sourceTwinPath,
    scope,
    kind: recursive ? "module" : locator ? "direct" : "file",
    path,
    ...(locator ? { locator } : {}),
    broken,
  };

  return {
    mapping,
    diagnostics: broken
      ? [
          mappingDiagnostic(
            sourceTwinPath,
            `Source reference does not resolve to ${recursive ? "a directory" : "a file"}: ${value}`,
          ),
        ]
      : [],
  };
}
