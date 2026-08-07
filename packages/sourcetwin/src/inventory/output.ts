import { z } from "zod";
import type { InventoryDiagnostic, InventoryEntity } from "./types.js";

const positionSchema = z.object({ line: z.number().int().nonnegative() }).passthrough();
const byteRangeSchema = z.object({
  start: z.number().int().nonnegative(),
  end: z.number().int().nonnegative(),
});
const outlineItemSchema: z.ZodType<OutlineItem> = z.lazy(() => z.object({
  symbolType: z.string(),
  name: z.string(),
  signature: z.string(),
  range: z.object({ start: positionSchema, byteOffset: byteRangeSchema.optional() }).passthrough(),
  members: z.array(outlineItemSchema).optional(),
}).passthrough());
export const outlineSchema = z.array(z.object({
  path: z.string(),
  language: z.string(),
  items: z.array(outlineItemSchema),
}).passthrough());
export const matchSchema = z.object({
  file: z.string(),
  language: z.string(),
  range: z.object({ start: positionSchema, byteOffset: byteRangeSchema.optional() }).passthrough(),
  metaVariables: z.object({
    single: z.record(z.string(), z.object({ text: z.string() }).passthrough()),
    multi: z.record(z.string(), z.array(z.object({ text: z.string() }).passthrough())),
  }).passthrough().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).passthrough();

interface OutlineItem {
  readonly symbolType: string;
  readonly name: string;
  readonly signature: string;
  readonly range: {
    readonly start: { readonly line: number };
    readonly byteOffset?: { readonly start: number; readonly end: number } | undefined;
  };
  readonly members?: readonly OutlineItem[] | undefined;
}

export type OutlineFile = z.infer<typeof outlineSchema>[number];
export type AstGrepMatch = z.infer<typeof matchSchema>;

export function repositoryPath(path: string): string {
  return path.replaceAll("\\", "/");
}

function cleanCapture(value: string): string {
  const first = value[0];
  return first && first === value.at(-1) && ["'", '"', "`"].includes(first)
    ? value.slice(1, -1)
    : value;
}

export function locatorFromMatch(match: AstGrepMatch, template: string): string | undefined {
  let complete = true;
  const locator = template.replace(/\${1,3}([A-Z_][A-Z0-9_]*)/g, (_token, name: string) => {
    const single = match.metaVariables?.single[name]?.text;
    const multiple = match.metaVariables?.multi[name]?.map(({ text }) => text).join(", ");
    const value = single ?? (multiple || undefined);
    if (!value) complete = false;
    return value ? cleanCapture(value) : "";
  }).trim();
  return complete && locator ? locator : undefined;
}

function goMethodOwner(signature: string): string | undefined {
  return /func\s*\([^)]*\s+\*?([A-Za-z_][A-Za-z0-9_]*)/.exec(signature)?.[1];
}

export function outlineEntities(
  path: string,
  items: readonly OutlineItem[],
  parent?: string,
): InventoryEntity[] {
  const entities: InventoryEntity[] = [];
  for (const item of items) {
    const isFunction = item.symbolType === "function" || item.symbolType === "method";
    if (isFunction) {
      const owner = parent ?? (item.symbolType === "method" ? goMethodOwner(item.signature) : undefined);
      entities.push({
        path,
        kind: "function",
        locator: owner ? `${owner}.${item.name}` : item.name,
        line: item.range.start.line + 1,
        ...(item.range.byteOffset ? { offset: item.range.byteOffset.start } : {}),
      });
    }
    if (item.members) entities.push(...outlineEntities(path, item.members, item.name));
  }
  return entities;
}

export function outlineOwnerForMatch(
  items: readonly OutlineItem[],
  match: AstGrepMatch,
  inheritedOwner?: string,
): string | undefined {
  const target = match.range.byteOffset;
  if (!target) return undefined;
  for (const item of items) {
    const range = item.range.byteOffset;
    if (!range || range.start > target.start || range.end < target.end) continue;
    const owner = ["class", "constant", "variable"].includes(item.symbolType)
      ? item.name
      : inheritedOwner;
    return item.members
      ? outlineOwnerForMatch(item.members, match, owner)
      : owner;
  }
  return inheritedOwner;
}

export function duplicateDiagnostics(
  entities: readonly InventoryEntity[],
): InventoryDiagnostic[] {
  const locations = new Map<string, Set<string>>();
  for (const entity of entities) {
    const key = `${entity.path}\0${entity.locator}`;
    const positions = locations.get(key) ?? new Set<string>();
    positions.add(entity.offset === undefined ? `line:${entity.line}` : `offset:${entity.offset}`);
    locations.set(key, positions);
  }
  return entities.flatMap((entity) => {
    const key = `${entity.path}\0${entity.locator}`;
    if (locations.get(key)!.size < 2) return [];
    locations.set(key, new Set());
    return [{
      path: entity.path,
      kind: entity.kind,
      locator: entity.locator,
      reason: "ambiguous-locator" as const,
      message: `Entity locator is ambiguous across enabled kinds: ${entity.path}#${entity.locator}`,
    }];
  });
}

export function uniqueEntities(entities: readonly InventoryEntity[]): InventoryEntity[] {
  const unique = new Map<string, InventoryEntity>();
  for (const entity of entities) {
    const position = entity.offset === undefined ? `line:${entity.line}` : `offset:${entity.offset}`;
    const key = `${entity.path}\0${entity.kind}\0${entity.locator}\0${position}`;
    if (!unique.has(key)) unique.set(key, entity);
  }
  return [...unique.values()];
}
