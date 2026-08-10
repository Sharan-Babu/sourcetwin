const commands = [
  { name: "init", moment: "Start once", description: "Create the small foundation. Your agent proposes the first useful area." },
  { name: "check", moment: "After edits", description: "Catch broken files, terms, links, mappings, and exact source locators." },
  { name: "coverage", moment: "When reviewing", description: "See which code and tests are connected, broad, missing, or unsupported." },
] as const;

export function ProductOverview() {
  return (
    <section className="section command-section" id="commands">
      <div className="section-heading section-heading--split command-heading">
        <div>
          <span className="kicker">A small tool by design</span>
          <h2>Three commands. One clear loop.</h2>
        </div>
        <p>Source Twin handles setup, validation, and coverage. Your coding agent and Git handle the work around them.</p>
      </div>

      <div className="command-panel">
        <div className="command-grid">
          {commands.map(({ name, moment, description }, index) => (
            <article key={name}>
              <div className="command-order"><span>0{index + 1}</span><small>{moment}</small></div>
              <code><span>$</span> sourcetwin {name}</code>
              <p>{description}</p>
            </article>
          ))}
        </div>

        <div className="help-strip">
          <span>Need the format?</span>
          <code>sourcetwin help config | logic | terms | rules</code>
          <p>Offline, version-matched, and available to your agent.</p>
        </div>
      </div>
    </section>
  );
}
