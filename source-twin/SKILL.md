---
name: source-twin
description: Maintain and use a repository's plain-language Source Twin when explaining existing behavior, planning or implementing a change, reviewing code and tests, or checking semantic coverage.
---

# Source Twin

Use `source-twin/` as the reviewable plain-language mirror of this repository.

## Start

1. Read `source-twin/README.md` for repository writing guidance.
2. Read `source-twin/config.yml` for measured code, test, and entity scope.
3. Run `npm exec --offline -- sourcetwin --help` and the relevant offline help topic when a format is unfamiliar.
4. Run `npm exec --offline -- sourcetwin check` before relying on the twin.

## Workflows

- Setup: study the repository, then propose conceptual areas, terms, and coverage scope. Ask for approval before creating canonical logic or term files.
- Explanation: follow Markdown links and `{{term-id}}` references. Inspect mapped code and tests when more evidence is needed, and distinguish verified behavior from uncertainty.
- Twin-first: clarify ambiguous intent, edit canonical prose to the proposed next state, then make the matching code and test changes.
- Code-first: inspect the changed source and its mappings, then update affected canonical prose before finishing so it again mirrors current behavior.
- Review: use `npm exec --offline -- sourcetwin check --base <git-ref>` with the explicit branch, tag, or commit chosen for the review. Inspect twin-only, mapped-source-only, paired, and supporting changes; never guess the base.

## Guardrails

- Keep canonical logic about current behavior. Put uncertain ideas and temporary notes in `source-twin/drafts/`.
- Reuse existing terms. Propose new terms explicitly and treat Git review as approval.
- Keep mappings as useful starting points, not line-by-line citations.
- Never silently convert ambiguous prose into code or claim semantic completeness from structural coverage.
- Run `npm exec --offline -- sourcetwin check` after Source Twin edits and `npm exec --offline -- sourcetwin coverage` when scope may have changed.
- Review Source Twin, code, and test diffs together before treating them as synchronized.

Report the understood behavior, affected code, tests, terms, validation result, remaining gaps, and any uncertainty.
