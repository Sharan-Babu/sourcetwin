---
id: tool.inventory.coverage
source:
  code:
    - packages/sourcetwin/src/inventory/**
    - packages/sourcetwin/src/coverage/**
    - packages/sourcetwin/src/mappings/reference.ts
    - source-twin/config.yml
  tests:
    - packages/sourcetwin/tests/inventory.test.ts
    - packages/sourcetwin/tests/inventory-output.test.ts
    - packages/sourcetwin/tests/coverage.test.ts
    - packages/sourcetwin/tests/rules.test.ts
    - packages/sourcetwin/tests/rule-locators.test.ts
    - packages/sourcetwin/tests/structural-check.test.ts
    - packages/sourcetwin/tests/structural-command-errors.test.ts
---
# Inventory and coverage

Coverage reads the approved {{measured-scope}} and reports code and tests separately. It distinguishes exact mappings from whole-file and recursive-module evidence, then reports unmapped, broken, ambiguous, and unsupported areas.

The pinned ast-grep provider inventories {{inventory-entity}} values such as functions, methods, and supported tests across the proven languages. Version-controlled project rules can add readable entities such as routes. Other languages and file types remain path-level evidence when reliable entity extraction is unavailable.

The result is {{structural-coverage}}: deterministic evidence about connections, not a score for the quality or completeness of the English explanation. Empty scopes, parser failures, unsupported kinds, duplicate locators, and custom-rule problems have separate meanings and diagnostics.

## Test coverage

- Functions, methods, tests, custom rules, exact locators, and parser failures are inventoried.
- Direct, file-level, module-level, unmapped, broken, and unsupported results are classified independently.
- Rule captures, duplicate IDs, ambiguous locators, batching, concurrency, and provider failures are tested.
- Configuration can intentionally choose path-only coverage where entity support is not proven.
