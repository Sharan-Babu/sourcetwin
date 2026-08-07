# Source Twin

Build a version-controlled, plain-language semantic twin of a codebase. It must help people understand, review, and direct software changes without needing to read source code.

## Product rules

- Keep Source Twin artifacts readable as ordinary files; a viewer is optional.
- Store `source-twin/` inside the code repository, alongside source and tests.
- Let people organize its conceptual files and nesting; do not mirror source folders by default.
- Use flexible Markdown with short YAML frontmatter; do not require MDX or a rigid heading structure.
- Use repository-wide schema `1` from `source-twin/config.yml`, with `coverage.code` and `coverage.tests` containing separate repo-relative `include`, `exclude`, and `entities` lists and no initial thresholds. Reject unsupported schemas and unknown canonical configuration or frontmatter fields.
- Version the CLI and repository schema independently. Increment the schema whenever canonical grammar or meaning changes, including a new optional canonical field under strict unknown-field validation; ordinary CLI fixes and improvements do not change it.
- Have each CLI release declare its supported schemas and stop before analysis or mutation when the repository schema is unsupported, reporting the installed CLI version, repository schema, supported schemas, and required next step. Let newer CLIs support the preceding schema for a practical transition period without promising indefinite compatibility.
- Initially ship schema `1` without migration machinery. Never migrate during `check`, `coverage`, installation, or normal reads; when a later schema exists, start with an agent-readable migration guide and a reviewable Git diff, adding an explicit migration command only for substantial deterministic work.
- Require canonical logic files to have a stable dot-separated lowercase ID, at least one `source.code` entry, one H1, and a non-empty body; allow `source.tests` and `Test coverage` to be absent. Source entries use `path`, `path#symbol`, or `directory/**`.
- Require term files to have a unique lowercase hyphenated ID, one H1, and a non-empty definition. Do not support aliases initially.
- Store each meaningful shared product concept as a Markdown file under `source-twin/terms/`. Reference its normalized stable ID with readable `{{term name}}` syntax; use normal Markdown links between logic files.
- Agents must reuse existing terms, explicitly propose additions, and treat Git review as approval. Rename terms as controlled refactors that update every reference.
- Group a few useful implementation and test starting points under `source.code` and `source.tests` in frontmatter. Keep mappings many-to-many; do not require one explanation per function.
- Put meaningful cases in an optional, citation-free `Test coverage` section. Its absence means behavioral test coverage is unknown, not zero.
- Support exact-symbol, whole-file, and recursive-module mappings. Report direct, file-level, module-level, unmapped, and broken counts separately; structural coverage never proves semantic completeness.
- Treat function references as a first-class default when they best match the explained logic; whole-file and recursive-module references are deliberate broader alternatives, not the preferred form.
- Interpret the text after `#` as a readable locator within that file: function name, `Container.method` when available, readable test name, or a rule-derived custom locator such as `POST /subscriptions/cancel`. Never use line numbers, hashes, or opaque generated IDs.
- Require an exact locator to match one logical entity: zero matches is broken and multiple matches is ambiguous. Resolve ambiguity with a more qualified project rule or a broader file mapping; a code rename should intentionally break the old locator for review.
- Define measured code and test scope with include and exclude patterns in `source-twin/config.yml`.
- Keep inventory detail out of canonical prose. Let `source-twin/config.yml` select path-only coverage or supported entity categories; the setup agent proposes the repository-appropriate choice and the human approves it.
- Treat an empty `entities` list as explicit path-only coverage. Use singular lowercase entity kinds such as `function`, `method`, `test-case`, or a project-defined kind such as `http-route`.
- Let optional `inventory.rules` list repo-relative, version-controlled ast-grep rule files for project entities. Allow an explicit optional ast-grep configuration path only for advanced custom Tree-sitter languages; never silently consume an unrelated repository ast-grep configuration.
- Keep project writing guidance in `source-twin/README.md`; keep linkable, non-canonical work in `source-twin/drafts/`.
- Give drafts no canonical schema or coverage role, but still validate their approved term references and Markdown links.
- Each canonical logic file mirrors current code. A twin-first edit temporarily describes the proposed next state; a code-first edit makes the twin stale until both are reviewed together.
- Make synchronization reviewable in both directions; never silently turn ambiguous prose into code.
- Start with Git status and diffs instead of a persistent generated state file.
- Integrate through a concise agent skill and terminal tools; do not require MCP or a custom viewer.
- Start with only `sourcetwin init`, `sourcetwin check`, and `sourcetwin coverage`; use existing agent, `rg`, and Git capabilities for authoring, traversal, search, diffs, and specialized refactors.
- Keep one `source-twin/` at the Git repository root. Resolve that root with Git so commands work from any descendant directory, and support `--root <path>` for an explicit repository target in agent and CI workflows; fail clearly when the target is not a Git repository or a required Source Twin configuration is absent. Do not support nested Source Twin projects initially.
- Provide standard `--help` output for the CLI and each operational command, plus offline `sourcetwin help config|logic|terms|rules` reference topics. Treat `help` as documentation rather than another product workflow.
- Make every command non-interactive, concise, and readable by default, with repository-relative paths and an equivalent structured `--json` result for agents and CI; JSON must expose the same facts rather than hidden behavior.
- Report actionable diagnostics with the affected file, location when available, problem, and suggested correction.
- Have diagnostics point to the relevant offline help topic. Base validation and help on the same versioned schemas, and test every documented example so reference material cannot silently drift from behavior.
- Fail `check` when an inventory rule is missing or malformed, its Source Twin metadata is invalid, or an enabled entity kind has no applicable built-in or project rule. Warn when a configured rule's entity kind is not enabled in either code or test coverage.
- `check` fails on malformed or broken authored content and does not guess a comparison branch. With `--base <git-ref>`, it uses any branch, tag, or commit to also warn when twin-only, mapped-code-only, or related changes should be reviewed together.
- `coverage` independently inventories declared code and test scope, reports direct, broad, unmapped, and unsupported areas, and is informational by default.
- Let `coverage` succeed when it finds gaps or unsupported areas; fail only when configuration is invalid or analysis cannot complete. Let `check` fail when validation errors exist. Have `init` refuse to overwrite an existing Source Twin.
- `init` creates only the minimal directory, README, configuration, and canonical agent-neutral `source-twin/SKILL.md` foundation. The agent studies the repository and proposes conceptual areas, terms, and scope; the human approves them before canonical files are created.
- Build existing twins incrementally by conceptual area. Use coverage to expose remaining work and guide review, never to choose the product structure automatically; maintain new projects alongside feature work.
- Ship one concise, portable, agent-neutral Source Twin skill at `source-twin/SKILL.md`. It must read the repository-specific README and config, support setup, explanation, twin-first, and code-first workflows, preserve taxonomy and coverage guardrails, and report behavior, code, tests, terms, validation, gaps, and uncertainty.
- Do not assume a nested `AGENTS.md`, `CLAUDE.md`, or arbitrary `SKILL.md` is discovered repository-wide, and do not silently modify agent-specific instruction files. After `init`, print guidance for the coding agent to ask the user before adding a short root-level pointer, installing the skill in an agent-specific project skill directory, or using that agent's equivalent integration.
- Recommend a pointer rather than copying or renaming the full skill so one canonical workflow cannot drift across agent-specific files.
- Have the skill use offline help to learn standard formats, read the repository README and config for local decisions, and run `check` after edits; validation complements documentation rather than replacing it.
- Use Source Twin on this repository itself as soon as the core supports it.
- Treat the first usable release as one complete workflow: npm installation; `init`, `check`, `coverage`, and offline help; the portable skill and integration guidance; canonical formats and mappings; the agreed path and entity coverage; `check --base`; text/JSON parity; cross-platform CI; and a small real Source Twin representation of this repository. Do not require complete self-coverage before release.
- Defer the viewer and website integration, MCP, LSP, automatic prose or code generation, a public plugin API, migration commands, caching or generated state, coverage thresholds, and standalone binaries until demonstrated demand justifies them.

## Engineering

- Use well-established libraries wherever practical. Library or project size is not a concern.
- Keep the existing website in the private root package and build one publishable `packages/sourcetwin/` npm workspace; do not add a monorepo framework or split the core into multiple packages initially.
- Implement the CLI in strict ESM TypeScript on Node.js 22 or newer, compile with plain `tsc`, and distribute through npm/npx. Add a bundler or standalone binaries only when measured demand justifies them.
- Keep commands thin over focused modules for configuration, Markdown, mappings, inventory, and output. Build one typed command result and render both text and JSON from it so a future viewer can reuse the core without viewer-specific work now.
- Prefer `commander`, `zod`, `yaml`, Unified/Remark, `fast-glob`, `execa`, and Vitest for their focused roles rather than implementing equivalent infrastructure.
- Keep the format language-neutral. Use a pinned `@ast-grep/cli` as the initial structural inventory engine behind a small internal Source Twin provider contract; do not expose a public provider or general plugin API initially.
- Use `ast-grep outline --items structure` for standard entities such as functions and methods. Normalize and sort its JSON by repository path and source location before mapping or reporting.
- Use `ast-grep scan` rules, carrying a Source Twin entity kind in rule metadata, for test cases and project-specific entities such as routes or jobs. Ship tested rules for supported defaults and let users and agents add version-controlled YAML rules through configuration.
- Let custom scan rules provide a readable locator template from captured code values, such as an HTTP method plus route path; validate that every emitted locator is non-empty and unambiguous within its source file.
- Store project rules under `source-twin/rules/` and initially require one native ast-grep rule per file, a unique rule ID, `metadata.sourceTwinKind` as a lowercase hyphenated kind, and `metadata.sourceTwinLocator` as a readable template using captures from that rule.
- Fail validation for missing locator captures, empty locators, duplicate locators within a file, invalid metadata, or duplicate rule IDs. Treat a valid rule with no matches as a legitimate zero result. Keep built-in rules inside the package instead of copying them into every repository.
- Do not build arbitrary executable adapters initially. Use ast-grep's custom Tree-sitter language mechanism for advanced unsupported languages, retain path-level validation when reliable extraction is unavailable, and keep the internal provider boundary available for a different engine later.
- Claim entity-level language or framework support only after contract fixtures prove its locators and output. Keep LSP or SCIP as possible future semantic-navigation providers, not initial inventory dependencies.
- Initially verify TypeScript and JavaScript functions, methods, and common `test`/`it` cases; Python functions, methods, and pytest-style tests; Go functions, methods, and Go tests; and Rust and Java functions and methods. Keep Rust and Java tests path-level until their framework rules are proven.
- Treat other ast-grep languages as path-level by default rather than automatically claiming entity support. Report capabilities by language and entity kind, and let tested project rules extend them in mixed-language repositories.
- The proof against `@ast-grep/cli` 0.45.0 found standard entities in TypeScript, JavaScript, Python, Go, Rust, and Java; custom scan rules found common JavaScript/TypeScript test forms, Python and Go tests, and an HTTP route. It also proved that custom entity kinds belong in scan rules and that Source Twin must sort ast-grep's potentially parallel output.
- Choose simple, performant, production-ready designs. Avoid over-engineering, duplication, and code bloat.
- Keep modules cohesive, boundaries explicit, dependencies one-directional, and implementation files easy to read. Aim for roughly 100–200 lines per handwritten file; allow a justified exception when splitting cohesive logic would make the design harder to follow.
- Build for extension through small contracts and composition, not speculative abstraction or premature plugin machinery.
- Maintain unit, provider-contract, temporary-repository integration, text/JSON parity, package smoke, and cross-platform CI tests. Add no cache or generated state initially.
- Implement in production-ready vertical slices: foundation; the minimum usable path-level loop; structural coverage; Git-aware review; and release hardening. Test and independently review every slice, fix valid findings, and commit it before starting the next one.

## Communication

- Use natural, plain language.
- Be concise, direct, and easy to understand.
- Lead with outcomes and explain technical detail only when it helps a decision.
- Keep website changes local unless the user explicitly asks to publish them.
