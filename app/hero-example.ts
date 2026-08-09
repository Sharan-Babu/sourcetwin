export const heroExample = {
  path: "subscription-service/source-twin/",
  filename: "cancellation.md",
  frontmatter: [
    "id: subscriptions.cancellation",
    "source:",
    "  code:",
    "    - src/subscriptions.js#cancelSubscription",
    "  tests:",
    "    - tests/subscriptions.test.js#annual customer cancellation waits for renewal",
  ],
  title: "Cancel a subscription",
  paragraphs: [
    "A customer cancelling an annual {{subscription}} keeps access until renewal.",
    "Monthly customer cancellations and all administrator cancellations happen immediately.",
  ],
} as const;

export const heroExampleMarkdown = [
  "---",
  ...heroExample.frontmatter,
  "---",
  `# ${heroExample.title}`,
  "",
  ...heroExample.paragraphs,
].join("\n");
