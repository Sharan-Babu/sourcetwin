# Contributing to Source Twin

Thank you for helping improve Source Twin.

## Before you start

For a meaningful behavior or format change, open an issue first. Explain the user problem and the smallest useful outcome. This avoids building a solution before the product decision is clear.

Small fixes can go directly to a pull request.

## Local setup

Use Node.js 22.13 or newer and Git.

```sh
npm install
npm run quality
```

The quality command lints, type-checks, builds, and tests the website and CLI package.
Use `npm run preview` when a website change also needs verification in the Cloudflare Workers runtime.

## Working agreements

- Keep public language natural, concise, and easy to understand.
- Prefer focused modules and simple designs over speculative abstractions.
- Use established libraries when they solve the problem well.
- Add tests for behavior and meaningful edge cases.
- Update `source-twin/` when a change affects described behavior, scope, or product boundaries.
- Keep generated files and unrelated refactors out of the change.

## Pull requests

Describe the problem, the chosen behavior, and how you verified it. Call out remaining uncertainty or deliberate limitations. Keep the Source Twin, code, and tests reviewable together when they are related.
