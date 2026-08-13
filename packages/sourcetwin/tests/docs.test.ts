import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { parse as parseYaml } from "yaml";
import { configSchema } from "../src/config/schema.js";
import { parseMarkdownFile } from "../src/markdown/document.js";
import { logicFrontmatterSchema, termFrontmatterSchema } from "../src/markdown/schema.js";
import { createTestRepository, type TestRepository } from "./helpers/repository.js";

const publicFiles = [
  new URL("../../../README.md", import.meta.url),
  new URL("../../../CONTRIBUTING.md", import.meta.url),
  new URL("../../../SECURITY.md", import.meta.url),
  new URL("../../../CHANGELOG.md", import.meta.url),
  new URL("../README.md", import.meta.url),
] as const;

let repository: TestRepository | undefined;

afterEach(async () => {
  await repository?.cleanup();
  repository = undefined;
});

function fencedBlocks(markdown: string, language: string): readonly string[] {
  const fence = String.fromCharCode(96).repeat(3);
  const expression = new RegExp(`${fence}${language}\\r?\\n([\\s\\S]*?)${fence}`, "g");
  return [...markdown.matchAll(expression)].flatMap((match) => (
    match[1] === undefined ? [] : [match[1]]
  ));
}

function required<T>(value: T | undefined, label: string): T {
  if (value === undefined) throw new Error(`Missing ${label} documentation example.`);
  return value;
}

describe("public documentation", () => {
  it("keeps the repository and package guides complete and aligned", async () => {
    const [repositoryReadme, packageReadme] = await Promise.all([
      readFile(publicFiles[0], "utf8"),
      readFile(publicFiles[4], "utf8"),
    ]);

    expect(repositoryReadme).toContain("npx sourcetwin init");
    expect(repositoryReadme).toContain("npx sourcetwin coverage");
    expect(repositoryReadme).toContain("packages/sourcetwin/");
    expect(packageReadme).toContain("npx sourcetwin check --base main");
    expect(packageReadme).toContain("npx sourcetwin help rules");
    expect(packageReadme).toContain("renderResult(result, { json: false })");
    expect(packageReadme).toContain("Structural coverage proves");
  });

  it("validates every canonical format example against the real schemas", async () => {
    const [repositoryReadme, packageReadme] = await Promise.all([
      readFile(publicFiles[0], "utf8"),
      readFile(publicFiles[4], "utf8"),
    ]);
    const rootLogicExamples = fencedBlocks(repositoryReadme, "markdown");
    const packageExamples = fencedBlocks(packageReadme, "markdown");
    const configExamples = fencedBlocks(packageReadme, "yaml");

    expect(rootLogicExamples).toHaveLength(1);
    expect(packageExamples).toHaveLength(2);
    expect(configExamples).toHaveLength(1);

    const testRepository = await createTestRepository();
    repository = testRepository;
    const examples = [
      ["source-twin/root-example.md", required(rootLogicExamples[0], "root logic")],
      ["source-twin/package-example.md", required(packageExamples[0], "package logic")],
      ["source-twin/terms/subscription.md", required(packageExamples[1], "package term")],
    ] as const;
    const documents = await Promise.all(examples.map(async ([path, content]) => {
      await testRepository.write(path, content);
      return parseMarkdownFile(join(testRepository.root, path), path);
    }));
    const [rootLogic, packageLogic, term] = documents;

    for (const result of [required(rootLogic, "parsed root logic"), required(packageLogic, "parsed package logic")]) {
      expect(result.diagnostics).toEqual([]);
      expect(logicFrontmatterSchema.safeParse(result.document.frontmatter).success).toBe(true);
      expect(result.document).toMatchObject({ h1Count: 1, hasBody: true });
    }
    const parsedTerm = required(term, "parsed package term");
    expect(termFrontmatterSchema.safeParse(parsedTerm.document.frontmatter).success).toBe(true);
    expect(parsedTerm.document).toMatchObject({ h1Count: 1, hasBody: true });
    expect(configSchema.safeParse(parseYaml(required(configExamples[0], "configuration"))).success).toBe(true);
  });

  it("uses the agreed natural punctuation in public prose", async () => {
    const contents = await Promise.all(publicFiles.map((path) => readFile(path, "utf8")));

    for (const content of contents) {
      expect(content).not.toMatch(/[—–]/);
    }
  });
});
