export const DEFAULT_CONFIG = `schema: 1
coverage:
  code:
    include: []
    exclude: []
    entities: []
  tests:
    include: []
    exclude: []
    entities: []
`;

export const DEFAULT_README = `# Source Twin

This directory explains the codebase in plain language. Its canonical logic files mirror the behavior that exists in the code now.

## Writing guidance

- Use familiar words, short sentences, and the product's own terminology.
- Explain behavior and important decisions, not source syntax line by line.
- Keep each file useful to both non-technical and technical readers.
- Reuse approved terms from \`terms/\` with \`{{term-id}}\` references.
- Put meaningful verified cases in an optional \`Test coverage\` section.
- Put proposals and temporary notes in \`drafts/\`; they are not canonical behavior.
- Review Source Twin and code changes together in Git.

Adjust this guidance with the team when a different level of detail or tone is more useful.
`;

export const DEFAULT_SKILL = `---
name: source-twin
description: Maintain and use a repository's plain-language Source Twin when explaining existing behavior, planning or implementing a change, reviewing code and tests, or checking semantic coverage.
---

# Source Twin

Use \`source-twin/\` as the reviewable plain-language mirror of this repository.

## Start

1. Read \`source-twin/README.md\` for repository writing guidance.
2. Read \`source-twin/config.yml\` for measured code, test, and entity scope.
3. Run \`sourcetwin --help\` and the relevant offline help topic when a format is unfamiliar.
4. Run \`sourcetwin check\` before relying on the twin.

## Workflows

- To explain behavior, follow Markdown links and \`{{term-id}}\` references, then inspect mapped code or tests when more evidence is needed.
- For a twin-first change, edit canonical prose to the proposed next state, make the matching code and test changes, and review both diffs together.
- For a code-first change, update the affected canonical prose before finishing so it again mirrors current behavior.
- During setup, study the repository and propose conceptual files, terms, and coverage scope. Ask for approval before creating canonical logic or term files.

## Guardrails

- Keep canonical logic about current behavior. Put uncertain ideas and temporary notes in \`source-twin/drafts/\`.
- Reuse existing terms. Propose new terms explicitly and treat Git review as approval.
- Keep mappings as useful starting points, not line-by-line citations.
- Never silently convert ambiguous prose into code or claim semantic completeness from structural coverage.
- Run \`sourcetwin check\` after Source Twin edits and \`sourcetwin coverage\` when scope may have changed.

Report the understood behavior, affected code, tests, terms, validation result, remaining gaps, and any uncertainty.
`;
