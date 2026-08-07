import { DEFAULT_CONFIG } from "../init/templates.js";

export const LOGIC_EXAMPLE = `---
id: subscriptions.cancellation
source:
  code:
    - src/subscriptions.ts#cancelSubscription
    - src/billing/**
  tests:
    - tests/subscriptions.test.ts#customer can cancel an active subscription
---
# Cancelling a subscription

An active {{subscription}} can be cancelled by its owner.

## Test coverage

- An active subscription is cancelled.
- An expired subscription cannot be cancelled again.
`;

export const TERM_EXAMPLE = `---
id: subscription
---
# Subscription

A customer's continuing access to a paid product or service.
`;

export const RULE_EXAMPLE = `id: http-post-route
language: TypeScript
rule:
  pattern: router.post($PATH, $$$HANDLERS)
metadata:
  sourceTwinKind: http-route
  sourceTwinLocator: POST $PATH
`;

const TOPICS = {
  config: `# Configuration

Store repository schema and measured scope in source-twin/config.yml. Paths and glob patterns are repository-relative. Empty include lists mean that scope is not configured; empty entities lists explicitly request path-only coverage.

\`\`\`yaml
${DEFAULT_CONFIG.trimEnd()}
\`\`\`

Only schema 1 fields are accepted. Optional inventory.rules lists Source Twin ast-grep rule files. inventory.astGrepConfig is reserved for an explicit advanced ast-grep configuration.
`,
  logic: `# Logic files

Place canonical Markdown anywhere under source-twin/ except terms/, drafts/, README.md, and SKILL.md. Each file needs a unique dot-separated lowercase id, one H1, a non-empty body, and at least one source.code entry. Source entries use path, path#readable-locator, or directory/**.

\`\`\`markdown
${LOGIC_EXAMPLE.trimEnd()}
\`\`\`
`,
  terms: `# Terms

Place each shared concept under source-twin/terms/. Give it a unique lowercase hyphenated id, one H1, and a non-empty definition. Reuse it in readable prose as {{term-id}}. Rename a term by updating its file and every reference in one reviewed change.

\`\`\`markdown
${TERM_EXAMPLE.trimEnd()}
\`\`\`
`,
  rules: `# Inventory rules

Project rules extend structural coverage with readable entities such as routes or jobs. Put one ast-grep rule in each YAML file under source-twin/rules/ and list it in config.yml. Its unique id and metadata.sourceTwinKind use lowercase hyphenated values. metadata.sourceTwinLocator is a readable template built from captures in that rule.

\`\`\`yaml
${RULE_EXAMPLE.trimEnd()}
\`\`\`
`,
} as const;

export type HelpTopic = keyof typeof TOPICS;
export const HELP_TOPICS = Object.keys(TOPICS) as HelpTopic[];

export function getHelpTopic(topic: string): string | undefined {
  return TOPICS[topic as HelpTopic];
}
