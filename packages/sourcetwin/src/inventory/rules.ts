import { readFile } from "node:fs/promises";
import { parseDocument } from "yaml";
import { z } from "zod";
import type { SourceTwinConfig } from "../config/schema.js";
import type { Diagnostic } from "../core/result.js";
import { existingPathInsideRoot } from "../repository/path.js";
import { runAstGrep } from "./binary.js";
import type { CustomInventoryRule } from "./types.js";

const valueObject = z.record(z.string(), z.unknown());
const ruleFileSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/),
  language: z.string().trim().min(1),
  rule: valueObject,
  constraints: valueObject.optional(),
  utils: valueObject.optional(),
  metadata: z.object({
    sourceTwinKind: z.string().regex(/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/),
    sourceTwinLocator: z.string().trim().min(1),
  }).passthrough(),
}).passthrough();

export interface InventoryRulesResult {
  readonly rules: readonly CustomInventoryRule[];
  readonly diagnostics: readonly Diagnostic[];
}

function diagnostic(path: string, message: string): Diagnostic {
  return {
    code: "ST107",
    severity: "error",
    message,
    location: { path },
    suggestion: "Follow sourcetwin help rules and correct this inventory rule.",
    help: "sourcetwin help rules",
  };
}

async function loadRule(
  repositoryRoot: string,
  path: string,
  astGrepConfig?: string,
): Promise<InventoryRulesResult> {
  const target = await existingPathInsideRoot(repositoryRoot, path);
  if (!target.file || !target.resolvedPath) return { rules: [], diagnostics: [] };
  const source = await readFile(target.resolvedPath, "utf8");
  const document = parseDocument(source, { prettyErrors: false, uniqueKeys: true });
  if (document.errors.length > 0) {
    return { rules: [], diagnostics: [diagnostic(path, document.errors[0]?.message ?? "Invalid YAML.")] };
  }
  const parsed = ruleFileSchema.safeParse(document.toJS() as unknown);
  if (!parsed.success) {
    return {
      rules: [],
      diagnostics: parsed.error.issues.map((issue) =>
        diagnostic(path, `${issue.path.join(".") || "rule"}: ${issue.message}`)),
    };
  }
  const value = parsed.data;
  const ruleSource = JSON.stringify({
    rule: value.rule,
    constraints: value.constraints,
    utils: value.utils,
  });
  const captures = new Set(ruleSource.match(/\${1,3}[A-Z_][A-Z0-9_]*/g)?.map((name) =>
    name.replace(/^\${1,3}/, "")) ?? []);
  const locatorCaptures = [...value.metadata.sourceTwinLocator.matchAll(
    /\${1,3}([A-Z_][A-Z0-9_]*)/g,
  )].map((match) => match[1] ?? "");
  if (locatorCaptures.length === 0) {
    return {
      rules: [],
      diagnostics: [diagnostic(path, "metadata.sourceTwinLocator must use a rule capture.")],
    };
  }
  const missingCaptures = locatorCaptures.filter((name) => !captures.has(name));
  if (missingCaptures.length > 0) {
    return {
      rules: [],
      diagnostics: [diagnostic(path, `Locator uses missing capture: ${missingCaptures.join(", ")}`)],
    };
  }
  try {
    await runAstGrep(repositoryRoot, [
      "scan", "--rule", path, "--json=compact", "--color", "never",
      ...(astGrepConfig ? ["--config", astGrepConfig] : []),
      "--stdin",
    ], "");
  } catch (error) {
    return {
      rules: [],
      diagnostics: [diagnostic(path, error instanceof Error ? error.message : "Invalid ast-grep rule.")],
    };
  }
  return {
    rules: [{
      id: value.id,
      path,
      language: value.language,
      kind: value.metadata.sourceTwinKind,
      locatorTemplate: value.metadata.sourceTwinLocator,
    }],
    diagnostics: [],
  };
}

export async function loadInventoryRules(
  repositoryRoot: string,
  config: SourceTwinConfig,
): Promise<InventoryRulesResult> {
  const loaded = await Promise.all(
    (config.inventory?.rules ?? []).map((path) =>
      loadRule(repositoryRoot, path, config.inventory?.astGrepConfig)),
  );
  const rules = loaded.flatMap((result) => result.rules);
  const diagnostics = loaded.flatMap((result) => result.diagnostics);
  const counts = new Map<string, number>();
  for (const { id } of rules) counts.set(id, (counts.get(id) ?? 0) + 1);
  for (const { id } of rules.filter(({ id }) => (counts.get(id) ?? 0) > 1)) {
    diagnostics.push(diagnostic("source-twin/config.yml", `Duplicate inventory rule id: ${id}`));
  }
  const enabledKinds = new Set([
    ...config.coverage.code.entities,
    ...config.coverage.tests.entities,
  ]);
  for (const rule of rules.filter(({ kind }) => !enabledKinds.has(kind))) {
    diagnostics.push({
      code: "ST108",
      severity: "warning",
      message: `Inventory rule is not enabled by code or test coverage: ${rule.id}`,
      location: { path: rule.path },
      suggestion: `Enable ${rule.kind} in config.yml or remove the unused rule.`,
      help: "sourcetwin help rules",
    });
  }
  return { rules, diagnostics };
}
