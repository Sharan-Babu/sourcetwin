---
id: tool.cli.workflow
source:
  code:
    - packages/sourcetwin/src/cli/**
    - packages/sourcetwin/src/commands/**
    - packages/sourcetwin/src/repository/**
    - packages/sourcetwin/src/core/result.ts
    - packages/sourcetwin/src/core/version.ts
    - packages/sourcetwin/src/output/**
    - packages/sourcetwin/src/help/topics.ts
  tests:
    - packages/sourcetwin/tests/cli.test.ts
    - packages/sourcetwin/tests/commands.test.ts
    - packages/sourcetwin/tests/execute.test.ts
    - packages/sourcetwin/tests/program.test.ts
    - packages/sourcetwin/tests/repository.test.ts
    - packages/sourcetwin/tests/path.test.ts
    - packages/sourcetwin/tests/output.test.ts
    - packages/sourcetwin/tests/result-types.test.ts
---
# CLI command workflow

The CLI finds the owning Git repository from the current directory or an explicit `--root` path. It exposes `init`, `check`, and `coverage`, plus command help and offline format topics. Each command produces the same facts as concise text or structured JSON, with an exit code that reflects whether the command could complete successfully.

`init` creates only the Source Twin foundation and refuses to overwrite it. `check` validates authored configuration, Markdown, terms, links, mappings, and exact structural locators. `coverage` measures the declared code and test scope independently. Repository discovery, path safety, command failures, and output serialization are part of the user-visible contract.

See [twin format and validation](twin-format-and-validation.md) for authored content and [inventory and coverage](inventory-and-coverage.md) for structural analysis.

## Test coverage

- Commands work from nested directories and explicit repository paths.
- Help, text, JSON, exit codes, and actionable diagnostics stay consistent.
- Repository and path errors are reported without leaking unsafe values.
- Initialization is minimal and refuses to overwrite existing work.
