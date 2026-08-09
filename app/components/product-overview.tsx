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
          <span className="kicker">A small tool by design</span>
          <h2>Three commands support the whole workflow.</h2>
          <p>Your coding agent, Git, and normal search tools handle the rest.</p>
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

    </>
  );
}
