---
id: tool.twin.format.validation
source:
  code:
    - packages/sourcetwin/src/config/**
    - packages/sourcetwin/src/markdown/**
    - packages/sourcetwin/src/mappings/**
    - packages/sourcetwin/src/validation/**
    - source-twin/README.md
    - source-twin/SKILL.md
  tests:
    - packages/sourcetwin/tests/config.test.ts
    - packages/sourcetwin/tests/markdown.test.ts
    - packages/sourcetwin/tests/mappings.test.ts
    - packages/sourcetwin/tests/validation.test.ts
    - packages/sourcetwin/tests/skill-template.test.ts
---
# Source Twin format and validation

Repository schema 1 uses strict YAML configuration and ordinary Markdown with short frontmatter. A canonical logic file has a stable ID, one title, a useful body, and at least one code starting point. A term file defines one shared concept. Drafts can hold uncertain or proposed material without becoming current behavior.

Mappings point to a readable function or method, a whole file, or a recursive module. Markdown links and `{{term-id}}` references are checked. Missing files, wrong target types, unsafe paths, malformed frontmatter, duplicate IDs, unknown fields, and stale exact locators produce actionable diagnostics.

The format is a reviewable explanation, not generated source. Structural links show where to begin investigation; they do not prove that the explanation is complete.

## Test coverage

- Schema and frontmatter examples are validated against the same rules used by the CLI.
- Terms, links, mappings, drafts, duplicate IDs, and malformed documents are checked.
- Missing targets, wrong target types, outside-repository symlinks, and stale references are rejected.
- The repository skill stays identical to the skill produced by `init`.
