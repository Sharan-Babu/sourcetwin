import fastGlob from "fast-glob";
import type { CoverageScopeConfig } from "../config/schema.js";

export async function measuredPaths(
  repositoryRoot: string,
  config: CoverageScopeConfig,
): Promise<string[]> {
  if (config.include.length === 0) return [];
  const paths = await fastGlob(config.include, {
    cwd: repositoryRoot,
    ignore: config.exclude,
    dot: true,
    followSymbolicLinks: false,
    onlyFiles: true,
    unique: true,
  });
  return paths.sort();
}
