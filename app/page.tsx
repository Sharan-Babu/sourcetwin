import { EvolutionDemo } from "./components/evolution-demo";
import { FlowDemo } from "./components/flow-demo";
import { ProductOverview } from "./components/product-overview";
import { RepositoryOverview } from "./components/repository-overview";

export default function Home() {
  return (
    <main id="top">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Source Twin home">
          <span className="brand-mark">ST</span>
          <span>Source Twin</span>
        </a>
        <nav className="site-nav" aria-label="Page sections">
          <a href="#flows">Workflows</a>
          <a href="#walkthrough">Walkthrough</a>
          <a href="#files">File format</a>
          <a href="#capabilities">Capabilities</a>
          <a href="#repository">Codebase</a>
        </nav>
        <div className="release-state"><i /> Core workflow implemented</div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <span className="kicker">Plain-language software logic, versioned with the code</span>
          <h1>Read the software without translating the code.</h1>
          <p>
            Source Twin gives people and coding agents a shared, readable mirror of behavior. It stays
            connected to real source, tests, terms, coverage, and Git review.
          </p>
          <div className="hero-actions">
            <a className="button button--primary" href="#flows">Explore the real workflows <span>↓</span></a>
            <a className="button button--quiet" href="#files">See the file format</a>
          </div>
          <div className="hero-principles">
            <span>Ordinary Markdown</span><span>No required viewer</span><span>Agent-neutral</span>
          </div>
        </div>

        <div className="hero-console" aria-label="Source Twin command overview">
          <div className="console-title"><span><i /><i /><i /></span><small>subscription-service</small></div>
          <div className="console-line"><b>$</b> npm exec --offline -- sourcetwin check --base HEAD</div>
          <div className="console-result">
            <p><span>✓</span> Source Twin is valid.</p>
            <p><span>·</span> Logic files <b>2</b> · Terms <b>3</b></p>
            <p><span>·</span> Paired changes <b>2</b> · Broken <b>0</b></p>
          </div>
          <div className="console-divider" />
          <div className="console-line"><b>$</b> npm exec --offline -- sourcetwin coverage</div>
          <div className="console-result">
            <p><span>✓</span> Code entities <b>2 / 2 direct</b></p>
            <p><span>✓</span> Test entities <b>11 / 11 direct</b></p>
            <p><span>·</span> Structural evidence, not a semantic score.</p>
          </div>
          <div className="console-caption"><i /> Result from the real Luna validation flow</div>
        </div>
      </section>

      <section className="proof-strip" aria-label="Current implementation proof">
        <article><strong>3</strong><span>operational commands</span></article>
        <article><strong>6</strong><span>proven code languages</span></article>
        <article><strong>139</strong><span>CLI tests passing</span></article>
        <article><strong>99.23%</strong><span>CLI line coverage</span></article>
        <article><strong>3 OS</strong><span>package CI matrix</span></article>
      </section>

      <FlowDemo />
      <EvolutionDemo />
      <ProductOverview />
      <RepositoryOverview />

      <footer>
        <div className="brand"><span className="brand-mark">ST</span><span>Source Twin</span></div>
        <p>The readable layer between product intent and implementation.</p>
        <a href="#top">Back to top ↑</a>
      </footer>
    </main>
  );
}
