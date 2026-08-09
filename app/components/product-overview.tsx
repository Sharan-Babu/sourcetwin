import { capabilities } from "../product-data";
import { FileExplorer } from "./file-explorer";

const commands = [
  ["init", "Create only config, writing guidance, and the portable skill. Never overwrite an existing twin."],
  ["check", "Validate authored files, terms, links, mappings, exact locators, and optional Git review."],
  ["coverage", "Measure code and tests independently and expose direct, broad, missing, or unsupported areas."],
] as const;

export function ProductOverview() {
  return (
    <>
      <section className="section command-section" id="commands">
        <div className="section-heading">
          <span className="kicker">A deliberately small CLI</span>
          <h2>Three commands complete the core loop.</h2>
          <p>Offline help documents the formats. Existing agents, Git, and search tools handle everything else.</p>
        </div>

        <div className="command-grid">
          {commands.map(([name, description], index) => (
            <article key={name}>
              <div><span>0{index + 1}</span><code>sourcetwin {name}</code></div>
              <p>{description}</p>
            </article>
          ))}
        </div>

        <div className="help-strip">
          <span>Version-matched offline reference</span>
          <code>sourcetwin help config | logic | terms | rules</code>
          <p>Help explains the format; check proves the files obey it.</p>
        </div>
      </section>

      <section className="section format-section" id="files">
        <div className="section-heading section-heading--split">
          <div>
            <span className="kicker">The files are the product</span>
            <h2>Readable before any viewer exists.</h2>
          </div>
          <p>
            Canonical logic mirrors current code. During a twin-first change it temporarily describes
            the approved next state, and Git keeps that difference visible.
          </p>
        </div>

        <FileExplorer />
      </section>

      <section className="section capability-section" id="capabilities">
        <div className="section-heading">
          <span className="kicker">Implemented today</span>
          <h2>A complete workflow, without a platform around it.</h2>
        </div>
        <div className="capability-grid">
          {capabilities.map(([title, description], index) => (
            <article key={title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
