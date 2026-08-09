# Source Twin

Source Twin keeps a reviewable, plain-language mirror of a codebase inside the same Git repository. It helps people and coding agents understand current behavior, agree on changes, and review whether code, tests, and product logic still match.

It uses ordinary Markdown, YAML, Git, and three non-interactive commands. It does not require a viewer, MCP server, or a particular coding agent.

## Requirements

- Node.js 22.12 or newer
- Git

## Install

Install Source Twin in the repository you want to describe:

```sh
npm install --save-dev sourcetwin
npx sourcetwin init
```

`init` creates only:

```text
source-twin/
├── README.md
├── SKILL.md
└── config.yml
```

It refuses to overwrite an existing twin. It does not invent product concepts or change agent-specific instruction files.

## Start with your coding agent

Ask the agent to read `source-twin/SKILL.md`, the repository-specific README, and the config. Then ask it to study the repository and propose:

1. The first few conceptual logic files.
2. Shared terms worth defining once.
3. The code and test scope that coverage should measure.

Approve that proposal before the agent creates canonical logic. This keeps the product structure under human control.

If your agent needs a root-level pointer or an installed project skill, `init` prints integration guidance. Ask before adding that pointer. Keep the complete workflow in the one canonical `source-twin/SKILL.md` so copies cannot drift.

## A logic file

```markdown
---
id: subscriptions.cancellation
source:
  code:
    - src/subscriptions.ts#cancelSubscription
  tests:
    - tests/subscriptions.test.ts#annual customer cancellation waits for renewal
---
# Cancel a subscription

A customer cancelling an annual {{subscription}} keeps access until renewal.
Monthly customer cancellations and all administrator cancellations happen immediately.

## Test coverage

- Repeating a scheduled cancellation keeps the original date.
- A scheduled cancellation becomes final at renewal.
```

The file mirrors current behavior. During a twin-first change it can temporarily describe the approved next state while code and tests catch up.

Shared terms live under `source-twin/terms/`:

```markdown
---
id: subscription
---
# Subscription

A customer's continuing access to a paid product or service.
```

Use normal Markdown links between logic files and `{{subscription}}` when the shared term should keep the same meaning across the twin.

## Configure measured scope

`source-twin/config.yml` controls which code, tests, and entity types coverage inspects.

```yaml
schema: 1
coverage:
  code:
    include: [src/**/*.ts]
    exclude: []
    entities: [function]
  tests:
    include: [tests/**/*.test.ts]
    exclude: []
    entities: [test]
```

The `entities` lists contain kinds such as `function` or `test`, never file paths or source locators. An empty list requests path-only coverage. Coverage scope is separate for code and tests.

## Commands

### `sourcetwin init`

Creates the minimal Source Twin foundation. It fails if `source-twin/` already exists.

### `sourcetwin check`

Validates configuration, Markdown, terms, links, mappings, inventory rules, and exact locators.

```sh
npx sourcetwin check
npx sourcetwin check --base main
```

With `--base <git-ref>`, check also reports twin-only, mapped-source-only, paired, setup, and supporting changes. The comparison can be any branch, tag, or commit. Source Twin never guesses it.

### `sourcetwin coverage`

Inventories the configured code and test scope independently.

```sh
npx sourcetwin coverage
```

It reports direct, file-level, module-level, unmapped, broken, and unsupported areas. Gaps are informational. Invalid configuration or failed analysis still makes the command fail.

### Offline help

```sh
npx sourcetwin help config
npx sourcetwin help logic
npx sourcetwin help terms
npx sourcetwin help rules
```

The help matches the installed CLI version. Every command also supports `--help`, `--root <path>`, and `--json`.

## Daily workflows

For a twin-first change:

1. Agree on the next behavior in the canonical English file.
2. Review that intent in Git.
3. Implement the code and tests.
4. Run `check`, `coverage`, and the project tests.
5. Review the twin, code, and tests together.

For a code-first change:

1. Inspect changed code and tests against an explicit Git base.
2. Use existing mappings to find the affected logic.
3. Update only the passages that no longer describe current behavior.
4. Validate and review both sides together.

## Language support

| Language | Code entities | Test entities |
| --- | --- | --- |
| JavaScript and TypeScript | Functions and methods | Common `test` and `it` cases |
| Python | Functions and methods | Pytest-style tests |
| Go | Functions and methods | Go tests |
| Rust and Java | Functions and methods | Path-level validation |
| Other languages | Path-level validation | Path-level validation |

Project-owned ast-grep rules can add readable entity types such as `POST /subscriptions/cancel` or a background job. Source Twin does not expose arbitrary executable plugins in the first release.

## Programmatic output

The package exports the typed `CommandResult` contract and two small helpers. This lets another tool render the same text or JSON and use the same success exit code without reimplementing Source Twin output.

```ts
import { exitCodeFor, renderResult, type CommandResult } from "sourcetwin";

const result: CommandResult = {
  command: "example",
  ok: true,
  summary: "Source Twin is valid.",
  details: [],
  diagnostics: [],
  data: {},
};

process.stdout.write(renderResult(result, { json: false }));
process.exitCode = exitCodeFor(result);
```

The analysis commands are not part of this public API. Use the CLI when you need to initialize, validate, or measure a repository.

## Important limits

- Structural coverage proves that source or tests are connected to the twin. It does not prove the English is complete or correct.
- Source Twin does not silently turn prose into code.
- Source Twin does not automatically write or refresh canonical files.
- A coding agent and human still review meaning, uncertainty, and product decisions.
