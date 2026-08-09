export type EvidenceView = "twin" | "code" | "tests" | "terminal";
export type EvidenceLine = { tone: "plain" | "add" | "remove" | "muted"; text: string };
export type EvidencePanel = { filename: string; label: string; lines: EvidenceLine[] };

export type WalkthroughStage = {
  id: string;
  label: string;
  title: string;
  summary: string;
  state: string;
  conversation: { human: string; agent: string };
  counts: { twin: string; code: string; tests: string };
  panels: Record<EvidenceView, EvidencePanel>;
};

const plain = (text: string): EvidenceLine => ({ tone: "plain", text });
const add = (text: string): EvidenceLine => ({ tone: "add", text });
const remove = (text: string): EvidenceLine => ({ tone: "remove", text });
const muted = (text: string): EvidenceLine => ({ tone: "muted", text });

export const evidenceViews: { id: EvidenceView; label: string }[] = [
  { id: "twin", label: "Twin file" },
  { id: "code", label: "Code" },
  { id: "tests", label: "Tests" },
  { id: "terminal", label: "Terminal" },
];

export const walkthroughStages: WalkthroughStage[] = [
  {
    id: "baseline", label: "Baseline", title: "A small service exists, but its logic lives only in code.",
    summary: "Cancellation is immediate. Renewal adds time. Three tests cover the basic behavior.", state: "Before Source Twin",
    conversation: {
      human: "How does cancellation work today? I need an answer I can share with the product team.",
      agent: "I can inspect the code and tests, but there is no plain-language map to start from yet.",
    },
    counts: { twin: "0 files", code: "2 functions", tests: "3 cases" },
    panels: {
      twin: { filename: "source-twin/", label: "not initialized", lines: [muted("No readable mirror exists yet."), muted("A teammate must start by reading source and tests.")] },
      code: { filename: "src/subscriptions.js", label: "baseline", lines: [plain("export function cancelSubscription(subscription) {"), plain("  if (subscription.status !== 'active') return subscription;"), plain("  return { ...subscription, status: 'cancelled' };"), plain("}"), plain(""), plain("export function renewSubscription(subscription, months = 1) {"), plain("  return addMonths(subscription, months);"), plain("}")] },
      tests: { filename: "tests/subscriptions.test.js", label: "3 passing", lines: [plain("✓ active cancellation is immediate"), plain("✓ active subscription renews by one month"), plain("✓ non-active subscription is unchanged")] },
      terminal: { filename: "repository terminal", label: "baseline", lines: [plain("$ npm test"), plain("tests 3 · pass 3 · fail 0"), muted("Behavior is tested, but not explained outside code.")] },
    },
  },
  {
    id: "initialize", label: "Initialize", title: "The tool creates a foundation, not product documentation.",
    summary: "The agent receives writing guidance, a strict empty scope, and a portable workflow. It must still study the repository and ask for approval.", state: "Foundation created",
    conversation: {
      human: "Set up Source Twin, then study this repository. Propose a useful structure before you write the logic files.",
      agent: "I created the foundation. Next I will propose concepts, terms, and measured scope for your approval.",
    },
    counts: { twin: "+3 files", code: "unchanged", tests: "unchanged" },
    panels: {
      twin: { filename: "source-twin/", label: "created", lines: [add("README.md        writing guidance"), add("SKILL.md         agent workflow"), add("config.yml       empty approved scope"), muted("No logic or terms are invented by init.")] },
      code: { filename: "src/subscriptions.js", label: "unchanged", lines: [muted("No application code changed."), plain("cancelSubscription"), plain("renewSubscription")] },
      tests: { filename: "tests/subscriptions.test.js", label: "unchanged", lines: [muted("The same 3 application tests still pass."), plain("The setup step does not rewrite tests.")] },
      terminal: { filename: "repository terminal", label: "init", lines: [plain("$ npm exec --offline -- sourcetwin init"), add("Created source-twin/config.yml"), add("Created source-twin/README.md"), add("Created source-twin/SKILL.md"), plain("Next: ask before adding an agent-specific pointer.")] },
    },
  },
  {
    id: "map", label: "Map behavior", title: "The human approves the first conceptual map.",
    summary: "The coding agent proposed cancellation and renewal logic, plus three shared terms. Only after approval did it create canonical files and measured scope.", state: "Current behavior mapped",
    conversation: {
      human: "Cancellation and renewal are the right starting points. Use the three shared terms you proposed.",
      agent: "The approved files now describe current behavior and point to two functions and three tests.",
    },
    counts: { twin: "+5 files", code: "2 mapped", tests: "3 mapped" },
    panels: {
      twin: { filename: "source-twin/subscriptions/cancellation.md", label: "canonical", lines: [plain("---"), add("id: subscriptions.cancellation"), add("source.code: src/subscriptions.js#cancelSubscription"), add("source.tests: tests/subscriptions.test.js#active cancellation is immediate"), plain("---"), add("# Cancel a subscription"), add("An active {{subscription}} is cancelled immediately.")] },
      code: { filename: "src/subscriptions.js", label: "mapped, unchanged", lines: [plain("cancelSubscription  ← cancellation.md"), plain("renewSubscription   ← renewal.md"), muted("Mappings are starting points, not copied code.")] },
      tests: { filename: "tests/subscriptions.test.js", label: "3 direct", lines: [add("active cancellation is immediate  ← mapped"), add("active subscription renews        ← mapped"), add("non-active remains unchanged       ← mapped")] },
      terminal: { filename: "repository terminal", label: "valid", lines: [plain("$ npm exec --offline -- sourcetwin check"), add("Source Twin is valid."), plain("Logic files: 2 · Term files: 3"), plain("$ npm exec --offline -- sourcetwin coverage"), add("Code entities 2 / 2 direct · Tests 3 / 3 direct")] },
    },
  },
  {
    id: "twin-first", label: "Change intent", title: "The next behavior is agreed in English first.",
    summary: "Annual customer cancellation moves to renewal. Monthly customer and every admin cancellation remain immediate. Code is intentionally untouched at this moment.", state: "Twin-first proposal",
    conversation: {
      human: "Annual customers should keep access until renewal. Monthly customers and administrators should still cancel immediately.",
      agent: "I updated the readable logic first. Git now shows the intended behavior before implementation begins.",
    },
    counts: { twin: "2 changed", code: "0 changed", tests: "0 changed" },
    panels: {
      twin: { filename: "source-twin/subscriptions/cancellation.md", label: "proposed next state", lines: [remove("An active subscription is cancelled immediately."), add("A customer cancelling an annual subscription stays active until renewal."), add("Its cancellation date is the existing renewal date."), add("Monthly customer and all administrator cancellations are immediate."), add("Non-active subscriptions remain unchanged.")] },
      code: { filename: "src/subscriptions.js", label: "still current code", lines: [muted("No code changed yet. This is deliberate."), plain("return { ...subscription, status: 'cancelled' };"), muted("Git review makes this temporary mismatch visible.")] },
      tests: { filename: "planned behavior", label: "not implemented", lines: [add("annual customer schedules cancellation"), add("annual administrator cancels immediately"), add("scheduled cancellation resolves at renewal"), muted("These cases are intent until implementation is approved.")] },
      terminal: { filename: "repository terminal", label: "review warning", lines: [plain("$ npm exec --offline -- sourcetwin check --base HEAD"), add("Source Twin is valid."), plain("ST602 · twin-only logic change"), plain("Review the proposed behavior before implementation.")] },
    },
  },
  {
    id: "implement", label: "Implement", title: "Code and tests catch up with the approved twin.",
    summary: "The coding agent added actor and plan behavior, scheduled annual cancellation, and cancellation at renewal. The suite grew from three to ten cases.", state: "Paired implementation",
    conversation: {
      human: "The behavior is right. Implement it and cover the important customer and administrator cases.",
      agent: "The code and tests now match the approved twin. I kept all three parts together for review.",
    },
    counts: { twin: "2 paired", code: "+23 lines", tests: "10 cases" },
    panels: {
      twin: { filename: "source-twin/subscriptions/cancellation.md", label: "current again", lines: [plain("Annual customer cancellation is scheduled for renewal."), plain("Monthly customer and administrator cancellation is immediate."), plain("Renewal turns a scheduled subscription into cancelled."), add("## Test coverage"), add("- annual and monthly customer paths"), add("- administrator override and non-active paths")] },
      code: { filename: "src/subscriptions.js", label: "implemented", lines: [add("if (actor === 'customer' && planInterval === 'annual') {"), add("  return { ...subscription, cancelsAt: renewsAt };"), add("}"), plain("return cancelImmediately(subscription, now);"), plain(""), add("if (subscription.cancelsAt) {"), add("  return cancelImmediately(subscription, now);"), add("}")] },
      tests: { filename: "tests/subscriptions.test.js", label: "10 passing", lines: [add("+ annual customer schedules at renewal"), add("+ annual and monthly admin cancel immediately"), add("+ admin overrides a scheduled cancellation"), add("+ scheduled cancellation resolves at renewal"), plain("10 tests · all passing")] },
      terminal: { filename: "repository terminal", label: "paired", lines: [plain("$ npm test"), add("tests 10 · pass 10 · fail 0"), plain("$ npm exec --offline -- sourcetwin check --base HEAD"), plain("ST604 · logic and mapped implementation changed together"), plain("$ npm exec --offline -- sourcetwin coverage"), add("Code 2 / 2 direct · Tests 10 / 10 direct")] },
    },
  },
  {
    id: "refine", label: "Refine + review", title: "A late production requirement stays traceable.",
    summary: "The user required repeated annual cancellation to return the exact same object and never move the date. The agent changed prose, code, and one test, then reviewed remaining gaps.", state: "Final reviewed state",
    conversation: {
      human: "One more requirement. Repeating the same annual cancellation must change nothing, including the stored date.",
      agent: "I updated the logic, added the guard and test, then reported the remaining date and billing gaps.",
    },
    counts: { twin: "+1 case", code: "+1 guard", tests: "11 cases" },
    panels: {
      twin: { filename: "source-twin/subscriptions/cancellation.md", label: "final behavior", lines: [add("Repeating the same scheduled cancellation changes nothing."), add("It returns the existing subscription and keeps the original date."), plain(""), plain("## Test coverage"), add("- repeated annual cancellation is idempotent")] },
      code: { filename: "src/subscriptions.js", label: "final guard", lines: [add("if (subscription.cancelsAt === subscription.renewsAt) {"), add("  return subscription;"), add("}"), plain("return { ...subscription, cancelsAt: subscription.renewsAt };")] },
      tests: { filename: "tests/subscriptions.test.js", label: "11 passing", lines: [add("+ repeated annual cancellation returns the same object"), plain("assert.strictEqual(result, subscription)"), plain("assert.equal(result.cancelsAt, originalRenewal)"), add("11 tests · all passing")] },
      terminal: { filename: "repository terminal", label: "final review", lines: [plain("$ npm test"), add("tests 11 · pass 11 · fail 0"), plain("$ npm exec --offline -- sourcetwin check --base HEAD"), add("Source Twin is valid."), plain("$ npm exec --offline -- sourcetwin coverage"), add("Code entities 2 / 2 direct · Test entities 11 / 11 direct"), muted("Remaining gaps: invalid input, date edges, external billing effects.")] },
    },
  },
];
