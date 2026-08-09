"use client";

import { useState } from "react";
import { evidenceViews, walkthroughStages } from "../walkthrough-data";

function LinePrefix({ tone }: { tone: "plain" | "add" | "remove" | "muted" }) {
  if (tone === "add") return <span>+</span>;
  if (tone === "remove") return <span>−</span>;
  return <span> </span>;
}

export function EvolutionDemo() {
  const [stageIndex, setStageIndex] = useState(0);
  const stage = walkthroughStages[stageIndex];

  const move = (amount: number) => {
    setStageIndex((current) => Math.min(walkthroughStages.length - 1, Math.max(0, current + amount)));
  };

  return (
    <section className="section evolution-section" id="walkthrough">
      <div className="section-heading section-heading--split">
        <div>
          <span className="kicker">A real multi-turn example</span>
          <h2>Follow one change from question to review.</h2>
        </div>
        <p>
          This subscription scenario comes from a real multi-turn test with a coding agent. Choose
          a stage, then compare the readable twin, implementation, tests, and terminal result together.
        </p>
      </div>

      <div className="evolution-shell">
        <div className="evolution-steps" aria-label="Project evolution stages">
          {walkthroughStages.map((item, index) => (
            <button
              aria-current={index === stageIndex ? "step" : undefined}
              className={index === stageIndex ? "evolution-step evolution-step--active" : "evolution-step"}
              key={item.id}
              onClick={() => setStageIndex(index)}
              type="button"
            >
              <span>{index < stageIndex ? "✓" : index + 1}</span>
              <b>{item.label}</b>
            </button>
          ))}
        </div>

        <div className="evolution-body">
          <aside className="evolution-context">
            <div className="evolution-state">{stage.state}</div>
            <div className="evolution-counter">Stage {stageIndex + 1} of {walkthroughStages.length}</div>
            <h3>{stage.title}</h3>
            <p>{stage.summary}</p>

            <div className="walkthrough-conversation">
              <div><span>You</span><p>{stage.conversation.human}</p></div>
              <div><span>Agent</span><p>{stage.conversation.agent}</p></div>
            </div>

            <div className="evolution-counts">
              <div><span>Twin</span><strong>{stage.counts.twin}</strong></div>
              <div><span>Code</span><strong>{stage.counts.code}</strong></div>
              <div><span>Tests</span><strong>{stage.counts.tests}</strong></div>
            </div>

            <div className="evolution-nav">
              <button disabled={stageIndex === 0} onClick={() => move(-1)} type="button">← Previous</button>
              <button disabled={stageIndex === walkthroughStages.length - 1} onClick={() => move(1)} type="button">Next stage →</button>
            </div>
          </aside>

          <div className="evolution-workspace">
            <section className="evidence-board" aria-label="Project evidence">
              {evidenceViews.map((item) => {
                const panel = stage.panels[item.id];

                return (
                  <article
                    aria-labelledby={`evidence-title-${item.id}`}
                    className={`evolution-evidence evolution-evidence--${item.id}`}
                    key={item.id}
                  >
                    <div className="evidence-top">
                      <div>
                        <h4 id={`evidence-title-${item.id}`}>{item.label}</h4>
                        <strong>{panel.filename}</strong>
                      </div>
                      <small>{panel.label}</small>
                    </div>
                    <div className="evidence-lines">
                      {panel.lines.map((line, index) => (
                        <div className={`evidence-line evidence-line--${line.tone}`} key={`${line.text}-${index}`}>
                          <LinePrefix tone={line.tone} />
                          <code>{line.text || " "}</code>
                        </div>
                      ))}
                    </div>
                  </article>
                );
              })}
            </section>
          </div>
        </div>
      </div>
    </section>
  );
}
