"use client";

import { useState } from "react";

type UnitStatus = "conflict" | "verified" | "review";

type LogicUnit = {
  id: string;
  area: string;
  label: string;
  status: UnitStatus;
  purpose: string;
  rules: string[];
  observed: string;
  sourcePath: string;
  symbol: string;
  source: string;
  twin: string;
  tests: string[];
  coverage: number;
  desiredChange: string;
};

const units: LogicUnit[] = [
  {
    id: "admin-send-email",
    area: "Messaging",
    label: "Send as the service",
    status: "conflict",
    purpose:
      "An {{administrator}} can send from an approved service address without exposing or searching customer data.",
    rules: [
      "The administrator enters a sender address directly.",
      "MUST NOT search {{customer-email-directory}} while the address is typed.",
      "Validate with {{email-address-validator}} only when the form is submitted.",
      "If valid, {{email-service}} sends the message and records the outcome.",
    ],
    observed:
      "While the administrator types, the interface queries {{customer-email-directory}} and shows matching users.",
    sourcePath: "src/admin/email/compose.tsx",
    symbol: "SenderAddressField",
    source: `function SenderAddressField() {
  const [query, setQuery] = useState("");
  const matches = useUserSearch(query, {
    onlyWithoutAdmin: true,
  });

  return <Combobox
    value={query}
    options={matches}
    onChange={setQuery}
  />;
}`,
    twin: `# Send an email as the service

An {{administrator}} enters a sender address directly.

## Intended rules
- MUST NOT search {{customer-email-directory}} while typing.
- Validate with {{email-address-validator}} on submit.
- Send through {{email-service}} after validation.

## Observed behavior
CONFLICT: The interface searches customer records while typing.

## Evidence
- src/admin/email/compose.tsx#SenderAddressField
- tests/admin-email.test.ts#send-as-service`,
    tests: ["send-as-service", "rejects-invalid-address"],
    coverage: 92,
    desiredChange:
      "Stop searching customer records while the sender address is typed. Accept a manually entered address and validate it only on submit.",
  },
  {
    id: "approve-refund",
    area: "Orders",
    label: "Approve a refund",
    status: "verified",
    purpose:
      "A {{support-agent}} can approve an eligible refund while larger refunds require {{finance-review}}.",
    rules: [
      "Confirm the order is inside the {{refund-window}}.",
      "Refunds at or below $250 can be approved by a {{support-agent}}.",
      "Refunds above $250 require {{finance-review}}.",
      "Every decision is recorded in the {{order-audit-log}}.",
    ],
    observed:
      "The implementation and tests currently match all four intended rules.",
    sourcePath: "src/orders/refunds/approve.ts",
    symbol: "approveRefund",
    source: `export async function approveRefund(input) {
  assertInsideRefundWindow(input.order);

  if (input.amount > 250) {
    return requestFinanceReview(input);
  }

  await issueRefund(input);
  await orderAuditLog.record("refund.approved", input);
}`,
    twin: `# Approve a refund

A {{support-agent}} may approve an eligible refund.

## Intended rules
- Confirm the order is inside {{refund-window}}.
- Amounts up to $250 may be approved immediately.
- Larger amounts require {{finance-review}}.
- Record every decision in {{order-audit-log}}.

## Status
VERIFIED: Code and tests support every rule.

## Evidence
- src/orders/refunds/approve.ts#approveRefund
- tests/refunds/approval.test.ts`,
    tests: ["approves-small-refund", "routes-large-refund", "rejects-late-refund"],
    coverage: 100,
    desiredChange:
      "Allow support agents to approve refunds up to $500. Keep finance review for anything above $500.",
  },
  {
    id: "invite-member",
    area: "Workspaces",
    label: "Invite a team member",
    status: "review",
    purpose:
      "A {{workspace-owner}} can invite a person with a chosen {{workspace-role}}.",
    rules: [
      "Only a {{workspace-owner}} can create an invitation.",
      "An invitation expires after seven days.",
      "Accepting it creates a membership with the chosen {{workspace-role}}.",
    ],
    observed:
      "The invitation flow is mapped, but its expiration behavior has no linked test and needs human review.",
    sourcePath: "src/workspaces/invitations/create.ts",
    symbol: "createInvitation",
    source: `export async function createInvitation(input, actor) {
  assertWorkspaceOwner(actor, input.workspaceId);

  return invitations.create({
    email: input.email,
    role: input.role,
    expiresAt: addDays(new Date(), 7),
  });
}`,
    twin: `# Invite a team member

A {{workspace-owner}} invites someone into a workspace.

## Intended rules
- Only a workspace owner may invite.
- The invitation expires after seven days.
- Acceptance assigns the chosen {{workspace-role}}.

## Status
NEEDS REVIEW: Expiration is implemented but not tested.

## Evidence
- src/workspaces/invitations/create.ts#createInvitation
- tests/workspaces/invitations.test.ts#owner-can-invite`,
    tests: ["owner-can-invite"],
    coverage: 71,
    desiredChange:
      "Explain what happens when an invitation expires and identify the missing test coverage.",
  },
];

const terms: Record<string, { meaning: string; refs: number; owner: string }> = {
  administrator: { meaning: "A trusted operator of the service.", refs: 8, owner: "Operations" },
  "customer-email-directory": { meaning: "Private customer identity and email records.", refs: 3, owner: "Identity" },
  "email-address-validator": { meaning: "Checks address syntax and approved sender policy.", refs: 6, owner: "Messaging" },
  "email-service": { meaning: "Delivers product and operational email.", refs: 14, owner: "Messaging" },
  "support-agent": { meaning: "A teammate who resolves customer requests.", refs: 11, owner: "Support" },
  "finance-review": { meaning: "A required approval for higher-risk money movement.", refs: 5, owner: "Finance" },
  "refund-window": { meaning: "The time period during which an order is refundable.", refs: 7, owner: "Orders" },
  "order-audit-log": { meaning: "An immutable record of order decisions.", refs: 9, owner: "Orders" },
  "workspace-owner": { meaning: "A member with authority over workspace access.", refs: 10, owner: "Workspaces" },
  "workspace-role": { meaning: "The permission set assigned to a workspace member.", refs: 12, owner: "Identity" },
};

const workflow = ["Understand", "Change intent", "Review impact", "Agent handoff"];

function StatusDot({ tone = "good" }: { tone?: "good" | "warn" | "bad" | "muted" }) {
  return <span className={`status-dot status-dot--${tone}`} aria-hidden="true" />;
}

function TermText({ text, onTerm }: { text: string; onTerm: (term: string) => void }) {
  const pieces = text.split(/(\{\{[^}]+\}\})/g);
  return (
    <>
      {pieces.map((piece, index) => {
        const match = piece.match(/^\{\{(.+)\}\}$/);
        return match ? (
          <button className="term" type="button" onClick={() => onTerm(match[1])} key={`${piece}-${index}`}>
            {piece}
          </button>
        ) : (
          <span key={`${piece}-${index}`}>{piece}</span>
        );
      })}
    </>
  );
}

function ScenarioButton({
  eyebrow,
  title,
  description,
  active,
  onClick,
}: {
  eyebrow: string;
  title: string;
  description: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button className={`scenario-button ${active ? "scenario-button--active" : ""}`} type="button" onClick={onClick}>
      <span>{eyebrow}</span>
      <strong>{title}</strong>
      <small>{description}</small>
    </button>
  );
}

export default function Home() {
  const [selectedId, setSelectedId] = useState(units[0].id);
  const [step, setStep] = useState(0);
  const [view, setView] = useState<"twin" | "split" | "source">("split");
  const [activeTerm, setActiveTerm] = useState<string | null>("customer-email-directory");
  const [intent, setIntent] = useState(units[0].desiredChange);
  const [copyState, setCopyState] = useState("Copy brief");
  const unit = units.find((item) => item.id === selectedId) ?? units[0];
  const termInfo = activeTerm ? terms[activeTerm] : null;

  const selectUnit = (id: string, nextStep = 0) => {
    const next = units.find((item) => item.id === id) ?? units[0];
    setSelectedId(id);
    setIntent(next.desiredChange);
    setActiveTerm(null);
    setStep(nextStep);
  };

  const jumpToDemo = (id: string, nextStep: number) => {
    selectUnit(id, nextStep);
    document.getElementById("experience")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const copyBrief = async () => {
    const brief = `Source Twin change request\n\nGoal: ${intent}\n\nLogic unit: ${unit.id}\nSource: ${unit.sourcePath}#${unit.symbol}\nTests: ${unit.tests.join(", ")}\n\nKeep the twin, source evidence, and tests in sync. Return any newly discovered behavior as a proposed twin update.`;
    try {
      await navigator.clipboard.writeText(brief);
      setCopyState("Copied");
      window.setTimeout(() => setCopyState("Copy brief"), 1600);
    } catch {
      setCopyState("Select brief below");
    }
  };

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Source Twin home">
          <span className="brand-mark">ST</span>
          <span>Source Twin</span>
        </a>
        <nav className="site-nav" aria-label="Page sections">
          <a href="#experience">Try it</a>
          <a href="#patterns">Usage patterns</a>
          <a href="#scope">Scope</a>
        </nav>
        <div className="header-note"><StatusDot /> Interactive product concept</div>
      </header>

      <section className="hero" id="top">
        <div className="eyebrow">A semantic twin for software</div>
        <h1>Experience the product before we build it.</h1>
        <p>
          Explore a realistic codebase in plain English, change its intent, see what else could be affected,
          and hand a grounded plan to a coding agent.
        </p>
        <div className="hero-actions">
          <a className="primary-button" href="#experience">Start the guided experience <span>↓</span></a>
          <a className="text-button" href="#scope">See the proposed first release</a>
        </div>
      </section>

      <section className="experience-section" id="experience">
        <div className="experience-intro">
          <div>
            <div className="eyebrow">Interactive prototype</div>
            <h2>Work inside a sample product.</h2>
          </div>
          <p>
            ParcelPilot is a fictional operations platform. Choose how you arrived, then move through the four steps.
            Everything shown is a proposed product behavior, ready for us to discuss.
          </p>
        </div>

        <div className="scenario-picker" aria-label="Choose a usage scenario">
          <ScenarioButton
            eyebrow="Privacy review"
            title="Catch a risky behavior"
            description="Compare intended policy with what the code actually does."
            active={selectedId === "admin-send-email"}
            onClick={() => selectUnit("admin-send-email", 0)}
          />
          <ScenarioButton
            eyebrow="Product planning"
            title="Change a business rule"
            description="Raise a refund limit and inspect its reach before coding."
            active={selectedId === "approve-refund"}
            onClick={() => selectUnit("approve-refund", 1)}
          />
          <ScenarioButton
            eyebrow="Onboarding"
            title="Learn an unfamiliar flow"
            description="Follow terms, evidence, and missing coverage without code expertise."
            active={selectedId === "invite-member"}
            onClick={() => selectUnit("invite-member", 0)}
          />
        </div>

        <div className="product-shell" aria-label="Interactive Source Twin prototype">
          <div className="product-bar">
            <div className="window-dots" aria-hidden="true"><i /><i /><i /></div>
            <div className="repo-path"><span>parcel-pilot</span> / source-twin / logic / {unit.id}</div>
            <div className={`sync-state sync-state--${unit.status}`}>
              <StatusDot tone={unit.status === "conflict" ? "bad" : unit.status === "review" ? "warn" : "good"} />
              {unit.status === "conflict" ? "Conflict found" : unit.status === "review" ? "Needs review" : "Verified"}
            </div>
          </div>

          <div className="workflow-rail" aria-label="Guided workflow">
            {workflow.map((label, index) => (
              <button
                className={index === step ? "workflow-step workflow-step--active" : index < step ? "workflow-step workflow-step--done" : "workflow-step"}
                type="button"
                onClick={() => setStep(index)}
                aria-current={index === step ? "step" : undefined}
                key={label}
              >
                <span>{index < step ? "✓" : index + 1}</span>
                <strong>{label}</strong>
              </button>
            ))}
          </div>

          <div className="workspace">
            <aside className="navigator">
              <div className="nav-label">Repository logic</div>
              {["Messaging", "Orders", "Workspaces"].map((area) => (
                <div className="tree-group" key={area}>
                  <div className="tree-heading"><span>▾</span>{area}</div>
                  {units.filter((item) => item.area === area).map((item) => (
                    <button
                      type="button"
                      className={`tree-item ${item.id === selectedId ? "tree-item--active" : ""}`}
                      onClick={() => selectUnit(item.id)}
                      key={item.id}
                    >
                      <StatusDot tone={item.status === "conflict" ? "bad" : item.status === "review" ? "warn" : "good"} />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              ))}

              <div className="coverage-mini">
                <div><span>Repository coverage</span><strong>86%</strong></div>
                <div className="progress"><i /></div>
                <small>21 verified · 2 need review · 1 conflict</small>
              </div>
            </aside>

            <section className="work-canvas">
              <div className="canvas-heading">
                <div>
                  <div className="logic-meta"><span>FLOW</span><span>flow.{unit.id}</span></div>
                  <h3>{unit.label}</h3>
                </div>
                <div className="view-toggle" aria-label="Choose representation">
                  {(["twin", "split", "source"] as const).map((option) => (
                    <button type="button" className={view === option ? "active" : ""} onClick={() => setView(option)} key={option}>
                      {option === "twin" ? "Plain English" : option === "split" ? "Side by side" : "Source"}
                    </button>
                  ))}
                </div>
              </div>

              {step === 0 && (
                <div className="understand-panel">
                  <p className="logic-purpose"><TermText text={unit.purpose} onTerm={setActiveTerm} /></p>
                  <div className={`representation representation--${view}`}>
                    {view !== "source" && (
                      <div className="representation-pane twin-pane">
                        <div className="pane-label"><span>Source Twin</span><small>Readable Markdown</small></div>
                        <h4>Intended rules</h4>
                        <ol>
                          {unit.rules.map((rule) => <li key={rule}><TermText text={rule} onTerm={setActiveTerm} /></li>)}
                        </ol>
                        <h4>Observed in the code</h4>
                        <div className={`observed-card observed-card--${unit.status}`}>
                          <strong>{unit.status === "conflict" ? "Conflict" : unit.status === "review" ? "Evidence gap" : "Matches intent"}</strong>
                          <p><TermText text={unit.observed} onTerm={setActiveTerm} /></p>
                        </div>
                      </div>
                    )}
                    {view !== "twin" && (
                      <div className="representation-pane source-pane">
                        <div className="pane-label"><span>{unit.symbol}</span><small>{unit.sourcePath}</small></div>
                        <pre><code>{unit.source}</code></pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="intent-panel stage-panel">
                  <span className="stage-kicker">You lead with intent</span>
                  <h4>Describe the behavior you want.</h4>
                  <p>Write normally. Source Twin connects the request to agreed terms, current behavior, and evidence before code changes.</p>
                  <label htmlFor="intent">Proposed change</label>
                  <textarea id="intent" value={intent} onChange={(event) => setIntent(event.target.value)} rows={6} />
                  <div className="detected-terms">
                    <span>Connected context</span>
                    <button type="button" onClick={() => setActiveTerm(unit.id === "approve-refund" ? "finance-review" : "customer-email-directory")}>2 shared terms</button>
                    <span className="context-chip">1 logic flow</span>
                    <span className="context-chip">{unit.tests.length} linked tests</span>
                  </div>
                  <button className="primary-button stage-action" type="button" onClick={() => setStep(2)}>Review likely impact <span>→</span></button>
                </div>
              )}

              {step === 2 && (
                <div className="impact-panel stage-panel">
                  <span className="stage-kicker">System-wide reasoning</span>
                  <h4>Review the likely impact before coding.</h4>
                  <p>These are grounded leads, not claims of certainty. The agent must verify them against source and tests.</p>
                  <div className="impact-summary">
                    <div><strong>1</strong><span>direct flow</span></div>
                    <div><strong>{unit.id === "approve-refund" ? "2" : "3"}</strong><span>related behaviors</span></div>
                    <div><strong>{unit.tests.length}</strong><span>tests to verify</span></div>
                    <div><strong>1</strong><span>policy question</span></div>
                  </div>
                  <div className="impact-list">
                    <div className="impact-item impact-item--direct"><span>Direct</span><div><strong>{unit.label}</strong><small>{unit.sourcePath}#{unit.symbol}</small></div></div>
                    <div className="impact-item"><span>Related</span><div><strong>{unit.id === "approve-refund" ? "Display refund approval limits" : "Validate an email address"}</strong><small>Shares a term and runtime dependency</small></div></div>
                    <div className="impact-item"><span>Question</span><div><strong>{unit.id === "approve-refund" ? "Does the $500 limit include tax and shipping?" : "Should approved service domains be restricted?"}</strong><small>Intent is not defined in the current twin</small></div></div>
                  </div>
                  <button className="primary-button stage-action" type="button" onClick={() => setStep(3)}>Prepare agent handoff <span>→</span></button>
                </div>
              )}

              {step === 3 && (
                <div className="handoff-panel stage-panel">
                  <span className="stage-kicker">Reviewable change packet</span>
                  <h4>Give a coding agent the goal and its map.</h4>
                  <p>The packet carries intent and evidence. It does not prescribe an implementation or allow silent edits.</p>
                  <div className="agent-brief">
                    <div className="brief-top"><span>CHANGE REQUEST</span><button type="button" onClick={copyBrief}>{copyState}</button></div>
                    <p><strong>Goal</strong><br />{intent}</p>
                    <p><strong>Start here</strong><br />{unit.sourcePath}#{unit.symbol}</p>
                    <p><strong>Verify</strong><br />{unit.tests.join(" · ")}</p>
                    <p><strong>Return</strong><br />Code changes, test results, affected twin passages, and any newly discovered behavior.</p>
                  </div>
                  <div className="handoff-actions">
                    <button className="primary-button" type="button" onClick={() => setCopyState("Ready for MCP")}>Send through MCP <span>↗</span></button>
                    <button className="secondary-button" type="button" onClick={() => setStep(0)}>Back to the twin</button>
                  </div>
                  <small className="prototype-note">Prototype only — this demonstrates the interaction, not a live agent connection.</small>
                </div>
              )}
            </section>

            <aside className="inspector">
              <div className="inspector-block">
                <div className="nav-label">Current step</div>
                <strong>{workflow[step]}</strong>
                <p>{step === 0 ? "Read the claim and trace why Source Twin believes it." : step === 1 ? "Express the product rule without translating it into code." : step === 2 ? "See dependent behavior and unresolved questions early." : "Give an agent bounded, verifiable context."}</p>
              </div>

              {termInfo && activeTerm && (
                <div className="inspector-block term-detail">
                  <div className="nav-label">Selected term</div>
                  <code>{`{{${activeTerm}}}`}</code>
                  <p>{termInfo.meaning}</p>
                  <div><span>{termInfo.refs} references</span><span>{termInfo.owner}</span></div>
                  <button type="button" onClick={() => setActiveTerm(null)}>Close term</button>
                </div>
              )}

              <div className="inspector-block">
                <div className="nav-label">Evidence</div>
                <button className="evidence-item" type="button" onClick={() => setView("source")}>
                  <span className="file-type">TS</span>
                  <span><strong>{unit.symbol}</strong><small>{unit.sourcePath}</small></span>
                </button>
                {unit.tests.map((test) => (
                  <div className="evidence-item" key={test}>
                    <span className="file-type file-type--test">TEST</span>
                    <span><strong>{test}</strong><small>linked behavior evidence</small></span>
                  </div>
                ))}
              </div>

              <div className="inspector-block coverage-card">
                <div className="coverage-title"><span>Flow coverage</span><strong>{unit.coverage}%</strong></div>
                <div className="progress"><i style={{ width: `${unit.coverage}%` }} /></div>
                <div className="coverage-rows">
                  <span><StatusDot /> Source linked</span>
                  <span><StatusDot tone={unit.coverage === 100 ? "good" : "warn"} /> Tests {unit.coverage === 100 ? "complete" : "partial"}</span>
                  <span><StatusDot tone={unit.status === "verified" ? "good" : "warn"} /> Human review {unit.status === "verified" ? "current" : "needed"}</span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="patterns-section" id="patterns">
        <div className="section-intro">
          <div className="eyebrow">Real usage patterns</div>
          <h2>Different people enter through different questions.</h2>
          <p>Source Twin is one model with several useful views—not a separate workflow people must adopt.</p>
        </div>
        <div className="pattern-grid">
          <article>
            <span className="pattern-number">01 · Review</span>
            <h3>“Is the product doing something it should not?”</h3>
            <p>A founder or reviewer compares policy with observed behavior and traces a conflict to its source.</p>
            <div className="pattern-outcome"><strong>Helps by</strong><span>Making hidden behavior discussable without reading code.</span></div>
            <button type="button" onClick={() => jumpToDemo("admin-send-email", 0)}>Try privacy review <span>↗</span></button>
          </article>
          <article>
            <span className="pattern-number">02 · Plan</span>
            <h3>“What will this product decision touch?”</h3>
            <p>A product owner edits a rule and reviews connected flows, tests, and open questions before implementation.</p>
            <div className="pattern-outcome"><strong>Helps by</strong><span>Finding likely consequences while changes are still cheap.</span></div>
            <button type="button" onClick={() => jumpToDemo("approve-refund", 1)}>Try product planning <span>↗</span></button>
          </article>
          <article>
            <span className="pattern-number">03 · Learn</span>
            <h3>“How does this part of the system work?”</h3>
            <p>A new teammate follows plain-language flows, shared terms, evidence, and known gaps at their own depth.</p>
            <div className="pattern-outcome"><strong>Helps by</strong><span>Replacing code archaeology with an evidence-linked map.</span></div>
            <button type="button" onClick={() => jumpToDemo("invite-member", 0)}>Try onboarding view <span>↗</span></button>
          </article>
          <article>
            <span className="pattern-number">04 · Build</span>
            <h3>“Can my coding agent act on this safely?”</h3>
            <p>An engineer sends intent, relevant evidence, tests, and return requirements through an existing agent interface.</p>
            <div className="pattern-outcome"><strong>Helps by</strong><span>Turning a vague prompt into a bounded, reviewable change.</span></div>
            <button type="button" onClick={() => jumpToDemo("admin-send-email", 3)}>Try agent handoff <span>↗</span></button>
          </article>
        </div>
      </section>

      <section className="shape-section">
        <div className="section-intro">
          <div className="eyebrow">Proposed product shape</div>
          <h2>The files are the product. The viewer makes them easier to use.</h2>
        </div>
        <div className="shape-flow">
          <article><span>01</span><h3>Readable twin files</h3><p>Versioned Markdown holds logic, intended rules, observed behavior, evidence, and stable term references.</p><code>source-twin/**/*.st.md</code></article>
          <div className="shape-arrow">→</div>
          <article><span>02</span><h3>Semantic engine</h3><p>Indexes source symbols, tests, terms, freshness, relationships, and separate coverage signals.</p><code>scan · map · compare</code></article>
          <div className="shape-arrow">→</div>
          <article><span>03</span><h3>Agent interface</h3><p>MCP lets existing coding agents read context, propose updates, and return evidence-backed changes.</p><code>query · propose · verify</code></article>
          <div className="shape-arrow">→</div>
          <article><span>04</span><h3>Optional viewer</h3><p>A navigable projection for exploring logic, reviewing conflicts, planning changes, and understanding coverage.</p><code>explore · review · direct</code></article>
        </div>
      </section>

      <section className="scope-section" id="scope">
        <div className="section-intro section-intro--scope">
          <div>
            <div className="eyebrow">Scope to validate</div>
            <h2>A focused first release, with a clear path forward.</h2>
          </div>
          <p>This prototype suggests the smallest complete loop. The first release should prove that loop before adding collaboration or automation depth.</p>
        </div>
        <div className="scope-columns">
          <div className="scope-card scope-card--now">
            <div className="scope-heading"><span>First release</span><strong>The complete core loop</strong></div>
            <ul>
              <li><b>Repository setup</b><span>Create the sibling Source Twin directory and initial taxonomy.</span></li>
              <li><b>Generate and refresh</b><span>Map selected TypeScript/JavaScript logic and tests to readable artifacts.</span></li>
              <li><b>Explore and trace</b><span>Navigate flows, terms, source evidence, tests, freshness, and coverage.</span></li>
              <li><b>Intent proposals</b><span>Edit plain-language rules and review likely impact without silently changing code.</span></li>
              <li><b>Agent handoff</b><span>Expose context and reviewable change packets through MCP.</span></li>
              <li><b>Dogfooding</b><span>Maintain Source Twin’s own twin from the first working version.</span></li>
            </ul>
          </div>
          <div className="scope-card">
            <div className="scope-heading"><span>Later, if proven useful</span><strong>Expansion, not prerequisites</strong></div>
            <ul>
              <li><b>More languages</b><span>Add language adapters after the model works well for TypeScript/JavaScript.</span></li>
              <li><b>Team workflows</b><span>Approvals, comments, ownership rules, and hosted shared workspaces.</span></li>
              <li><b>Automatic code edits</b><span>Optional execution only after review and evidence boundaries are trusted.</span></li>
              <li><b>Rich diagrams</b><span>Generated concept maps and timelines as views over the same files.</span></li>
              <li><b>Policy enforcement</b><span>CI checks for critical intent violations once confidence is high enough.</span></li>
            </ul>
          </div>
        </div>
      </section>

      <section className="decision-section">
        <div>
          <div className="eyebrow eyebrow--light">What this prototype is asking</div>
          <h2>Does this feel like the right way to understand, direct, and review software?</h2>
        </div>
        <div className="decision-questions">
          <p><span>01</span>Is side-by-side code useful, or should plain English remain the default almost everywhere?</p>
          <p><span>02</span>Should intent changes start inside the viewer, ordinary files, or both equally?</p>
          <p><span>03</span>Is the agent handoff enough for v1, or must Source Twin execute changes itself?</p>
        </div>
      </section>

      <footer>
        <div className="brand"><span className="brand-mark">ST</span><span>Source Twin</span></div>
        <p>Software logic people can read, question, and direct.</p>
      </footer>
    </main>
  );
}
