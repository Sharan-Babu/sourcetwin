import type { CoverageScopeConfig } from "../config/schema.js";
import { scanInventory } from "../inventory/scan.js";
import type {
  CustomInventoryRule,
  InventoryDiagnostic,
  InventoryEntity,
  InventoryProvider,
  InventoryScan,
  UnsupportedArea,
} from "../inventory/types.js";
import type { SourceMapping } from "../mappings/reference.js";
import { measuredPaths } from "./paths.js";

export interface EntityCoverage {
  readonly configured: boolean;
  readonly total: number;
  readonly direct: number;
  readonly fileLevel: number;
  readonly moduleLevel: number;
  readonly unmapped: number;
  readonly unsupported: number;
  readonly requestedKinds: readonly string[];
  readonly items: readonly InventoryEntity[];
  readonly unmappedItems: readonly InventoryEntity[];
  readonly unsupportedAreas: readonly UnsupportedArea[];
  readonly diagnostics: readonly InventoryDiagnostic[];
}
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
  readonly entities: EntityCoverage;
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

function entityMappingKind(
  entity: InventoryEntity,
  mappings: readonly SourceMapping[],
): SourceMapping["kind"] | undefined {
  const matches = mappings.filter((mapping) => mappingApplies(mapping, entity.path));
  if (matches.some(({ kind, locator }) => kind === "direct" && locator === entity.locator)) {
    return "direct";
  }
  if (matches.some(({ kind }) => kind === "file")) return "file";
  if (matches.some(({ kind }) => kind === "module")) return "module";
  return undefined;
}

function summarizeEntities(
  scanned: InventoryScan,
  requestedKinds: readonly string[],
  mappings: readonly SourceMapping[],
): EntityCoverage {
  const categories = { direct: 0, file: 0, module: 0, unmapped: 0 };
  const unmappedItems: InventoryEntity[] = [];
  for (const item of scanned.entities) {
    const kind = entityMappingKind(item, mappings);
    if (kind === "direct") categories.direct += 1;
    else if (kind === "file") categories.file += 1;
    else if (kind === "module") categories.module += 1;
    else {
      categories.unmapped += 1;
      unmappedItems.push(item);
    }
  }
  return {
    configured: requestedKinds.length > 0,
    total: scanned.entities.length,
    direct: categories.direct,
    fileLevel: categories.file,
    moduleLevel: categories.module,
    unmapped: categories.unmapped,
    unsupported: scanned.unsupportedAreas.length,
    requestedKinds,
    items: scanned.entities,
    unmappedItems,
    unsupportedAreas: scanned.unsupportedAreas,
    diagnostics: scanned.diagnostics,
  };
}

async function scanEntities(
  repositoryRoot: string,
  paths: readonly string[],
  config: CoverageScopeConfig,
  rules: readonly CustomInventoryRule[],
  astGrepConfig?: string,
  provider?: InventoryProvider,
): Promise<InventoryScan> {
  const requestedKinds = [...new Set(config.entities)].sort();
  return scanInventory(
    repositoryRoot,
    paths,
    requestedKinds,
    rules,
    astGrepConfig,
    provider,
  );
}

function staleExactMappings(
  mappings: readonly SourceMapping[],
  paths: readonly string[],
  kinds: readonly string[],
  scanned: InventoryScan,
): SourceMapping[] {
  if (kinds.length === 0) return [];
  return mappings.filter((mapping) => {
    if (mapping.kind !== "direct" || !paths.includes(mapping.path)) return false;
    if (scanned.parseErrorPaths.includes(mapping.path)) return false;
    const unsupported = new Set(scanned.unsupportedAreas
      .filter(({ path }) => path === mapping.path)
      .map(({ kind }) => kind));
    if (kinds.every((kind) => unsupported.has(kind))) return false;
    return !scanned.entities.some(({ locator, path }) =>
      path === mapping.path && locator === mapping.locator);
  });
}

export async function analyzeScope(
  repositoryRoot: string,
  config: CoverageScopeConfig,
  mappings: readonly SourceMapping[],
  rules: readonly CustomInventoryRule[] = [],
  astGrepConfig?: string,
  provider?: InventoryProvider,
): Promise<ScopeCoverage> {
  const configured = config.include.length > 0;
  const paths = await measuredPaths(repositoryRoot, config);
  const requestedKinds = [...new Set(config.entities)].sort();
  const pathValidMappings = mappings.filter(({ broken }) => !broken);
  const scanned = await scanEntities(
    repositoryRoot,
    paths,
    config,
    rules,
    astGrepConfig,
    provider,
  );
  const staleMappings = staleExactMappings(pathValidMappings, paths, requestedKinds, scanned);
  const staleSet = new Set(staleMappings);
  const validMappings = pathValidMappings.filter((mapping) => !staleSet.has(mapping));
  const brokenReferences = [
    ...mappings.filter(({ broken }) => broken),
    ...staleMappings,
  ].map(mappingValue).sort();
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

  const entities = summarizeEntities(scanned, requestedKinds, validMappings);
  const unsupportedKinds = [...new Set(entities.unsupportedAreas.map(({ kind }) => kind))].sort();
  const unsupportedPaths = [...new Set(entities.unsupportedAreas.map(({ path }) => path))].sort();
  return {
    configured,
    total: paths.length,
    direct: categories.direct,
    fileLevel: categories.file,
    moduleLevel: categories.module,
    unmapped: categories.unmapped,
    broken: brokenReferences.length,
    unsupported: entities.unsupported,
    unsupportedKinds,
    paths,
    unmappedPaths,
    unsupportedPaths,
    brokenReferences,
    entities,
  };
}
