import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_CONFIG, DEFAULT_README, DEFAULT_SKILL } from "../src/init/templates.js";
import { validateProject } from "../src/validation/project.js";
import { createTestRepository, type TestRepository } from "./helpers/repository.js";

let repository: TestRepository;

beforeEach(async () => {
  repository = await createTestRepository();
  await Promise.all([
    repository.write("source-twin/config.yml", DEFAULT_CONFIG),
    repository.write("source-twin/README.md", DEFAULT_README),
    repository.write("source-twin/SKILL.md", DEFAULT_SKILL),
    repository.write("src/subscriptions.ts", "export function cancelSubscription() {}\n"),
    repository.write("tests/subscriptions.test.ts", "test('cancels', () => {})\n"),
  ]);
});

afterEach(async () => {
  await repository.cleanup();
});

async function writeValidDocuments() {
  await repository.write(
    "source-twin/terms/subscription.md",
    "---\nid: subscription\n---\n# Subscription\n\nContinuing paid access.\n",
  );
  await repository.write(
    "source-twin/logic/cancellation.md",
    `---\nid: subscriptions.cancellation\nsource:\n  code: [src/subscriptions.ts#cancelSubscription]\n  tests: [tests/subscriptions.test.ts#cancels]\n---\n# Cancellation\n\nA {{subscription}} can be cancelled. See [the term](../terms/subscription.md).\n`,
  );
}

describe("project validation", () => {
  it("validates canonical logic, terms, mappings, and non-canonical drafts", async () => {
    await writeValidDocuments();
    await repository.write(
      "source-twin/drafts/change.md",
      "---\nanything: is allowed\n---\n# Idea\n\nMaybe change {{subscription}}. See [logic](../logic/cancellation.md).\n",
    );

    const result = await validateProject(repository.root);
    expect(result.diagnostics).toEqual([]);
    expect(result).toMatchObject({ logicFiles: 1, termFiles: 1, draftFiles: 1 });
    expect(result.mappings).toHaveLength(2);
  });

  it("reports canonical shape and strict frontmatter errors", async () => {
    await repository.write(
      "source-twin/broken.md",
      "---\nid: Bad ID\nextra: true\n---\n# First\n# Second\n",
    );

    const result = await validateProject(repository.root);
    expect(result.diagnostics.map(({ code }) => code)).toEqual(
      expect.arrayContaining(["ST203", "ST204", "ST205"]),
    );
  });

  it("reports absent and invalid YAML frontmatter", async () => {
    await repository.write("source-twin/no-metadata.md", "# No metadata\n\nBody.\n");
    await repository.write(
      "source-twin/invalid-yaml.md",
      "---\nid: [\n---\n# Invalid YAML\n\nBody.\n",
    );

    const result = await validateProject(repository.root);
    expect(result.diagnostics.map(({ code }) => code)).toEqual(
      expect.arrayContaining(["ST201", "ST202", "ST205"]),
    );
  });

  it("reports duplicate logic and term ids", async () => {
    await writeValidDocuments();
    await repository.write(
      "source-twin/another.md",
      "---\nid: subscriptions.cancellation\nsource:\n  code: [src/subscriptions.ts]\n---\n# Another\n\nBody.\n",
    );
    await repository.write(
      "source-twin/terms/second.md",
      "---\nid: subscription\n---\n# Second\n\nDefinition.\n",
    );

    const result = await validateProject(repository.root);
    expect(result.diagnostics.filter(({ code }) => code === "ST207")).toHaveLength(4);
  });

  it("does not approve invalid terms or keep malformed source mappings", async () => {
    await repository.write(
      "source-twin/terms/subscription.md",
      "---\nid: Bad Term\n---\n# Subscription\n\nContinuing paid access.\n",
    );
    await repository.write(
      "source-twin/logic/cancellation.md",
      "---\nid: subscriptions.cancellation\nsource:\n  code: [src/*.ts]\n---\n# Cancellation\n\nA {{subscription}} can be cancelled.\n",
    );

    const result = await validateProject(repository.root);
    expect(result.mappings).toEqual([]);
    expect(result.diagnostics.map(({ code }) => code))
      .toEqual(expect.arrayContaining(["ST205", "ST301", "ST208"]));
  });

  it("reports unknown terms and broken inline or reference links", async () => {
    await writeValidDocuments();
    await repository.write(
      "source-twin/drafts/broken.md",
      "# Broken\n\nUse {{Unknown Term}}, [missing](%ZZ), and [undefined][nowhere].\n",
    );

    const result = await validateProject(repository.root);
    expect(result.diagnostics.map(({ code }) => code)).toEqual(
      expect.arrayContaining(["ST206", "ST208", "ST209"]),
    );
  });

  it("allows external, root-relative, and same-document links", async () => {
    await writeValidDocuments();
    await repository.write(
      "source-twin/drafts/links.md",
      "# Links\n\n[Web](https://example.com) [Protocol](//example.com) [Root](/source-twin/README.md) [Here](#links) [Query](?view=details)\n",
    );

    const result = await validateProject(repository.root);
    expect(result.diagnostics).toEqual([]);
  });
});
