const uses = [
  ["Understand", "Ask what happens today.", "How does cancellation work now?"],
  ["Decide", "Agree on the next behavior.", "Annual customers keep access until renewal."],
  ["Build", "Direct code and test changes.", "Implement the approved twin and cover its cases."],
  ["Review", "See evidence and uncertainty.", "What changed, and what still needs investigation?"],
] as const;

const support = [
  ["JavaScript and TypeScript", "Functions, methods, test and it cases"],
  ["Python", "Functions, methods, pytest-style tests"],
  ["Go", "Functions, methods, Go tests"],
  ["Rust and Java", "Functions and methods, with path-level tests"],
  ["Other languages", "Path-level validation, with project rules for custom entities"],
] as const;

export function LaunchOverview() {
  return (
    <>
      <section className="section uses-section" id="uses">
        <div className="section-heading section-heading--split">
          <div>
            <span className="kicker">One shared way to work</span>
            <h2>From a question to reviewed code.</h2>
          </div>
          <p>The files stay with the repository, so each step uses the coding agent and Git workflow you already have.</p>
        </div>
        <div className="uses-grid">
          {uses.map(([title, description, example], index) => (
            <article key={title}>
              <div><span>{String(index + 1).padStart(2, "0")}</span><small>{description}</small></div>
              <h3>{title}</h3>
              <p>{example}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section support-section" id="support">
        <div className="support-panel">
          <div className="support-copy">
            <span className="kicker">Language-neutral files</span>
            <h2>Readable everywhere. Deeper where proven.</h2>
            <p>Every codebase gets path validation. Tested languages also get function, method, and test-level coverage.</p>
            <small>Coverage shows what is connected. It does not judge whether the English is complete.</small>
          </div>
          <table className="support-table">
            <caption className="visually-hidden">Current language support</caption>
            <thead><tr><th scope="col">Language</th><th scope="col">Structural support</th></tr></thead>
            <tbody>
              {support.map(([language, coverage]) => (
                <tr key={language}>
                  <th scope="row">{language}</th>
                  <td>{coverage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section start-section" id="start">
        <div>
          <span className="kicker kicker--light">Start inside your repository</span>
          <h2>Give your codebase a readable twin.</h2>
          <p>Install the CLI, create the foundation, and ask your coding agent to propose the first useful area.</p>
        </div>
        <div className="start-commands" aria-label="Source Twin installation commands">
          <code><span>$</span> npm install --save-dev sourcetwin</code>
          <code><span>$</span> npx sourcetwin init</code>
          <p>No account, hosted service, MCP server, or required viewer.</p>
        </div>
      </section>
    </>
  );
}
