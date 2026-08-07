import fastGlob from "fast-glob";
import type { Diagnostic } from "../core/result.js";
import type { LogicFrontmatter, TermFrontmatter } from "../markdown/schema.js";
import { logicFrontmatterSchema, termFrontmatterSchema } from "../markdown/schema.js";
import {
  parseMarkdownFile,
} from "../markdown/document.js";
import { parseSourceMapping, type SourceMapping } from "../mappings/reference.js";
import { fromRepositoryPath } from "../repository/path.js";
import {
  duplicateIdDiagnostics,
  validateDocumentShape,
  validateFrontmatter,
} from "./document.js";
import { validateReferences } from "./references.js";

export interface ProjectValidation {
  readonly diagnostics: readonly Diagnostic[];
  readonly logicFiles: number;
  readonly termFiles: number;
  readonly draftFiles: number;
  readonly mappings: readonly SourceMapping[];
}

export async function validateProject(repositoryRoot: string): Promise<ProjectValidation> {
  const paths = await fastGlob("source-twin/**/*.md", {
    cwd: repositoryRoot,
    dot: true,
    followSymbolicLinks: false,
    onlyFiles: true,
  });
  paths.sort();
  const parsed = await Promise.all(
    paths.map((path) => parseMarkdownFile(fromRepositoryPath(repositoryRoot, path), path)),
  );
  const diagnostics: Diagnostic[] = [];
  const mappings: SourceMapping[] = [];
  const ids: { id: string; path: string }[] = [];
  const termIds: { id: string; path: string }[] = [];
  const documents = parsed.map(({ document }) => document);
  let logicFiles = 0;
  let termFiles = 0;
  let draftFiles = 0;

  for (const result of parsed) {
    const document = result.document;
    const isDraft = document.path.startsWith("source-twin/drafts/");
    const isTerm = document.path.startsWith("source-twin/terms/");
    const reserved = document.path === "source-twin/README.md" || document.path === "source-twin/SKILL.md";
    if (isDraft) draftFiles += 1;
    if (isTerm) termFiles += 1;
    if (!isDraft && !isTerm && !reserved) logicFiles += 1;
    if (!isDraft && !reserved) diagnostics.push(...result.diagnostics);

    if (isTerm) {
      diagnostics.push(...validateDocumentShape(document, "terms"));
      const validated = validateFrontmatter<TermFrontmatter>(document, termFrontmatterSchema, "terms");
      diagnostics.push(...validated.diagnostics);
      if (validated.value) termIds.push({ id: validated.value.id, path: document.path });
    } else if (!isDraft && !reserved) {
      diagnostics.push(...validateDocumentShape(document, "logic"));
      const validated = validateFrontmatter<LogicFrontmatter>(document, logicFrontmatterSchema, "logic");
      diagnostics.push(...validated.diagnostics);
      if (validated.value) {
        ids.push({ id: validated.value.id, path: document.path });
        const sources: readonly ["code" | "tests", readonly string[]][] = [
          ["code", validated.value.source.code],
          ["tests", validated.value.source.tests ?? []],
        ];
        for (const [scope, values] of sources) {
          for (const value of values) {
            const mapping = await parseSourceMapping(value, scope, document.path, repositoryRoot);
            diagnostics.push(...mapping.diagnostics);
            if (mapping.mapping) mappings.push(mapping.mapping);
          }
        }
      }
    }
  }

  diagnostics.push(...duplicateIdDiagnostics(ids), ...duplicateIdDiagnostics(termIds));
  const approvedTerms = new Set(termIds.map(({ id }) => id));
  diagnostics.push(...await validateReferences(repositoryRoot, documents, approvedTerms));

  return { diagnostics, logicFiles, termFiles, draftFiles, mappings };
}
