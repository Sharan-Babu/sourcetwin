---
id: tool.git.review.sync
source:
  code:
    - packages/sourcetwin/src/git/**
    - packages/sourcetwin/src/commands/check.ts
    - packages/sourcetwin/src/mappings/reference.ts
  tests:
    - packages/sourcetwin/tests/git-changes.test.ts
    - packages/sourcetwin/tests/git-base-mappings.test.ts
    - packages/sourcetwin/tests/git-review.test.ts
---
# Git review and synchronization

Review compares committed, staged, unstaged, renamed, deleted, and untracked work against an explicit Git base. It never guesses the comparison revision. The result separates twin-only, mapped-source-only, paired, and supporting Source Twin changes so a reviewer can decide what needs to move together.

Current and former mappings are both useful when a logic file is renamed, deleted, or remapped. A twin-first edit may describe an approved next state temporarily. A code-first edit may leave the twin stale until the affected explanation is restored. Git makes either mismatch visible without a persistent generated status file.

This is a Git review process: the tool organizes evidence, while people and agents decide whether the prose, code, and tests actually agree.

## Test coverage

- Any explicit branch, tag, or commit can be used as the base.
- Invalid bases fail without fallback or guessed comparison behavior.
- Renames, deletions, untracked files, staged work, and historical mappings are handled.
- Review warnings classify changes without turning ordinary synchronization work into command failure.
