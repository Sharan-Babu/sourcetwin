import Image from "next/image";
import { EvolutionDemo } from "./components/evolution-demo";
import { LaunchOverview } from "./components/launch-overview";
import { ProductOverview } from "./components/product-overview";
import { heroExample } from "./hero-example";

export default function Home() {
  const [beforeTerm, afterTerm] = heroExample.paragraphs[0].split("{{subscription}}");

  return (
    <main id="top">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Source Twin home">
          <Image alt="" className="brand-mark" height={32} priority src="/source-twin-mark.png" width={32} />
          <span>Source Twin</span>
        </a>
        <nav className="site-nav" aria-label="Page sections">
          <a href="#walkthrough">Walkthrough</a>
          <a href="#files">File format</a>
          <a href="#uses">Use cases</a>
        </nav>
        <a className="header-action" href="#start">Get started</a>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <span className="kicker">A readable layer for every codebase</span>
          <h1>Understand your software in plain English.</h1>
          <p>
            Source Twin keeps a readable mirror of your code beside the code itself. You and your
            coding agent use the same files to explain behavior, plan changes, and review what happened.
          </p>
          <div className="hero-actions">
            <a className="button button--primary" href="#walkthrough">Walk through a real change <span>↓</span></a>
            <a className="button button--quiet" href="#files">See the actual files</a>
          </div>
          <div className="hero-principles">
            <span>Plain Markdown</span><span>Lives in Git</span><span>Works with existing coding agents</span>
          </div>
        </div>

        <article className="hero-artifact" aria-label="Example Source Twin file">
          <div className="artifact-top">
            <span>{heroExample.path}</span>
            <small>{heroExample.filename}</small>
          </div>
          <div className="artifact-frontmatter">
            {heroExample.frontmatter.map((line) => <code key={line}>{line || " "}</code>)}
          </div>
          <div className="artifact-body">
            <span>Current behavior</span>
            <h2>{heroExample.title}</h2>
            <p>{beforeTerm}<code>{"{{subscription}}"}</code>{afterTerm}</p>
            <p>{heroExample.paragraphs[1]}</p>
          </div>
          <div className="artifact-foot">
            <span>Readable on its own</span>
            <span>Connected to code and tests</span>
          </div>
        </article>
      </section>

      <section className="foundation-strip" aria-label="Source Twin foundations">
        <article><strong>Files first</strong><span>No viewer is required to understand the logic.</span></article>
        <article><strong>Agent-neutral</strong><span>Use the coding agent and terminal you already have.</span></article>
        <article><strong>Reviewable</strong><span>Logic, code, and tests change together in Git.</span></article>
      </section>

      <EvolutionDemo />
      <ProductOverview />
      <LaunchOverview />

      <footer>
        <div className="brand">
          <Image alt="" className="brand-mark" height={32} src="/source-twin-mark.png" width={32} />
          <span>Source Twin</span>
        </div>
        <p>A readable mirror for software and the people who shape it.</p>
        <div className="footer-links"><a href="#files">Files</a><a href="#start">Install</a><a href="#top">Back to top</a></div>
      </footer>
    </main>
  );
}
