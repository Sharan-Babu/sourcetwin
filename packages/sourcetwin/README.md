# Source Twin

Source Twin keeps a reviewable, plain-language mirror of a codebase inside the same Git repository. It helps people and coding agents understand current behavior, discuss changes, and review whether code, tests, and product logic still agree.

Source Twin uses ordinary Markdown, YAML, Git, and three non-interactive commands. It does not require a viewer, MCP server, or a particular coding agent.

## Requirements

- Node.js 22.12.0 or newer
- Git

## Start

Install the CLI in the project and create the minimal foundation:

```sh
npm install --save-dev sourcetwin
npm exec --offline -- sourcetwin init
```

`init` creates `source-twin/config.yml`, `source-twin/README.md`, and the canonical `source-twin/SKILL.md`. It does not invent product concepts or edit agent-specific instruction files. The coding agent should study the repository, propose the first conceptual areas, terms, and coverage scope, and ask for approval before creating canonical logic files.

Ask the user before adding a short root instruction that points an agent to `source-twin/SKILL.md`, or installing that skill through the agent's project-skill mechanism. Keep the full workflow in one canonical skill so copies cannot drift.

## Commands

- `sourcetwin init` creates the minimal foundation and refuses to overwrite it.
- `sourcetwin check` validates configuration, Markdown, terms, links, mappings, and exact locators.
- `sourcetwin check --base <git-ref>` also identifies twin-first, mapped-source-only, paired, and supporting changes against any explicit branch, tag, or commit.
- `sourcetwin coverage` reports code and test scope separately, including direct, file-level, module-level, unmapped, broken, and unsupported areas.
- `sourcetwin help config|logic|terms|rules` provides the version-matched format reference offline.

Every command supports `--root <path>` and `--json`. Coverage gaps are informational; malformed authored content and unsupported analysis setup make validation fail.

## Daily workflow

Read the repository's `source-twin/SKILL.md`, README, and config before relying on the twin. For a twin-first change, agree on the next behavior in canonical prose, implement the code and tests, then review both diffs together. For a code-first change, inspect affected mappings and restore the twin to an accurate description before finishing.

Source Twin currently inventories functions and qualified methods in JavaScript, TypeScript, Python, Go, Rust, and Java. It inventories common JavaScript, TypeScript, Python, and Go tests. Other languages retain path-level validation, and version-controlled ast-grep rules can add project entities such as routes or jobs.

Structural coverage shows what is connected. It does not prove that the plain-language explanation is complete or correct.
