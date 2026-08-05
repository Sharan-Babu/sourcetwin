const Term = ({ children }: { children: React.ReactNode }) => (
  <span className="term">{`{{${children}}}`}</span>
);

const StatusDot = ({ tone = "good" }: { tone?: "good" | "warn" | "muted" }) => (
  <span className={`status-dot status-dot--${tone}`} aria-hidden="true" />
);

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="English Code home">
          <span className="brand-mark">EC</span>
          <span>English Code</span>
        </a>
        <div className="header-note">
          <StatusDot /> Product concept · v0.1
        </div>
      </header>

      <section className="hero" id="top">
        <div className="eyebrow">A semantic mirror for software</div>
        <h1>Read the logic. Trace the evidence. Change the intent.</h1>
        <p>
          English Code gives people and coding agents one shared, plain-language
          view of how a product works—and where every claim comes from.
        </p>
      </section>

      <section className="product-shell" aria-label="English Code product preview">
        <div className="product-bar">
          <div className="window-dots" aria-hidden="true"><i /><i /><i /></div>
          <div className="repo-path"><span>acme-mail</span> / english / logic / admin-send-email</div>
          <div className="sync-state"><StatusDot tone="warn" /> Needs review</div>
        </div>

        <div className="workspace">
          <aside className="navigator">
            <div className="nav-section">
              <div className="nav-label">Explore</div>
              <div className="nav-item nav-item--active"><span>Logic</span><b>24</b></div>
              <div className="nav-item"><span>Terms</span><b>51</b></div>
              <div className="nav-item"><span>Changes</span><b className="warn-count">3</b></div>
            </div>

            <div className="nav-section">
              <div className="nav-label">Email</div>
              <div className="tree-item tree-item--active">Send as the service</div>
              <div className="tree-item">Validate an address</div>
              <div className="tree-item">Deliver a message</div>
              <div className="tree-item">Record delivery</div>
            </div>

            <div className="coverage-mini">
              <div><span>Area coverage</span><strong>92%</strong></div>
              <div className="progress"><i /></div>
              <small>2 behaviors need evidence</small>
            </div>
          </aside>

          <article className="logic-view">
            <div className="logic-meta">
              <span>FLOW</span>
              <span>flow.admin-send-service-email</span>
            </div>
            <h2>Send an email as the service</h2>
            <p className="logic-purpose">
              An <Term>administrator</Term> can send a message from an approved
              service address without exposing or searching customer data.
            </p>

            <section className="logic-section">
              <div className="section-heading">
                <h3>Intended rules</h3>
                <span className="owner-badge">Human approved</span>
              </div>
              <ol className="rule-list">
                <li>The administrator enters a sender address directly.</li>
                <li>
                  The application <strong>must not search</strong>{" "}
                  <Term>customer-email-directory</Term> while the address is typed.
                </li>
                <li>
                  On submit, <Term>email-address-validator</Term> validates the address.
                </li>
                <li>
                  If valid, <Term>email-service</Term> sends the message.
                </li>
              </ol>
            </section>

            <section className="logic-section observed-section">
              <div className="section-heading">
                <h3>Observed in the code</h3>
                <span className="generated-badge">Code derived</span>
              </div>
              <div className="conflict-card">
                <div className="conflict-icon">!</div>
                <div>
                  <strong>Observed behavior conflicts with an intended rule</strong>
                  <p>
                    While the administrator types, the interface queries
                    <Term>customer-email-directory</Term> and displays matching users.
                  </p>
                  <div className="source-link">Found in compose.tsx · SenderAddressField</div>
                </div>
              </div>
            </section>
          </article>

          <aside className="evidence-panel">
            <div className="panel-block">
              <div className="nav-label">Evidence</div>
              <div className="evidence-item">
                <span className="file-type">TSX</span>
                <div><strong>SenderAddressField</strong><small>src/admin/email/compose.tsx</small></div>
              </div>
              <div className="evidence-item">
                <span className="file-type file-type--test">TEST</span>
                <div><strong>sendAsService</strong><small>tests/admin-email.test.ts</small></div>
              </div>
            </div>

            <div className="panel-block">
              <div className="nav-label">Terms used</div>
              <div className="term-row"><Term>administrator</Term><span>8 refs</span></div>
              <div className="term-row"><Term>email-service</Term><span>14 refs</span></div>
              <div className="term-row"><Term>customer-email-directory</Term><span>3 refs</span></div>
            </div>

            <div className="panel-block freshness">
              <div className="freshness-title"><StatusDot tone="warn" /><strong>Code changed</strong></div>
              <p>English was last verified before the latest source change.</p>
              <div className="change-summary"><span>+1 behavior</span><span>2 symbols affected</span></div>
            </div>
          </aside>
        </div>
      </section>

      <section className="principle-section">
        <div className="section-intro">
          <div className="eyebrow">The core, not the chrome</div>
          <h2>Readable files first. A richer view when it helps.</h2>
          <p>
            The product is a durable model stored with the repository. The page
            above is one projection of it—not the source of truth.
          </p>
        </div>

        <div className="artifact-example">
          <div className="artifact-top"><span>english/logic/admin-send-email.ec.md</span><b>Plain Markdown</b></div>
          <pre><code>{`# Send an email as the service

An {{administrator}} enters a sender address directly.

## Intended rules
- MUST NOT search {{customer-email-directory}} while typing.
- Validate with {{email-address-validator}} on submit.

## Evidence
- src/admin/email/compose.tsx#SenderAddressField
- tests/admin-email.test.ts#does-not-search-users`}</code></pre>
        </div>
      </section>

      <section className="system-section">
        <div className="section-intro section-intro--compact">
          <div className="eyebrow">One shared model</div>
          <h2>Meet people where they already work.</h2>
        </div>

        <div className="system-flow" aria-label="English Code system flow">
          <div className="flow-card"><span>01</span><h3>Code and tests</h3><p>Indexed with stable symbols and evidence.</p></div>
          <div className="flow-arrow" aria-hidden="true">→</div>
          <div className="flow-card flow-card--core"><span>02</span><h3>English Code</h3><p>Terms, logic, intent, links, and coverage.</p></div>
          <div className="flow-arrow" aria-hidden="true">→</div>
          <div className="flow-card"><span>03</span><h3>Existing coding agent</h3><p>Connect through MCP and reviewable change packets.</p></div>
        </div>
      </section>

      <section className="guarantees-section">
        <div className="section-intro section-intro--compact">
          <div className="eyebrow">Product boundaries</div>
          <h2>Four promises shape the first version.</h2>
        </div>
        <div className="guarantee-grid">
          <article><span>01</span><h3>Shared language</h3><p>Agents propose terminology. People approve it. References remain stable through refactors.</p></article>
          <article><span>02</span><h3>Grounded claims</h3><p>Important English behavior links back to source code, tests, or explicit human intent.</p></article>
          <article><span>03</span><h3>Reviewable sync</h3><p>Code and English can lead a change, but neither silently overwrites the other.</p></article>
          <article><span>04</span><h3>Honest coverage</h3><p>Structure, behavior, evidence, tests, freshness, and review are measured separately.</p></article>
        </div>
      </section>

      <section className="dogfood-section">
        <div>
          <div className="eyebrow eyebrow--light">The first real test</div>
          <h2>English Code will explain English Code.</h2>
        </div>
        <p>
          As soon as the core model can describe another project, this repository
          becomes its first maintained mirror. Every design choice must work on
          the system that implements it.
        </p>
      </section>

      <footer>
        <div className="brand"><span className="brand-mark">EC</span><span>English Code</span></div>
        <p>Software logic people can read, question, and direct.</p>
      </footer>
    </main>
  );
}
