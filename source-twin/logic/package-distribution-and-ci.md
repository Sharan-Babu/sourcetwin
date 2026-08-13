---
id: tool.package.distribution.ci
source:
  code:
    - packages/sourcetwin/package.json
    - packages/sourcetwin/src/cli.ts
    - packages/sourcetwin/src/index.ts
    - packages/sourcetwin/src/init/templates.ts
    - packages/sourcetwin/src/help/topics.ts
    - packages/sourcetwin/LICENSE
    - packages/sourcetwin/README.md
    - eslint.config.mjs
    - .github/workflows/ci.yml
  tests:
    - packages/sourcetwin/tests/package.test.ts
    - packages/sourcetwin/tests/docs.test.ts
    - packages/sourcetwin/tests/help-examples.test.ts
    - packages/sourcetwin/tests/skill-template.test.ts
---
# Package distribution and CI

The CLI is one publishable npm workspace package for Node.js 22.12.0 or newer under Apache License 2.0. Its package contains the compiled command, structural inventory dependency, license, README, and user guidance. The package exposes a small public API as well as the `sourcetwin` executable. Its metadata links to the public product website and the package directory in the project repository. The package guide explains setup, agent use, canonical files, commands, language support, and clear limits through one consistent example.

Initialized repositories receive the same agent-neutral skill and version-matched offline help. The help makes clear that coverage entity lists contain kinds such as functions or tests, while source mappings contain file paths and locators. The skill directs agents to read local guidance, propose concepts before authoring, distinguish current behavior from proposals, and review Source Twin with code and tests.

CI checks the package on Linux, macOS, and Windows. Cross-platform fixtures accept each operating system's normal line endings, allow slower package installation, and retry temporary-directory cleanup when Windows briefly retains a file handle. Repository quality also covers the product website, type checking, tests, linting, and dependency auditing. Package metadata, workflow YAML, and documentation are declarative evidence here; they are mapped as files rather than treated as function inventory.

## Test coverage

- A packed package installs, exports, and runs the complete CLI workflow.
- Help examples validate and measure against real temporary repositories.
- The initialized skill and repository copy remain identical.
- The CI matrix exercises package checks on three operating systems.
- Public guides retain the required commands, boundaries, and agreed natural punctuation.
