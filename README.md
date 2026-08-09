# Source Twin

Source Twin keeps a plain-language mirror of a codebase inside the same Git repository. People and coding agents use it to understand behavior, plan changes, and review whether the code, tests, and product logic still agree.

The mirror is made of ordinary Markdown. It stays useful without a separate viewer, service, or agent platform.

## What it looks like

A Source Twin file explains one meaningful area of the product and points to a few useful places in the code and tests.

```markdown
---
id: subscriptions.cancellation
source:
  code:
    - src/subscriptions.ts#cancelSubscription
  tests:
    - tests/subscriptions.test.ts#annual customer cancellation waits for renewal
---
# Cancel a subscription

A customer cancelling an annual {{subscription}} keeps access until renewal.
Monthly customer cancellations and all administrator cancellations happen immediately.

## Test coverage

- Repeating a scheduled cancellation keeps the original date.
- A scheduled cancellation becomes final at renewal.
```

The English stays readable on its own. The source references give a coding agent precise places to investigate when more detail is needed.

## Why use it

- Help non-technical and technical teammates understand the same behavior.
- Give coding agents durable product context instead of repeating it in prompts.
- Agree on a behavior change in English before implementation.
- Bring an existing twin up to date after code changes.
- See which code and tests are connected to the twin, and which are not.
- Review logic, implementation, and tests together in Git.

Source Twin does not generate prose or code automatically. Modern coding agents still do the reading and implementation work. Source Twin gives them shared language, reviewable files, and deterministic checks.

## Quick start

Source Twin requires Node.js 22.12 or newer and Git.

```sh
npm install --save-dev sourcetwin
npx sourcetwin init
```

`init` creates a minimal `source-twin/` directory with configuration, writing guidance, and a portable `SKILL.md`. It does not invent product concepts. Ask your coding agent to read the skill, study the repository, and propose the first logic areas, terms, and coverage scope for your approval.

Once the first area exists:

```sh
npx sourcetwin check
npx sourcetwin coverage
npx sourcetwin check --base main
```

`check` validates the authored twin. `coverage` measures the configured code and test scope. `check --base` also helps review whether related twin and implementation changes moved together against any branch, tag, or commit you choose.

See the [CLI guide](packages/sourcetwin/README.md) for the full workflow, file formats, language support, and agent integration.

## Current scope

The first release includes:

- `init`, `check`, and `coverage`
- flexible Markdown and strict, short YAML frontmatter
- shared product terms such as `{{subscription}}`
- function, whole-file, and recursive-module mappings
- separate structural coverage for code and tests
- Git-aware review against an explicit revision
- equivalent text and JSON output
- offline format help
- one portable, agent-neutral skill

Entity-level support is proven for JavaScript, TypeScript, Python, Go, Rust, and Java code. Common JavaScript, TypeScript, Python, and Go tests are also supported. Other languages still receive path-level validation. Repository-owned ast-grep rules can add readable entities such as routes or background jobs.

Structural coverage shows what is connected. It does not prove that an English explanation is complete or correct.

## This repository

This repository contains both parts of the project:

- `packages/sourcetwin/` contains the publishable npm package.
- `app/` contains the product website and interactive example.
- `source-twin/` is Source Twin's own readable mirror.
- `tests/` and `packages/sourcetwin/tests/` cover the website and CLI.

To work on the project:

```sh
npm install
npm run dev
npm run quality
```

`npm run quality` lints, type-checks, builds, and tests the whole repository.

## Project information

- [Contributing](CONTRIBUTING.md)
- [Security](SECURITY.md)
- [Changelog](CHANGELOG.md)
- [ISC license](LICENSE)
