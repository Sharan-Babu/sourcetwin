---
id: tool.distribution.integration
source:
  code:
    - packages/sourcetwin/package.json
    - packages/sourcetwin/src/init/templates.ts
    - packages/sourcetwin/src/help/topics.ts
    - source-twin/SKILL.md
    - .github/workflows/ci.yml
  tests:
    - packages/sourcetwin/tests/package.test.ts
    - packages/sourcetwin/tests/help-examples.test.ts
    - packages/sourcetwin/tests/skill-template.test.ts
---
# Distribution and agent integration

Source Twin is distributed as one npm package for Node.js 22.12.0 or newer. The installed package contains the command-line program, its structural inventory engine, license, and user guidance.

Every initialized repository receives one canonical, agent-neutral skill. The command explains that an agent must ask before adding a short root pointer or using an agent-specific project-skill mechanism. Agent-specific files should point to the canonical skill instead of copying its full workflow.

The skill covers setup, explanation, twin-first changes, code-first changes, and review against an explicit Git base. It requires agents to report behavior, affected code and tests, terms, validation, remaining gaps, and uncertainty.

Offline help and initialized templates ship with the CLI version that validates them. Continuous integration verifies the package on Linux, macOS, and Windows, while the full repository also runs its website and dependency checks on Linux.

## Test coverage

- The packed npm artifact installs and runs its complete command workflow.
- The documented logic, term, and project-rule examples pass real validation and inventory.
- This repository's canonical skill must exactly match the skill created by `init`.
- Package tests run on all three major development operating systems.
