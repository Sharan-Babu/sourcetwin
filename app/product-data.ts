export type Flow = {
  id: string;
  label: string;
  provenance: "Real Luna run" | "Supported workflow";
  title: string;
  description: string;
  prompt: string;
  actions: string[];
  command: string;
  output: string[];
  result: string;
};

export const flows: Flow[] = [
  {
    id: "setup",
    label: "Set up",
    provenance: "Real Luna run",
    title: "Begin with a proposal, not invented documentation.",
    description: "The agent studies the repository first. People approve the concepts, terms, and measured scope before canonical logic is written.",
    prompt: "Study this subscription service. Propose the first Source Twin structure and coverage scope. Do not create canonical logic yet.",
    actions: [
      "Read source, tests, repository guidance, config, and the portable skill.",
      "Propose cancellation and renewal as two conceptual files.",
      "Propose subscription, cancellation, and renewal as shared terms.",
      "Wait for approval, then create the approved files and scope.",
    ],
    command: "npm exec --offline -- sourcetwin init",
    output: [
      "Created source-twin/config.yml",
      "Created source-twin/README.md",
      "Created source-twin/SKILL.md",
      "Next: ask before adding an agent-specific pointer.",
    ],
    result: "The human controls the product structure; init only creates the foundation.",
  },
  {
    id: "explain",
    label: "Explain",
    provenance: "Real Luna run",
    title: "Explain behavior at the reader’s level.",
    description: "The twin is the first readable map. The agent can still inspect linked code and tests when a question needs stronger evidence.",
    prompt: "Explain cancellation and renewal to a non-technical teammate. Separate what the code proves, what tests prove, and what remains uncertain.",
    actions: [
      "Read the two canonical logic files and three approved terms.",
      "Follow exact source and test starting points only where needed.",
      "Describe current behavior without turning uncertainty into fact.",
      "Report missing validation and integration behavior as open gaps.",
    ],
    command: "npm exec --offline -- sourcetwin check",
    output: [
      "Source Twin is valid.",
      "Logic files: 2 · Term files: 3",
      "Source mappings: 5",
      "No persistent status file was needed.",
    ],
    result: "A reader gets a grounded explanation without needing to navigate code first.",
  },
  {
    id: "twin-first",
    label: "Twin-first",
    provenance: "Real Luna run",
    title: "Agree on the next behavior before implementation.",
    description: "Canonical prose temporarily describes the approved next state. Git makes that temporary mismatch explicit until code and tests catch up.",
    prompt: "Annual customer cancellations should happen at renewal. Monthly customer and all admin cancellations stay immediate. Update the twin first; do not change code yet.",
    actions: [
      "Clarify actor, plan interval, renewal, and non-active behavior.",
      "Edit cancellation and renewal logic as the proposed next state.",
      "Run review against the explicitly chosen Git base.",
      "After approval, implement code and tests, then restore a current-state mirror.",
    ],
    command: "npm exec --offline -- sourcetwin check --base HEAD",
    output: [
      "ST602 · twin-only logic change",
      "Implementation then added 7 behavioral cases.",
      "ST604 · logic, code, and tests changed together",
      "Review all sides before calling them synchronized.",
    ],
    result: "Intent stays readable and Git keeps the temporary mismatch reviewable.",
  },
  {
    id: "code-first",
    label: "Code-first",
    provenance: "Supported workflow",
    title: "Restore the mirror after code changes first.",
    description: "Source Twin does not force one direction. Existing engineering work can begin in code, then use mappings and Git to find affected logic.",
    prompt: "Review this implementation change. Find the mapped Source Twin logic, explain what behavior moved, and update only the affected canonical passages.",
    actions: [
      "Inspect the changed source and tests against an explicit base.",
      "Use current and former mappings to find affected logic files.",
      "Update the twin to describe the behavior that now exists.",
      "Call out source-only changes that still need semantic review.",
    ],
    command: "npm exec --offline -- sourcetwin check --base main",
    output: [
      "mapped-source-only: 1",
      "paired: 0",
      "supporting/setup: 0",
      "Warning remains until the twin is reviewed with the code.",
    ],
    result: "Teams keep their normal coding workflow while making semantic drift visible.",
  },
  {
    id: "review",
    label: "Review",
    provenance: "Real Luna run",
    title: "Review logic, code, and tests as one change.",
    description: "Review works against any explicit branch, tag, or commit. Source Twin never guesses the comparison point or silently resolves ambiguity.",
    prompt: "Do a final review against HEAD. Report behavior, code, tests, terms, validation, remaining gaps, and uncertainty. Do not commit.",
    actions: [
      "Compare committed, staged, unstaged, renamed, and untracked work.",
      "Separate twin-only, source-only, paired, and supporting changes.",
      "Verify the late idempotency requirement and its new test.",
      "Return gaps such as invalid inputs, date edges, and external effects.",
    ],
    command: "npm exec --offline -- sourcetwin check --base HEAD",
    output: [
      "Application tests: 11 / 11",
      "Code entities: 2 / 2 direct",
      "Test entities: 11 / 11 direct",
      "Broken, unmapped, unsupported: none",
    ],
    result: "The agent proved alignment and still reported what the example did not cover.",
  },
  {
    id: "coverage",
    label: "Coverage",
    provenance: "Real Luna run",
    title: "See what is connected and what is not.",
    description: "Coverage is structural evidence, not a semantic score. Code and tests are measured separately, and ordinary gaps stay informational.",
    prompt: "Show whether the approved subscription functions and behavioral tests have Source Twin starting points. Do not claim the explanations are complete.",
    actions: [
      "Inventory only the paths and entity kinds approved in config.",
      "Match exact locators, whole files, and recursive modules separately.",
      "Report unmapped, broken, ambiguous, and unsupported areas.",
      "Use gaps to guide the next human-reviewed area of the twin.",
    ],
    command: "npm exec --offline -- sourcetwin coverage",
    output: [
      "Code: 1 file · 2 entities direct",
      "Tests: 1 file · 11 test entities direct",
      "Unmapped: 0 · Broken: 0",
      "Structural coverage does not prove semantic completeness.",
    ],
    result: "Coverage gives deterministic boundaries without inventing product structure.",
  },
];

export const capabilities = [
  ["Readable by default", "Flexible Markdown, short YAML frontmatter, ordinary links, and no required viewer."],
  ["Shared taxonomy", "Stable term files and readable {{term-name}} references connect product concepts."],
  ["Useful mappings", "Point to a function, a whole file, or a recursive module in code and tests."],
  ["Deterministic inventory", "A pinned ast-grep engine checks readable locators without asking an agent to count."],
  ["Git-aware review", "Compare against any explicit branch, tag, or commit without persistent status labels."],
  ["Agent-neutral workflow", "One portable skill works with existing coding agents and ordinary terminal tools."],
  ["Human and CI output", "Concise text and equivalent JSON expose the same facts with actionable diagnostics."],
  ["Extensible entities", "Versioned project rules can add concepts such as HTTP routes or background jobs."],
] as const;

export const repositoryAreas = [
  ["app/", "The private local product website and this interactive overview."],
  ["packages/sourcetwin/src/", "The publishable CLI: commands over focused validation and analysis modules."],
  ["packages/sourcetwin/tests/", "Unit, provider, temporary-repository, parity, and package smoke tests."],
  ["source-twin/", "This repository’s own readable semantic twin, terms, config, and portable skill."],
  [".github/workflows/", "Linux, macOS, and Windows package checks plus repository quality gates."],
] as const;
