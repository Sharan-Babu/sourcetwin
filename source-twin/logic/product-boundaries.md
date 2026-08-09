---
id: product.boundaries
source:
  code:
    - README.md
    - package.json
    - packages/sourcetwin/README.md
    - packages/sourcetwin/package.json
    - app/product-data.ts
    - app/components/repository-overview.tsx#RepositoryOverview
    - source-twin/README.md
  tests:
    - tests/rendered-html.test.mjs#server-renders the implemented Source Twin product overview
---
# Product boundaries

Source Twin is a version-controlled, plain-language mirror of software behavior. The publishable CLI validates and measures that mirror. This repository also contains a private website that explains the product through readable copy, representative command output, interactive workflows, and a repository overview.

The website is part of this repository and product, while remaining separate from the CLI implementation. Its examples must distinguish verified current behavior from illustrative or historical evidence. The viewer, MCP, LSP, automatic generation, and other deferred capabilities remain outside the implemented product boundary.

The [CLI command workflow](cli-command-workflow.md), [package and CI behavior](package-distribution-and-ci.md), and [website experience](website-experience-and-runtime.md) describe the three connected parts in more detail.

## Test coverage

- The website renders the implemented product overview with its principal sections and boundaries.
- Repository descriptions identify the private website, publishable package, Source Twin files, and CI support.
