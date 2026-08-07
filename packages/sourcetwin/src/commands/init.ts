import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { CommandResult, Diagnostic } from "../core/result.js";
import { DEFAULT_CONFIG, DEFAULT_README, DEFAULT_SKILL } from "../init/templates.js";

interface InitData {
  readonly created: readonly string[];
  readonly integrationGuidance: string;
}

const CREATED_PATHS = [
  "source-twin/config.yml",
  "source-twin/README.md",
  "source-twin/SKILL.md",
] as const;

function failure(diagnostic: Diagnostic): CommandResult<InitData> {
  return {
    command: "init",
    ok: false,
    summary: "Source Twin was not initialized.",
    details: [],
    diagnostics: [diagnostic],
    data: { created: [], integrationGuidance: "" },
  };
}

export async function runInit(repositoryRoot: string): Promise<CommandResult<InitData>> {
  const target = join(repositoryRoot, "source-twin");
  try {
    await mkdir(target);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") {
      return failure({
        code: "ST401",
        severity: "error",
        message: "source-twin/ already exists; no files were changed.",
        location: { path: "source-twin" },
        suggestion: "Use sourcetwin check, or move the existing directory before initializing.",
      });
    }
    throw error;
  }

  try {
    for (const [name, content] of [
      ["config.yml", DEFAULT_CONFIG],
      ["README.md", DEFAULT_README],
      ["SKILL.md", DEFAULT_SKILL],
    ] as const) {
      await writeFile(join(target, name), content, { flag: "wx" });
    }
  } catch (error) {
    await rm(target, { force: true, recursive: true });
    throw error;
  }

  const integrationGuidance =
    "Ask the user before adding a short root AGENTS.md/CLAUDE.md pointer or installing the canonical skill through this agent's project-skill mechanism.";
  return {
    command: "init",
    ok: true,
    summary: "Initialized Source Twin.",
    details: [...CREATED_PATHS.map((path) => `Created ${path}`), `Next: ${integrationGuidance}`],
    diagnostics: [],
    data: { created: CREATED_PATHS, integrationGuidance },
  };
}
