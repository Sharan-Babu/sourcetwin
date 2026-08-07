import type { Diagnostic } from "../core/result.js";
import type { ParsedMarkdown } from "../markdown/document.js";

type FrontmatterSchema<T> = {
  safeParse: (value: unknown) =>
    | { success: true; data: T }
    | {
        success: false;
        error: { issues: readonly { path: PropertyKey[]; message: string }[] };
      };
};

function documentDiagnostic(
  code: string,
  document: ParsedMarkdown,
  message: string,
  help: "logic" | "terms",
): Diagnostic {
  return {
    code,
    severity: "error",
    message,
    location: { path: document.path },
    suggestion: `Follow the format in sourcetwin help ${help}.`,
    help: `sourcetwin help ${help}`,
  };
}

export function validateDocumentShape(
  document: ParsedMarkdown,
  kind: "logic" | "terms",
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  if (!document.hasFrontmatter) {
    diagnostics.push(documentDiagnostic("ST202", document, "YAML frontmatter is required.", kind));
  }
  if (document.h1Count !== 1) {
    diagnostics.push(
      documentDiagnostic("ST203", document, "Exactly one level-one heading is required.", kind),
    );
  }
  if (!document.hasBody) {
    diagnostics.push(documentDiagnostic("ST204", document, "A non-empty body is required.", kind));
  }
  return diagnostics;
}

export function validateFrontmatter<T>(
  document: ParsedMarkdown,
  schema: FrontmatterSchema<T>,
  kind: "logic" | "terms",
): { readonly value?: T; readonly diagnostics: readonly Diagnostic[] } {
  if (!document.hasFrontmatter) return { diagnostics: [] };
  const parsed = schema.safeParse(document.frontmatter);
  if (parsed.success) return { value: parsed.data, diagnostics: [] };
  return {
    diagnostics: parsed.error.issues.map((issue) =>
      documentDiagnostic(
        "ST205",
        document,
        `${issue.path.map(String).join(".") || "frontmatter"}: ${issue.message}`,
        kind,
      ),
    ),
  };
}

export function duplicateIdDiagnostics(
  entries: readonly { readonly id: string; readonly path: string }[],
): Diagnostic[] {
  const grouped = new Map<string, string[]>();
  for (const { id, path } of entries) {
    grouped.set(id, [...(grouped.get(id) ?? []), path]);
  }
  return [...grouped]
    .filter(([, paths]) => paths.length > 1)
    .flatMap(([id, paths]) =>
      paths.map((path) => ({
        code: "ST207",
        severity: "error" as const,
        message: `Duplicate Source Twin id: ${id}`,
        location: { path },
        suggestion: "Give every canonical file a stable, unique id.",
      })),
    );
}
