import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the implemented Source Twin product overview", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Source Twin \| Readable Software Logic<\/title>/i);
  assert.match(html, /Read the software without translating the code\./);
  assert.match(html, /Six practical workflows/);
  assert.match(html, /Twin-first/);
  assert.match(html, /Code-first/);
  assert.match(html, /Real Luna run/);
  assert.match(html, /A real project, step by step/);
  assert.match(html, /Watch the twin and code evolve together\./);
  assert.match(html, /Before Source Twin/);
  assert.match(html, /Twin file/);
  assert.match(html, /Three commands complete the core loop\./);
  assert.match(html, /The files are the product/);
  assert.match(html, /illustrative example/);
  assert.match(html, /A complete workflow, without a platform around it\./);
  assert.match(html, /Inside this repository/);
  assert.match(html, /Deferred on purpose/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});

test("keeps the workflow interactive, responsive, accessible, and modular", async () => {
  const [page, flow, evolution, fileExplorer, flowCss, responsiveCss, tabNavigation, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/flow-demo.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/evolution-demo.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/file-explorer.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/styles/flows.css", import.meta.url), "utf8"),
    readFile(new URL("../app/styles/responsive.css", import.meta.url), "utf8"),
    readFile(new URL("../app/components/tab-navigation.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(flow, /["']use client["']/);
  assert.match(flow, /useState/);
  assert.match(flow, /role="tablist"/);
  assert.match(flow, /aria-selected=/);
  assert.match(flow, /tabIndex=/);
  assert.match(flow, /navigateTabs/);
  assert.match(flow, /role="tabpanel"/);
  assert.match(evolution, /Project evolution stages/);
  assert.match(evolution, /Project evidence views/);
  assert.match(evolution, /aria-controls="evolution-evidence-panel"/);
  assert.match(evolution, /aria-labelledby=/);
  assert.match(evolution, /tabIndex=/);
  assert.match(evolution, /Next stage/);
  assert.match(fileExplorer, /useState/);
  assert.match(fileExplorer, /aria-live="polite"/);
  assert.match(fileExplorer, /illustrative example/);
  assert.match(tabNavigation, /ArrowLeft/);
  assert.match(tabNavigation, /ArrowRight/);
  assert.match(tabNavigation, /Home/);
  assert.match(tabNavigation, /End/);
  assert.match(tabNavigation, /\.focus\(\)/);
  assert.match(flowCss, /\.flow-tab--active:hover\s*\{[^}]*color:\s*white;/s);
  assert.match(page, /aria-label="Source Twin command overview"/);
  assert.match(responsiveCss, /@media \(max-width: 760px\)/);
  assert.match(responsiveCss, /prefers-reduced-motion: reduce/);
  assert.match(layout, /title: "Source Twin \| Readable Software Logic"/);
  assert.match(packageJson, /"name": "source-twin-website"/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.ok(page.split("\n").length < 160, "the page composition should stay focused");
  assert.ok(flow.split("\n").length < 180, "the interactive flow should stay focused");
  assert.ok(evolution.split("\n").length < 180, "the evolution walkthrough should stay focused");
  assert.ok(fileExplorer.split("\n").length < 180, "the file explorer should stay focused");

  await assert.rejects(access(new URL("../app/_sites-preview", import.meta.url)));
});
