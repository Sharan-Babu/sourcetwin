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

test("server-renders the interactive Source Twin concept", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Source Twin — Interactive Product Concept<\/title>/i);
  assert.match(html, /Experience the product before we build it\./);
  assert.match(html, /Work inside a sample product\./);
  assert.match(html, /Catch a risky behavior/);
  assert.match(html, /Change intent/);
  assert.match(html, /Review impact/);
  assert.match(html, /Agent handoff/);
  assert.match(html, /A focused first release/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});

test("keeps the prototype interactive, responsive, and accessible", async () => {
  const [page, css, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /["']use client["']/);
  assert.match(page, /useState/);
  assert.match(page, /navigator\.clipboard\.writeText/);
  assert.match(page, /aria-label="Guided workflow"/);
  assert.match(page, /Plain English/);
  assert.match(page, /Send through MCP/);
  assert.match(css, /@media \(max-width: 800px\)/);
  assert.match(css, /focus-visible/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(layout, /title: "Source Twin — Interactive Product Concept"/);
  assert.match(packageJson, /"name": "source-twin-website"/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);

  await assert.rejects(access(new URL("../app/_sites-preview", import.meta.url)));
});
