import { readFile } from "node:fs/promises";
import type { Root } from "mdast";
import { toString } from "mdast-util-to-string";
import remarkFrontmatter from "remark-frontmatter";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import { parseDocument } from "yaml";
import type { Diagnostic } from "../core/result.js";

export interface DocumentReference {
  readonly value: string;
  readonly line?: number;
}

export interface ParsedMarkdown {
  readonly path: string;
  readonly hasFrontmatter: boolean;
  readonly frontmatter?: unknown;
  readonly h1Count: number;
  readonly hasBody: boolean;
  readonly links: readonly DocumentReference[];
  readonly missingLinkDefinitions: readonly DocumentReference[];
  readonly termReferences: readonly DocumentReference[];
}

interface YamlNode {
  readonly type: "yaml";
  readonly value: string;
  readonly position?: { readonly start: { readonly line: number } };
}

function lineOf(node: { readonly position?: unknown }): number | undefined {
  return (node.position as { readonly start?: { readonly line?: number } } | undefined)
    ?.start?.line;
}

function reference(value: string, node: { readonly position?: unknown }): DocumentReference {
  const line = lineOf(node);
  return { value, ...(line === undefined ? {} : { line }) };
}

function parseFrontmatter(node: YamlNode, path: string): {
  readonly value?: unknown;
  readonly diagnostic?: Diagnostic;
} {
  const document = parseDocument(node.value, { prettyErrors: false, uniqueKeys: true });
  const error = document.errors[0];
  if (error) {
    return {
      diagnostic: {
        code: "ST201",
        severity: "error",
        message: `Invalid YAML frontmatter: ${error.message}`,
        location: { path, line: node.position?.start.line ?? 1 },
        suggestion: "Correct the frontmatter YAML.",
      },
    };
  }
  return { value: document.toJS() as unknown };
}

export async function parseMarkdownFile(
  absolutePath: string,
  repositoryPath: string,
): Promise<{ readonly document: ParsedMarkdown; readonly diagnostics: readonly Diagnostic[] }> {
  const source = await readFile(absolutePath, "utf8");
  const tree = unified().use(remarkParse).use(remarkFrontmatter, ["yaml"]).parse(source) as Root;
  const first = tree.children[0] as Root["children"][number] | undefined;
  const yamlNode = first?.type === "yaml" ? (first as unknown as YamlNode) : undefined;
  const frontmatter = yamlNode ? parseFrontmatter(yamlNode, repositoryPath) : {};
  const links: DocumentReference[] = [];
  const definitions = new Set<string>();
  const references: DocumentReference[] = [];
  const termReferences: DocumentReference[] = [];
  let h1Count = 0;

  visit(tree, (node) => {
    if (node.type === "heading" && node.depth === 1) h1Count += 1;
    if (node.type === "link" || node.type === "image" || node.type === "definition") {
      links.push(reference(node.url, node));
    }
    if (node.type === "definition") definitions.add(node.identifier.toLowerCase());
    if (node.type === "linkReference" || node.type === "imageReference") {
      references.push(reference(node.identifier.toLowerCase(), node));
    }
    if (node.type === "text") {
      for (const match of node.value.matchAll(/\[[^\]]+\]\[([^\]]+)\]/g)) {
        references.push(reference(match[1]?.toLowerCase() ?? "", node));
      }
      for (const match of node.value.matchAll(/\{\{([^{}]*)\}\}/g)) {
        termReferences.push(reference(match[1]?.trim() ?? "", node));
      }
    }
  });

  const bodyText = tree.children
    .filter((node) => node.type !== "yaml" && node.type !== "heading")
    .map((node) => toString(node))
    .join(" ")
    .trim();

  return {
    document: {
      path: repositoryPath,
      hasFrontmatter: yamlNode !== undefined,
      ...(frontmatter.value === undefined ? {} : { frontmatter: frontmatter.value }),
      h1Count,
      hasBody: bodyText.length > 0,
      links,
      missingLinkDefinitions: references.filter(({ value }) => !definitions.has(value)),
      termReferences,
    },
    diagnostics: frontmatter.diagnostic ? [frontmatter.diagnostic] : [],
  };
}
