import fastGlob from "fast-glob";
import type { CoverageScopeConfig } from "../config/schema.js";
import type { SourceMapping } from "../mappings/reference.js";

export interface ScopeCoverage {
  readonly configured: boolean;
  readonly total: number;
  readonly direct: number;
  readonly fileLevel: number;
  readonly moduleLevel: number;
  readonly unmapped: number;
  readonly broken: number;
  readonly unsupported: number;
  readonly unsupportedKinds: readonly string[];
  readonly paths: readonly string[];
  readonly unmappedPaths: readonly string[];
  readonly unsupportedPaths: readonly string[];
  readonly brokenReferences: readonly string[];
}

function mappingValue(mapping: SourceMapping): string {
  if (mapping.kind === "module") return `${mapping.path}/**`;
  if (mapping.locator) return `${mapping.path}#${mapping.locator}`;
  return mapping.path;
}

function mappingApplies(mapping: SourceMapping, path: string): boolean {
  return mapping.path === path ||
    (mapping.kind === "module" && path.startsWith(`${mapping.path}/`));
}

export async function analyzeScope(
  repositoryRoot: string,
  config: CoverageScopeConfig,
  mappings: readonly SourceMapping[],
): Promise<ScopeCoverage> {
  const configured = config.include.length > 0;
  const paths = configured
    ? await fastGlob(config.include, {
        cwd: repositoryRoot,
        ignore: config.exclude,
        dot: true,
        followSymbolicLinks: false,
        onlyFiles: true,
        unique: true,
      })
    : [];
  paths.sort();
  const validMappings = mappings.filter(({ broken }) => !broken);
  const brokenReferences = mappings.filter(({ broken }) => broken).map(mappingValue).sort();
  const categories = { direct: 0, file: 0, module: 0, unmapped: 0 };
  const unmappedPaths: string[] = [];

  for (const path of paths) {
    const matches = validMappings.filter((mapping) => mappingApplies(mapping, path));
    if (matches.some(({ kind }) => kind === "direct")) categories.direct += 1;
    else if (matches.some(({ kind }) => kind === "file")) categories.file += 1;
    else if (matches.some(({ kind }) => kind === "module")) categories.module += 1;
    else {
      categories.unmapped += 1;
      unmappedPaths.push(path);
    }
  }

  const unsupportedKinds = [...new Set(config.entities)].sort();
  const unsupportedPaths = unsupportedKinds.length > 0 ? [...paths] : [];
  return {
    configured,
    total: paths.length,
    direct: categories.direct,
    fileLevel: categories.file,
    moduleLevel: categories.module,
    unmapped: categories.unmapped,
    broken: brokenReferences.length,
    unsupported: unsupportedPaths.length,
    unsupportedKinds,
    paths,
    unmappedPaths,
    unsupportedPaths,
    brokenReferences,
  };
}
