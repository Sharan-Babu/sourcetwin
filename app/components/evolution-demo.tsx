"use client";

import { useState } from "react";
import { evidenceViews, walkthroughStages, type EvidenceView } from "../walkthrough-data";
import { navigateTabs } from "./tab-navigation";

const evidenceIds = evidenceViews.map(({ id }) => id);
const evidenceTabId = (id: string) => `evidence-tab-${id}`;

function LinePrefix({ tone }: { tone: "plain" | "add" | "remove" | "muted" }) {
  if (tone === "add") return <span>+</span>;
  if (tone === "remove") return <span>−</span>;
  return <span> </span>;
}

export function EvolutionDemo() {
  const [stageIndex, setStageIndex] = useState(0);
  const [view, setView] = useState<EvidenceView>("twin");
  const stage = walkthroughStages[stageIndex];
  const panel = stage.panels[view];

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
          a stage, then inspect the readable twin, implementation, tests, or terminal result.
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
            <div className="evidence-tabs" role="tablist" aria-label="Project evidence views">
              {evidenceViews.map((item, index) => (
                <button
                  aria-controls="evolution-evidence-panel"
                  aria-selected={view === item.id}
                  className={view === item.id ? "evidence-tab evidence-tab--active" : "evidence-tab"}
                  id={evidenceTabId(item.id)}
                  key={item.id}
                  onClick={() => setView(item.id)}
                  onKeyDown={(event) => navigateTabs({
                    currentIndex: index,
                    event,
                    ids: evidenceIds,
                    onSelect: (id) => setView(id as EvidenceView),
                    tabId: evidenceTabId,
                  })}
                  role="tab"
                  tabIndex={view === item.id ? 0 : -1}
                  type="button"
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div
              aria-labelledby={evidenceTabId(view)}
              className={`evolution-evidence evolution-evidence--${view}`}
              id="evolution-evidence-panel"
              role="tabpanel"
            >
              <div className="evidence-top"><span>{panel.filename}</span><small>{panel.label}</small></div>
              <div className="evidence-lines">
                {panel.lines.map((line, index) => (
                  <div className={`evidence-line evidence-line--${line.tone}`} key={`${line.text}-${index}`}>
                    <LinePrefix tone={line.tone} />
                    <code>{line.text || " "}</code>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
