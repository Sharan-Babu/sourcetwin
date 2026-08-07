---
id: tool.formats.mappings
source:
  code:
    - packages/sourcetwin/src/config/**
    - packages/sourcetwin/src/markdown/**
    - packages/sourcetwin/src/mappings/**
    - packages/sourcetwin/src/coverage/**
  tests:
    - packages/sourcetwin/tests/config.test.ts
    - packages/sourcetwin/tests/markdown.test.ts
    - packages/sourcetwin/tests/mappings.test.ts
    - packages/sourcetwin/tests/coverage.test.ts
---
# Formats and path mappings

Repository schema 1 uses strict YAML configuration and flexible Markdown files with short YAML frontmatter. Logic files have a stable ID, one title, a useful body, and at least one code starting point. Term files define a unique shared concept that prose can reuse through readable double-curly references.

Source starting points can identify one readable locator, a whole file, or every file below a directory. In path-only mode, Source Twin verifies that these paths remain inside the repository and still exist. It does not claim that structural presence proves the explanation is complete.

Drafts remain outside {{canonical-logic}} and coverage, but their approved term references and Markdown links must still work.

## Test coverage

- Unknown schema fields, unsupported schemas, malformed YAML, and escaping paths are rejected.
- Logic and term shape, duplicate IDs, term references, and local links are checked.
- Missing files, wrong target types, and symlinks outside the repository are rejected.
- Includes, excludes, mapping breadth, gaps, and unsupported entity requests are counted independently.
