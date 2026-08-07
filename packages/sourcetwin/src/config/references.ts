import type { Diagnostic } from "../core/result.js";
import { existingPathInsideRoot } from "../repository/path.js";
import type { SourceTwinConfig } from "./schema.js";

export async function validateConfigReferences(
  repositoryRoot: string,
  config: SourceTwinConfig,
): Promise<Diagnostic[]> {
  const paths = [
    ...(config.inventory?.rules ?? []),
    ...(config.inventory?.astGrepConfig ? [config.inventory.astGrepConfig] : []),
  ];
  const diagnostics: Diagnostic[] = [];
  for (const path of paths) {
    const target = await existingPathInsideRoot(repositoryRoot, path);
    if (!target.file) {
      diagnostics.push({
        code: "ST105",
        severity: "error",
        message: `Configured inventory file does not exist: ${path}`,
        location: { path: "source-twin/config.yml" },
        suggestion: "Correct the path, restore the file, or remove the unused configuration.",
        help: "sourcetwin help rules",
      });
    }
  }
  return diagnostics;
}
