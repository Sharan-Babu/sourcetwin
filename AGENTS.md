# Source Twin

Build a version-controlled, plain-language semantic twin of a codebase. It must help people understand, review, and direct software changes without needing to read source code.

## Product rules

- Keep Source Twin artifacts readable as ordinary files; a viewer is optional.
- Use stable `{{term-id}}` references from a human-approved shared taxonomy.
- Link plain-language logic to source symbols, tests, and related concepts.
- Keep intended behavior separate from observed code behavior and surface conflicts.
- Make synchronization reviewable in both directions; never silently turn ambiguous prose into code.
- Prefer MCP or other agent-neutral integrations before building a custom terminal interface.
- Use Source Twin on this repository itself as soon as the core supports it.

## Engineering

- Use well-established libraries wherever practical. Library or project size is not a concern.
- Choose simple, performant, production-ready designs. Avoid over-engineering, duplication, and code bloat.
- Maintain clear boundaries, strong validation, useful tests, and evidence-backed behavior.

## Communication

- Use natural, plain language.
- Be concise, direct, and easy to understand.
- Lead with outcomes and explain technical detail only when it helps a decision.
