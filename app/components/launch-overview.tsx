const uses = [
  ["Understand", "Ask how a feature works and begin with a readable map before opening source files."],
  ["Plan", "Agree on the next behavior in English, then see the code and tests that may need to change."],
  ["Build", "Give your coding agent approved logic, shared terms, and precise starting points."],
  ["Review", "Use Git and deterministic checks to review logic, implementation, tests, and remaining gaps together."],
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
            <span className="kicker">Use the question you already have</span>
            <h2>One readable layer for everyday software work.</h2>
          </div>
          <p>Source Twin fits around your current coding agent and Git workflow. It does not add another place to manage work.</p>
        </div>
        <div className="uses-grid">
          {uses.map(([title, description], index) => (
            <article key={title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section support-section" id="support">
        <div className="section-heading section-heading--split">
          <div>
            <span className="kicker">Language-neutral files</span>
            <h2>Precise where support is proven. Useful everywhere else.</h2>
          </div>
          <p>Entity-level checks cover the first six code languages. Other codebases still get reliable path validation and can add project-owned rules.</p>
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
        <p className="support-note">Coverage shows what is connected. It never claims the English explanation is complete or correct.</p>
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
