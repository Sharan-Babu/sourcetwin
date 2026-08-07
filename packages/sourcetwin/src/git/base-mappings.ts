import { availableParallelism } from "node:os";
import { execa } from "execa";
import pLimit from "p-limit";
import { parseMarkdown } from "../markdown/document.js";
import { logicFrontmatterSchema } from "../markdown/schema.js";
import { parseSourceMapping, type SourceMapping } from "../mappings/reference.js";
import type { GitComparison } from "./changes.js";
import { changedCanonicalLogicFiles } from "./twin-paths.js";

export const BASE_MAPPING_PROCESS_LIMIT = Math.max(1, Math.min(availableParallelism(), 8));
const limitBaseRead = pLimit(BASE_MAPPING_PROCESS_LIMIT);

async function readBaseFile(
  repositoryRoot: string,
  commit: string,
  path: string,
): Promise<string | undefined> {
  const tree = await execa(
    "git",
    ["ls-tree", "-z", "--full-tree", commit, "--", `:(literal)${path}`],
    { cwd: repositoryRoot, stripFinalNewline: false },
  );
  const record = tree.stdout.split("\0").find(Boolean);
  const tab = record?.indexOf("\t") ?? -1;
  const metadata = tab === -1 ? [] : record!.slice(0, tab).split(" ");
  if (metadata[1] !== "blob" || !metadata[2]) return undefined;
  const blob = await execa("git", ["cat-file", "blob", metadata[2]], {
    cwd: repositoryRoot,
    stripFinalNewline: false,
  });
  return blob.stdout;
}

async function mappingsFromDocument(
  repositoryRoot: string,
  sourceTwinPath: string,
  source: string,
): Promise<SourceMapping[]> {
  const parsed = parseMarkdown(source, sourceTwinPath);
  const frontmatter = logicFrontmatterSchema.safeParse(parsed.document.frontmatter);
  if (!frontmatter.success) return [];
  const references: readonly ["code" | "tests", readonly string[]][] = [
    ["code", frontmatter.data.source.code],
    ["tests", frontmatter.data.source.tests ?? []],
  ];
  const mappings = await Promise.all(references.flatMap(([scope, values]) =>
    values.map((value) => parseSourceMapping(
      value,
      scope,
      sourceTwinPath,
      repositoryRoot,
    ))));
  return mappings.flatMap(({ mapping }) => mapping ? [mapping] : []);
}

export async function loadBaseMappings(
  repositoryRoot: string,
  comparison: GitComparison,
): Promise<SourceMapping[]> {
  const loaded = await Promise.all(changedCanonicalLogicFiles(comparison.changes)
    .filter((change): change is { reviewPath: string; basePath: string } =>
      change.basePath !== undefined)
    .map(({ reviewPath, basePath }) => limitBaseRead(async () => {
      const source = await readBaseFile(repositoryRoot, comparison.commit, basePath);
      return source
        ? mappingsFromDocument(repositoryRoot, reviewPath, source)
        : [];
    })));
  return loaded.flat();
}
