import { repositoryAreas } from "../product-data";

const modules = [
  ["cli + commands", "Thin command wiring for init, check, coverage, help, roots, and result rendering."],
  ["config + markdown", "Strict schema validation and flexible Markdown parsing with useful locations."],
  ["mappings + inventory", "Path references, exact locators, built-in entities, and project ast-grep rules."],
  ["coverage + Git", "Separate code/test counts and review categories against an explicit revision."],
  ["output + validation", "One typed result rendered as equivalent text or JSON diagnostics."],
] as const;

export function RepositoryOverview() {
  return (
    <>
      <section className="section system-section" id="system">
        <div className="section-heading section-heading--split">
          <div>
            <span className="kicker">How the system fits together</span>
            <h2>Files hold meaning. Tools verify structure.</h2>
          </div>
          <p>Modern coding agents still do the semantic reading and implementation work. Source Twin supplies durable context and deterministic guardrails.</p>
        </div>

        <div className="system-map">
          <article className="system-person"><span>Human + coding agent</span><strong>Discuss, approve, explain, implement</strong></article>
          <div className="system-arrow">↕</div>
          <article className="system-core"><span>source-twin/</span><strong>Markdown · terms · mappings · skill</strong><small>Versioned with the code in Git</small></article>
          <div className="system-split"><span>↙</span><span>↘</span></div>
          <div className="system-leaves">
            <article><span>Source + tests</span><strong>What the software does</strong></article>
            <article><span>Source Twin CLI</span><strong>Check · inventory · coverage · review</strong></article>
          </div>
        </div>

        <div className="coverage-legend">
          <article><i className="tone-direct" /><b>Direct</b><span>Exact entity locator</span></article>
          <article><i className="tone-file" /><b>File-level</b><span>Whole file starting point</span></article>
          <article><i className="tone-module" /><b>Module-level</b><span>Recursive directory</span></article>
          <article><i className="tone-gap" /><b>Unmapped</b><span>Inside scope, not connected</span></article>
          <article><i className="tone-broken" /><b>Broken</b><span>Authored target no longer resolves</span></article>
        </div>
        <p className="semantic-note">These are structural counts. They never claim that the English explanation is complete or correct.</p>
      </section>

      <section className="section repository-section" id="repository">
        <div className="section-heading section-heading--split">
          <div>
            <span className="kicker">Inside this repository</span>
            <h2>One private website. One publishable package.</h2>
          </div>
          <p>The CLI core stays focused and one-directional. The optional website is a separate local surface, not a dependency of Source Twin.</p>
        </div>

        <div className="repository-grid">
          <div className="repository-tree">
            {repositoryAreas.map(([path, description]) => (
              <article key={path}><code>{path}</code><p>{description}</p></article>
            ))}
          </div>
          <div className="module-list">
            <div className="module-title"><span>packages/sourcetwin/src/</span><small>41 focused TypeScript files</small></div>
            {modules.map(([name, description]) => (
              <article key={name}><b>{name}</b><p>{description}</p></article>
            ))}
          </div>
        </div>
      </section>

      <section className="section language-section">
        <div className="section-heading">
          <span className="kicker">Language-neutral format</span>
          <h2>Entity support where it is proven. Paths everywhere else.</h2>
        </div>
        <div className="language-table" role="table" aria-label="Current structural language support">
          <div className="language-row language-head" role="row"><span>Language</span><span>Code entities</span><span>Test entities</span></div>
          <div className="language-row" role="row"><b>JavaScript + TypeScript</b><span>functions · methods</span><span>test · it</span></div>
          <div className="language-row" role="row"><b>Python</b><span>functions · methods</span><span>pytest-style tests</span></div>
          <div className="language-row" role="row"><b>Go</b><span>functions · methods</span><span>Go tests</span></div>
          <div className="language-row" role="row"><b>Rust + Java</b><span>functions · methods</span><span>path-level</span></div>
          <div className="language-row" role="row"><b>Other languages</b><span>path-level</span><span>path-level</span></div>
        </div>
        <p className="language-footnote">Version-controlled project rules can add readable entities such as <code>POST /subscriptions/cancel</code> without a public plugin system.</p>
      </section>

      <section className="section boundary-section">
        <div>
          <span className="kicker kicker--light">Clear first-release boundary</span>
          <h2>Power from ordinary files, not more infrastructure.</h2>
        </div>
        <div className="boundary-columns">
          <article><span>Included</span><p>npm package, three operational commands, offline help, Markdown formats, mappings, entity coverage, Git review, text/JSON parity, skill, and CI.</p></article>
          <article><span>Deferred on purpose</span><p>Viewer integration, MCP, LSP, automatic prose or code generation, public plugins, migration commands, caching, thresholds, and standalone binaries.</p></article>
        </div>
      </section>
    </>
  );
}
