"use client";

import { useState } from "react";
import { flows } from "../product-data";
import { navigateTabs } from "./tab-navigation";

const flowIds = flows.map(({ id }) => id);
const flowTabId = (id: string) => `flow-tab-${id}`;

export function FlowDemo() {
  const [selectedId, setSelectedId] = useState(flows[0].id);
  const selected = flows.find(({ id }) => id === selectedId) ?? flows[0];

  return (
    <section className="section flow-section" id="flows">
      <div className="section-heading section-heading--split">
        <div>
          <span className="kicker">Six practical workflows</span>
          <h2>Start with the question you already have.</h2>
        </div>
        <p>
          Source Twin is not another place to manage work. It gives people and agents a readable,
          testable layer inside the repository they already use.
        </p>
      </div>

      <div className="flow-tabs" role="tablist" aria-label="Source Twin workflows">
        {flows.map((flow, index) => (
          <button
            aria-controls={`flow-panel-${flow.id}`}
            aria-selected={selected.id === flow.id}
            className={selected.id === flow.id ? "flow-tab flow-tab--active" : "flow-tab"}
            id={flowTabId(flow.id)}
            key={flow.id}
            onClick={() => setSelectedId(flow.id)}
            onKeyDown={(event) => navigateTabs({
              currentIndex: index,
              event,
              ids: flowIds,
              onSelect: setSelectedId,
              tabId: flowTabId,
            })}
            role="tab"
            tabIndex={selected.id === flow.id ? 0 : -1}
            type="button"
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            {flow.label}
          </button>
        ))}
      </div>

      <article
        aria-labelledby={flowTabId(selected.id)}
        className="flow-stage"
        id={`flow-panel-${selected.id}`}
        role="tabpanel"
      >
        <div className="flow-story">
          <div className="flow-provenance"><i /> {selected.provenance}</div>
          <h3>{selected.title}</h3>
          <p>{selected.description}</p>

          <div className="prompt-card">
            <span>Human</span>
            <p>“{selected.prompt}”</p>
          </div>

          <div className="agent-actions">
            <span>Agent</span>
            <ol>
              {selected.actions.map((action) => <li key={action}>{action}</li>)}
            </ol>
          </div>
        </div>

        <div className="terminal-card" aria-label="Representative terminal result">
          <div className="terminal-top">
            <span><i /><i /><i /></span>
            <small>repository terminal</small>
          </div>
          <div className="terminal-command"><b>$</b> {selected.command}</div>
          <div className="terminal-output">
            {selected.output.map((line, index) => (
              <p key={line}><span>{index === 0 ? "✓" : "·"}</span>{line}</p>
            ))}
          </div>
          <div className="terminal-result">
            <span>Outcome</span>
            <p>{selected.result}</p>
          </div>
        </div>
      </article>

      <div className="flow-note">
        <strong>What the real Luna run proved</strong>
        <span>It discovered before editing, waited for approval, handled a late requirement, kept code and prose paired, and reported uncertainty.</span>
      </div>
    </section>
  );
}
