import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { DEFAULT_SKILL } from "../src/init/templates.js";

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

describe("canonical agent skill", () => {
  it("keeps this repository on the exact skill shipped by init", async () => {
    const skill = await readFile(join(repositoryRoot, "source-twin", "SKILL.md"), "utf8");

    expect(skill).toBe(DEFAULT_SKILL);
  });
});
