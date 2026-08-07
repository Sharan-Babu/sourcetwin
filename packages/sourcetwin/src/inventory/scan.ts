import { AST_GREP_PROVIDER } from "./provider.js";
import type {
  CustomInventoryRule,
  InventoryProvider,
  InventoryScan,
} from "./types.js";

export async function scanInventory(
  repositoryRoot: string,
  paths: readonly string[],
  kinds: readonly string[],
  rules: readonly CustomInventoryRule[],
  astGrepConfig?: string,
  provider: InventoryProvider = AST_GREP_PROVIDER,
): Promise<InventoryScan> {
  return provider.scan({
    repositoryRoot,
    paths,
    kinds,
    rules,
    ...(astGrepConfig ? { astGrepConfig } : {}),
  });
}
