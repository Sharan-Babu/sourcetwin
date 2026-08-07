import { posix } from "node:path";
import type { Diagnostic, SourceLocation } from "../core/result.js";
import type { DocumentReference, ParsedMarkdown } from "../markdown/document.js";
import { existingPathInsideRoot } from "../repository/path.js";

function location(path: string, line?: number): SourceLocation {
  return line === undefined ? { path } : { path, line };
}

async function validateLink(
  root: string,
  document: ParsedMarkdown,
  reference: DocumentReference,
): Promise<Diagnostic | undefined> {
  if (
    /^[a-z][a-z0-9+.-]*:/i.test(reference.value) ||
    reference.value.startsWith("#") ||
    reference.value.startsWith("//")
  ) return undefined;
  const encodedPath = reference.value.split(/[?#]/, 1)[0] ?? "";
  if (!encodedPath) return undefined;
  let linkPath: string;
  try {
    const decoded = decodeURIComponent(encodedPath);
    linkPath = decoded.startsWith("/")
      ? posix.normalize(decoded.slice(1))
      : posix.normalize(posix.join(posix.dirname(document.path), decoded));
  } catch {
    linkPath = "../invalid-link";
  }
  const target = await existingPathInsideRoot(root, linkPath);
  if (target.exists) return undefined;
  return {
    code: "ST206",
    severity: "error",
    message: `Markdown link does not resolve: ${reference.value}`,
    location: location(document.path, reference.line),
    suggestion: "Correct the relative link or restore its target.",
  };
}

export async function validateReferences(
  root: string,
  documents: readonly ParsedMarkdown[],
  approvedTermIds: ReadonlySet<string>,
): Promise<Diagnostic[]> {
  const diagnostics: Diagnostic[] = [];
  const termPattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
  for (const document of documents) {
    for (const reference of document.termReferences) {
      if (!termPattern.test(reference.value) || !approvedTermIds.has(reference.value)) {
        diagnostics.push({
          code: "ST208",
          severity: "error",
          message: `Unknown or invalid term reference: {{${reference.value}}}`,
          location: location(document.path, reference.line),
          suggestion: "Reuse an approved term id or propose a term under source-twin/terms/.",
          help: "sourcetwin help terms",
        });
      }
    }
    for (const reference of document.missingLinkDefinitions) {
      diagnostics.push({
        code: "ST209",
        severity: "error",
        message: `Markdown link definition is missing: ${reference.value}`,
        location: location(document.path, reference.line),
        suggestion: "Add the referenced Markdown definition or use an inline link.",
      });
    }
    for (const reference of document.links) {
      const linkDiagnostic = await validateLink(root, document, reference);
      if (linkDiagnostic) diagnostics.push(linkDiagnostic);
    }
  }
  return diagnostics;
}
