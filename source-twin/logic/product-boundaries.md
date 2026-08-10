---
id: product.boundaries
source:
  code:
    - README.md
    - CONTRIBUTING.md
    - SECURITY.md
    - CHANGELOG.md
    - LICENSE
    - package.json
    - packages/sourcetwin/README.md
    - packages/sourcetwin/package.json
    - app/components/launch-overview.tsx#LaunchOverview
    - source-twin/README.md
  tests:
    - tests/rendered-html.test.mjs#server-renders the focused Source Twin launch website
    - packages/sourcetwin/tests/docs.test.ts
---
# Product boundaries

Source Twin is a version-controlled, plain-language mirror of software behavior. The publishable CLI validates and measures that mirror. This repository also contains a private website with a simple Source Twin symbol, one substantial practice chapter that joins a feature journey to its representative files, compact command and language references, and concrete use cases. The root guide introduces the product with a concrete logic file, then links to concise contribution, security, change, and license information.

The website is part of this repository and product, while remaining separate from the CLI implementation. Its examples must distinguish verified current behavior from illustrative or historical evidence. The viewer, MCP, LSP, automatic generation, and other deferred capabilities remain outside the implemented product boundary.

The [CLI command workflow](cli-command-workflow.md), [package and CI behavior](package-distribution-and-ci.md), and [website experience](website-experience-and-runtime.md) describe the three connected parts in more detail.

## Test coverage

- The website renders the implemented product overview with its principal sections and boundaries.
- The website keeps the implemented workflow, current limits, language support, and package relationship clear.
