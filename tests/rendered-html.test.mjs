import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import { parse as parseYaml } from "yaml";
import { heroExampleMarkdown } from "../app/hero-example.ts";
import { walkthroughStages } from "../app/walkthrough-data.ts";
import { logicFrontmatterSchema } from "../packages/sourcetwin/src/markdown/schema.ts";

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

test("server-renders the focused Source Twin launch website", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Source Twin \| Understand Software in Plain English<\/title>/i);
  assert.match(html, /Understand your software in plain English\./);
  assert.match(html, /subscription-service\/source-twin\//);
  assert.match(html, /Follow one change from question to review\./);
  assert.match(html, /A real multi-turn example/);
  assert.match(html, /Before Source Twin/);
  assert.match(html, /Twin file/);
  assert.match(html, /Three commands support the whole workflow\./);
  assert.match(html, /The files are the product/);
  assert.match(html, /illustrative example/);
  assert.match(html, /One readable layer for everyday software work\./);
  assert.match(html, /Precise where support is proven/);
  assert.match(html, /npm install --save-dev sourcetwin/);
  assert.doesNotMatch(html, /Inside this repository|Core workflow implemented/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});

test("keeps the launch experience interactive, accessible, responsive, and modular", async () => {
  const [
    page, evolution, walkthrough, fileExplorer, launch, responsiveCss,
    tabNavigation, layout, siteUrl, robots, sitemap, packageJson,
  ] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/evolution-demo.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/walkthrough-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/components/file-explorer.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/launch-overview.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/styles/responsive.css", import.meta.url), "utf8"),
    readFile(new URL("../app/components/tab-navigation.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/site-url.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/robots.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/sitemap.ts", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(evolution, /["']use client["']/);
  assert.match(evolution, /useState/);
  assert.match(evolution, /Project evolution stages/);
  assert.match(evolution, /Project evidence views/);
  assert.match(evolution, /aria-controls="evolution-evidence-panel"/);
  assert.match(evolution, /aria-labelledby=/);
  assert.match(evolution, /tabIndex=/);
  assert.match(walkthrough, /conversation:/);
  assert.match(walkthrough, /One more requirement/);
  assert.match(fileExplorer, /useState/);
  assert.match(fileExplorer, /aria-live="polite"/);
  assert.match(fileExplorer, /illustrative example/);
  assert.match(launch, /<table className="support-table">/);
  assert.match(launch, /scope="col"/);
  assert.match(launch, /scope="row"/);
  assert.match(launch, /Source Twin installation commands/);
  assert.match(tabNavigation, /ArrowLeft/);
  assert.match(tabNavigation, /ArrowRight/);
  assert.match(tabNavigation, /Home/);
  assert.match(tabNavigation, /End/);
  assert.match(tabNavigation, /\.focus\(\)/);
  assert.match(responsiveCss, /@media \(max-width: 760px\)/);
  assert.match(responsiveCss, /prefers-reduced-motion: reduce/);
  assert.match(layout, /title: "Source Twin \| Understand Software in Plain English"/);
  assert.match(layout, /alternates: \{ canonical: "\/" \}/);
  assert.match(siteUrl, /NEXT_PUBLIC_SITE_URL/);
  assert.match(robots, /sitemap\.xml/);
  assert.match(sitemap, /changeFrequency: "monthly"/);
  assert.match(packageJson, /"name": "source-twin-website"/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);

  for (const content of [page, walkthrough, launch, layout]) {
    assert.doesNotMatch(content, /[—–]/);
  }

  assert.ok(page.split("\n").length < 150, "the page composition should stay focused");
  assert.ok(evolution.split("\n").length < 180, "the walkthrough should stay focused");
  assert.ok(fileExplorer.split("\n").length < 180, "the file explorer should stay focused");
  assert.ok(launch.split("\n").length < 150, "the launch overview should stay focused");

  await assert.rejects(access(new URL("../app/_sites-preview", import.meta.url)));
});

test("keeps the displayed hero example and command evidence accurate", () => {
  const frontmatter = heroExampleMarkdown.match(/^---\n([\s\S]*?)\n---/);
  assert.ok(frontmatter?.[1]);
  assert.equal(logicFrontmatterSchema.safeParse(parseYaml(frontmatter[1])).success, true);
  assert.match(heroExampleMarkdown, /\n# Cancel a subscription\n/);

  for (const stageId of ["implement", "refine"]) {
    const stage = walkthroughStages.find(({ id }) => id === stageId);
    assert.ok(stage);
    const output = stage.panels.terminal.lines.map(({ text }) => text);
    assert.ok(output.includes("$ npm test"));
    assert.ok(output.includes("$ npm exec --offline -- sourcetwin check --base HEAD"));
    assert.ok(output.includes("$ npm exec --offline -- sourcetwin coverage"));
  }
});

test("ships a correctly sized social preview", async () => {
  const image = await readFile(new URL("../public/og.png", import.meta.url));

  assert.equal(image.subarray(1, 4).toString("ascii"), "PNG");
  assert.equal(image.readUInt32BE(16), 1200);
  assert.equal(image.readUInt32BE(20), 630);
});
