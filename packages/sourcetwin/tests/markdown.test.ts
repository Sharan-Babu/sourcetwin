import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LOGIC_EXAMPLE, TERM_EXAMPLE } from "../src/help/topics.js";
import { parseMarkdownFile } from "../src/markdown/document.js";
import { logicFrontmatterSchema, termFrontmatterSchema } from "../src/markdown/schema.js";
import { createTestRepository, type TestRepository } from "./helpers/repository.js";

let repository: TestRepository;

beforeEach(async () => {
  repository = await createTestRepository();
});

afterEach(async () => {
  await repository.cleanup();
});

async function parse(path: string, content: string) {
  await repository.write(path, content);
  return parseMarkdownFile(join(repository.root, ...path.split("/")), path);
}

describe("Markdown documents", () => {
  it("keeps documented logic and term examples aligned with their schemas", async () => {
    const logic = await parse("source-twin/subscriptions.md", LOGIC_EXAMPLE);
    const term = await parse("source-twin/terms/subscription.md", TERM_EXAMPLE);

    expect(logicFrontmatterSchema.safeParse(logic.document.frontmatter).success).toBe(true);
    expect(termFrontmatterSchema.safeParse(term.document.frontmatter).success).toBe(true);
    expect(logic.document).toMatchObject({ h1Count: 1, hasBody: true });
    expect(term.document).toMatchObject({ h1Count: 1, hasBody: true });
  });

  it("collects real links, missing definitions, and prose term references", async () => {
    const result = await parse(
      "source-twin/logic/example.md",
      `---\nid: example\nsource:\n  code: [src/example.ts]\n---\n# Example\n\nSee [another](another.md), [defined][ok], and [missing][no]. Use {{approved-term}} but ignore \`{{code-term}}\`.\n\n[ok]: ../README.md\n`,
    );

    expect(result.document.links.map(({ value }) => value)).toEqual([
      "another.md",
      "../README.md",
    ]);
    expect(result.document.missingLinkDefinitions).toEqual([
      { value: "no", line: 8 },
    ]);
    expect(result.document.termReferences).toEqual([
      { value: "approved-term", line: 8 },
    ]);
  });

  it("reports invalid frontmatter YAML", async () => {
    const result = await parse(
      "source-twin/broken.md",
      "---\nid: [\n---\n# Broken\n\nBody.\n",
    );

    expect(result.diagnostics[0]).toMatchObject({ code: "ST201" });
    expect(result.document.hasFrontmatter).toBe(true);
  });

  it("does not count headings as body text", async () => {
    const result = await parse(
      "source-twin/empty.md",
      "---\nid: empty\nsource:\n  code: [src/empty.ts]\n---\n# Empty\n\n## Test coverage\n",
    );

    expect(result.document.hasBody).toBe(false);
  });
});
