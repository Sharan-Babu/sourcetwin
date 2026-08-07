# Source Twin

Source Twin is a version-controlled, plain-language semantic mirror of a software codebase. It helps people and coding agents understand, change, and review software through ordinary Markdown connected to code and tests.

This repository contains the publishable `sourcetwin` CLI workspace and a local interactive product prototype.

## CLI

The package lives in `packages/sourcetwin/`. Its README contains installation, command, agent-integration, and supported-language guidance.

## Develop

```bash
npm install
npm run dev
```

Use `npm run quality` to lint, type-check, build, and test the website and CLI package.
