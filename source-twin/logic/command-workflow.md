---
id: tool.command.workflow
source:
  code:
    - packages/sourcetwin/src/cli/program.ts
    - packages/sourcetwin/src/commands/**
    - packages/sourcetwin/src/validation/**
  tests:
    - packages/sourcetwin/tests/cli.test.ts
    - packages/sourcetwin/tests/commands.test.ts
    - packages/sourcetwin/tests/validation.test.ts
---
# Source Twin command workflow

Source Twin maintains a {{semantic-twin}} within the Git repository that owns the code. Commands find that repository from the current directory or an explicit path.

`init` creates only the configuration, writing guidance, and portable agent skill. It never replaces an existing Source Twin and leaves the choice of concepts and terms to the user and agent.

`check` verifies configuration, {{canonical-logic}}, terms, links, and authored source starting points. It fails when those artifacts are malformed or broken.

`coverage` measures the declared code and test scope separately. It reports direct, whole-file, recursive-module, unmapped, broken, and unsupported areas without treating ordinary coverage gaps as command failures.

## Test coverage

- Initialization is minimal and refuses to overwrite existing work.
- Commands work from nested directories and explicit repository paths.
- Text and JSON results expose the same command facts.
- Invalid authored artifacts fail checks while ordinary coverage gaps remain informational.
