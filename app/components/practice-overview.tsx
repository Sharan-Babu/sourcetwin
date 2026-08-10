import { EvolutionDemo } from "./evolution-demo";
import { FileExplorer } from "./file-explorer";

export function PracticeOverview() {
  return (
    <section className="section practice-section" id="walkthrough">
      <div className="section-heading section-heading--split">
        <div>
          <span className="kicker">See Source Twin in practice</span>
          <h2>Follow one change from idea to reviewed code.</h2>
        </div>
        <p>
          Start with a customer problem, agree on the behavior, then review the readable twin,
          implementation, tests, and terminal result together.
        </p>
      </div>

      <EvolutionDemo />

      <div className="practice-files" id="files">
        <div>
          <span className="kicker">The files behind the journey</span>
          <h3>Open the readable layer from the same project.</h3>
        </div>
        <p>
          The finished journey becomes ordinary Markdown in the repository. Select a file to see
          how guidance, scope, behavior, shared terms, and drafts fit together.
        </p>
      </div>

      <FileExplorer />
    </section>
  );
}
