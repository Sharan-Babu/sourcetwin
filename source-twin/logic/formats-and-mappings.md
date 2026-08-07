---
id: tool.formats.mappings
source:
  code:
    - packages/sourcetwin/src/config/**
    - packages/sourcetwin/src/markdown/**
    - packages/sourcetwin/src/mappings/**
    - packages/sourcetwin/src/coverage/**
    - packages/sourcetwin/src/inventory/**
  tests:
    - packages/sourcetwin/tests/config.test.ts
    - packages/sourcetwin/tests/markdown.test.ts
    - packages/sourcetwin/tests/mappings.test.ts
    - packages/sourcetwin/tests/coverage.test.ts
    - packages/sourcetwin/tests/inventory.test.ts
    - packages/sourcetwin/tests/rules.test.ts
---
# Formats and path mappings

Repository schema 1 uses strict YAML configuration and flexible Markdown files with short YAML frontmatter. Logic files have a stable ID, one title, a useful body, and at least one code starting point. Term files define a unique shared concept that prose can reuse through readable double-curly references.

The same Markdown rules are used for current files and for former logic read from an explicit Git base. This lets review retain authored mappings when a logic file is deleted, renamed, or remapped.

Source starting points can identify one readable locator, a whole file, or every file below a directory. The pinned ast-grep CLI inventories functions and qualified methods in JavaScript, TypeScript, Python, Go, Rust, and Java. It also inventories common JavaScript, TypeScript, Python, and Go tests. Project rules can add readable entities such as routes. Unsupported languages and kinds retain path-level validation. Structural presence never proves that an explanation is complete.

Drafts remain outside {{canonical-logic}} and coverage, but their approved term references and Markdown links must still work.

## Test coverage

- Unknown schema fields, unsupported schemas, malformed YAML, and escaping paths are rejected.
- Logic and term shape, duplicate IDs, term references, and local links are checked.
- Missing files, wrong target types, and symlinks outside the repository are rejected.
- Includes, excludes, mapping breadth, gaps, and unsupported entity requests are counted independently.
- Functions, tests, custom rule entities, parser errors, and exact locators are inventoried deterministically.
