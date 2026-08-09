"use client";

import { useState } from "react";

type TwinFile = {
  id: string;
  name: string;
  path: string;
  tag: string;
  description: string;
  content: string;
};

const files: TwinFile[] = [
  { id: "readme", name: "README.md", path: "source-twin/README.md", tag: "writing style", description: "Repository-specific guidance keeps the twin concise and useful to its actual readers.", content: `# Source Twin\n\nExplain behavior in familiar words and short sentences.\n\n- Describe decisions, not syntax line by line.\n- Keep logic useful to technical and non-technical readers.\n- Put temporary thinking in drafts/.` },
  { id: "skill", name: "SKILL.md", path: "source-twin/SKILL.md", tag: "agent workflow", description: "One canonical, agent-neutral workflow covers setup, explanation, twin-first, code-first, and review.", content: `# Source Twin\n\n1. Read the repository README and config.\n2. Use offline help when a format is unfamiliar.\n3. Run check before relying on the twin.\n\nReport behavior, code, tests, terms, gaps, and uncertainty.` },
  { id: "config", name: "config.yml", path: "source-twin/config.yml", tag: "measured scope", description: "The human-approved scope says which code, tests, and entity kinds coverage should inventory.", content: `schema: 1\ncoverage:\n  code:\n    include: [src/**/*.js]\n    exclude: []\n    entities: [function]\n  tests:\n    include: [tests/**/*.test.js]\n    exclude: []\n    entities: [test]` },
  { id: "cancellation", name: "cancellation.md", path: "source-twin/subscriptions/cancellation.md", tag: "canonical logic", description: "The approved behavior is readable first, with a few precise places to begin deeper investigation.", content: `---\nid: subscriptions.cancellation\nsource:\n  code:\n    - src/subscriptions.js#cancelSubscription\n  tests:\n    - tests/subscriptions.test.js#an annual customer cancellation is scheduled for renewal\n---\n# Cancel a subscription\n\nAn annual {{subscription}} cancelled by a customer stays active until renewal.\n\n## Test coverage\n- Repeating the cancellation keeps the original date.` },
  { id: "renewal", name: "renewal.md", path: "source-twin/subscriptions/renewal.md", tag: "canonical logic", description: "Related logic is a separate conceptual file and can link to cancellation with ordinary Markdown.", content: `---\nid: subscriptions.renewal\nsource:\n  code:\n    - src/subscriptions.js#renewSubscription\n---\n# Renew a subscription\n\nAn active {{subscription}} renews for the requested period.\n\nIf cancellation is scheduled, renewal cancels it instead.` },
  { id: "subscription-term", name: "subscription.md", path: "source-twin/terms/subscription.md", tag: "shared term", description: "A stable term means the same product concept can be reused across many logic files.", content: `---\nid: subscription\n---\n# Subscription\n\nA customer's ongoing access to a paid plan, including its current status, plan interval, and renewal date.` },
  { id: "cancellation-term", name: "cancellation.md", path: "source-twin/terms/cancellation.md", tag: "shared term", description: "Term files define shared language; they do not duplicate an entire behavioral flow.", content: `---\nid: cancellation\n---\n# Cancellation\n\nThe decision and process that ends a subscription immediately or at its next renewal.` },
  { id: "draft", name: "billing-effects.md", path: "source-twin/drafts/billing-effects.md", tag: "non-canonical", description: "Drafts can hold uncertain or proposed work without claiming it is current software behavior.", content: `# Billing effects to investigate\n\n- Does scheduled cancellation notify the billing provider?\n- Who owns retries if that request fails?\n- Should the customer receive a reminder before renewal?\n\nThis draft is linkable, but it does not count as canonical logic.` },
];

function FileButton({ file, selected, onSelect }: { file: TwinFile; selected: boolean; onSelect: () => void }) {
  return (
    <li className={file.path.includes("/subscriptions/") || file.path.includes("/terms/") || file.path.includes("/drafts/") ? "tree-child" : ""}>
      <button className={selected ? "tree-file tree-file--selected" : "tree-file"} onClick={onSelect} type="button">
        <b>{file.name}</b><span>{file.tag}</span>
      </button>
    </li>
  );
}

export function FileExplorer() {
  const [selectedId, setSelectedId] = useState("cancellation");
  const selected = files.find(({ id }) => id === selectedId) ?? files[0];
  const groups = [
    { label: null, ids: ["readme", "skill", "config"] },
    { label: "logic/", ids: ["cancellation", "renewal"] },
    { label: "terms/", ids: ["subscription-term", "cancellation-term"] },
    { label: "drafts/", ids: ["draft"] },
  ];

  return (
    <div className="format-workbench">
      <div className="file-tree">
        <div className="file-tree-top">
          <span>subscription-service/source-twin/</span>
          <small>illustrative example</small>
        </div>
        <ul>
          {groups.map((group) => (
            <li className="tree-group-row" key={group.label ?? "root"}>
              {group.label && <div className="tree-folder"><b>{group.label}</b><span>{group.label === "logic/" ? "current behavior" : group.label === "terms/" ? "shared language" : "non-canonical"}</span></div>}
              <ul>
                {group.ids.map((id) => {
                  const file = files.find((item) => item.id === id)!;
                  return <FileButton file={file} key={file.id} onSelect={() => setSelectedId(file.id)} selected={file.id === selected.id} />;
                })}
              </ul>
            </li>
          ))}
        </ul>
      </div>

      <div className="markdown-card" aria-live="polite">
        <div className="markdown-top"><span>{selected.path}</span><small>{selected.tag}</small></div>
        <pre><code>{selected.content}</code></pre>
      </div>

      <aside className="file-inspector">
        <span>Selected file</span>
        <h3>{selected.name}</h3>
        <p>{selected.description}</p>
        <div><b>Readable directly</b><small>No generated viewer state</small></div>
        <div><b>Reviewed through Git</b><small>Changes travel with code and tests</small></div>
      </aside>
    </div>
  );
}
