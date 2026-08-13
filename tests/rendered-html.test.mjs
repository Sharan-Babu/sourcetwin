import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test, { after, before } from "node:test";
import { parse as parseYaml } from "yaml";
import { heroExampleMarkdown } from "../app/hero-example.ts";
import { productFilmUrl } from "../app/product-film-url.ts";
import { walkthroughStages } from "../app/walkthrough-data.ts";
import { logicFrontmatterSchema } from "../packages/sourcetwin/src/markdown/schema.ts";
import { startWorkerPreview } from "./helpers/worker-preview.mjs";

const expectedSiteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");
let workerPreview;

before(async () => {
  workerPreview = await startWorkerPreview();
});

after(async () => {
  await workerPreview?.stop();
});

async function render(path = "/") {
  return fetch(new URL(path, workerPreview.url), {
    headers: { accept: "text/html" },
  });
}

test("server-renders the focused Source Twin launch website", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Source Twin \| Understand Software in Plain English<\/title>/i);
  assert.match(html, /Understand your software in plain English\./);
  assert.match(html, /subscription-service\/source-twin\//);
  assert.match(html, /Follow one change from idea to reviewed code\./);
  assert.match(html, /See Source Twin in practice/);
  assert.match(html, /Watch Source Twin at work/);
  assert.match(html, /From a mistaken message to reviewed code\./);
  assert.match(html, /<video[^>]*aria-label="Source Twin product walkthrough"/);
  assert.ok(html.includes(productFilmUrl));
  assert.match(html, /source-twin-walkthrough-en\.vtt/);
  assert.match(html, /Problem identified/);
  assert.match(html, /Twin file/);
  assert.match(html, /src\/subscriptions\.js/);
  assert.match(html, /tests\/subscriptions\.test\.js/);
  assert.match(html, /repository terminal/);
  for (const view of ["twin", "code", "tests", "terminal"]) {
    assert.match(html, new RegExp(`aria-labelledby="evidence-title-${view}"`));
  }
  assert.match(html, /Three commands\. One clear loop\./);
  assert.match(html, /The files behind the journey/);
  assert.match(html, /illustrative example/);
  assert.match(html, /From a question to reviewed code\./);
  assert.match(html, /Readable everywhere\. Deeper where proven\./);
  assert.match(html, /source-twin-mark\.png/);
  assert.match(html, /npm install --save-dev sourcetwin/);
  assert.ok(html.includes(`<link rel="canonical" href="${expectedSiteUrl.origin}"`));
  assert.ok(html.includes(`property="og:image" content="${new URL("/og.png", expectedSiteUrl).href}"`));
  assert.doesNotMatch(html, /Inside this repository|Core workflow implemented/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});

test("keeps the launch experience interactive, accessible, responsive, and modular", async () => {
  const [
    page, practice, productFilm, evolution, walkthrough, fileExplorer, launch, product, responsiveCss,
    baseCss, evolutionCss, filmCss, launchCss, layout, siteUrl, robots, sitemap, packageJson,
  ] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/practice-overview.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/product-film.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/evolution-demo.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/walkthrough-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/components/file-explorer.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/launch-overview.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/product-overview.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/styles/responsive.css", import.meta.url), "utf8"),
    readFile(new URL("../app/styles/base.css", import.meta.url), "utf8"),
    readFile(new URL("../app/styles/evolution.css", import.meta.url), "utf8"),
    readFile(new URL("../app/styles/film.css", import.meta.url), "utf8"),
    readFile(new URL("../app/styles/launch.css", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/site-url.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/robots.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/sitemap.ts", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(evolution, /["']use client["']/);
  assert.match(practice, /<EvolutionDemo \/>/);
  assert.match(page, /<ProductFilm \/>/);
  assert.match(productFilm, /controls/);
  assert.match(productFilm, /playsInline/);
  assert.match(productFilm, /preload="metadata"/);
  assert.match(productFilm, /kind="captions"/);
  assert.match(productFilm, /default/);
  assert.match(productFilm, /productFilmUrl/);
  assert.match(practice, /<FileExplorer \/>/);
  assert.match(practice, /id="walkthrough"/);
  assert.match(practice, /id="files"/);
  assert.match(evolution, /useState/);
  assert.match(evolution, /Project evolution stages/);
  assert.match(evolution, /Project evidence/);
  assert.match(evolution, /evidenceViews\.map/);
  assert.match(evolution, /aria-labelledby=\{`evidence-title-/);
  assert.doesNotMatch(evolution, /role="tab"|role="tabpanel"|aria-selected/);
  assert.match(walkthrough, /conversation:/);
  assert.match(walkthrough, /One more requirement/);
  assert.match(fileExplorer, /useState/);
  assert.match(fileExplorer, /aria-live="polite"/);
  assert.match(fileExplorer, /illustrative example/);
  assert.match(fileExplorer, /renewal-term/);
  assert.match(launch, /<table className="support-table">/);
  assert.match(launch, /support-panel/);
  assert.match(launch, /How does cancellation work now\?/);
  assert.match(product, /command-panel/);
  assert.match(launch, /scope="col"/);
  assert.match(launch, /scope="row"/);
  assert.match(launch, /Source Twin installation commands/);
  assert.match(evolutionCss, /\.evidence-board \{[^}]*grid-template-columns: repeat\(2/);
  assert.match(evolutionCss, /justify-content: flex-start/);
  assert.match(evolutionCss, /\.practice-files/);
  assert.match(filmCss, /aspect-ratio: 16 \/ 9/);
  assert.doesNotMatch(launchCss, /\.uses-grid article:hover/);
  assert.match(responsiveCss, /@media \(max-width: 760px\)/);
  assert.match(responsiveCss, /\.evidence-board \{ grid-template-columns: 1fr; \}/);
  assert.match(responsiveCss, /prefers-reduced-motion: reduce/);
  assert.match(responsiveCss, /animation-duration: \.001ms !important/);
  assert.match(baseCss, /@keyframes rise-in/);
  assert.match(evolutionCss, /@keyframes stage-change/);
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
  assert.ok(practice.split("\n").length < 100, "the practice chapter should stay focused");
  assert.ok(productFilm.split("\n").length < 80, "the product film should stay focused");
  assert.ok(evolution.split("\n").length < 180, "the walkthrough should stay focused");
  assert.ok(fileExplorer.split("\n").length < 180, "the file explorer should stay focused");
  assert.ok(launch.split("\n").length < 150, "the launch overview should stay focused");
  assert.ok(product.split("\n").length < 150, "the product overview should stay focused");

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

test("ships correctly prepared launch images and captions", async () => {
  const [image, mark, icon, favicon, poster, captions] = await Promise.all([
    readFile(new URL("../public/og.png", import.meta.url)),
    readFile(new URL("../public/source-twin-mark.png", import.meta.url)),
    readFile(new URL("../app/icon.png", import.meta.url)),
    readFile(new URL("../app/favicon.ico", import.meta.url)),
    readFile(new URL("../public/source-twin-walkthrough-poster.jpg", import.meta.url)),
    readFile(new URL("../public/source-twin-walkthrough-en.vtt", import.meta.url), "utf8"),
  ]);

  assert.equal(image.subarray(1, 4).toString("ascii"), "PNG");
  assert.equal(image.readUInt32BE(16), 1200);
  assert.equal(image.readUInt32BE(20), 630);
  assert.equal(mark.subarray(1, 4).toString("ascii"), "PNG");
  assert.equal(mark.readUInt32BE(16), 1000);
  assert.equal(mark.readUInt32BE(20), 1000);
  assert.equal(icon.readUInt32BE(16), 512);
  assert.equal(icon.readUInt32BE(20), 512);
  assert.equal(favicon.subarray(0, 4).toString("hex"), "00000100");
  assert.equal(poster.subarray(0, 2).toString("hex"), "ffd8");
  assert.match(captions, /^WEBVTT/);
  assert.match(captions, /Nothing leaves the system/);
  assert.match(productFilmUrl, /^https:\/\/media\.sourcetwin\.com\/videos\/.+\.mp4$/);
  await assert.rejects(access(new URL("../public/source-twin-walkthrough.mp4", import.meta.url)));
});

test("serves robots and sitemap discovery routes", async () => {
  const [robots, sitemap] = await Promise.all([render("/robots.txt"), render("/sitemap.xml")]);

  assert.equal(robots.status, 200);
  assert.match(robots.headers.get("content-type") ?? "", /^text\/plain/i);
  assert.ok((await robots.text()).includes(`Sitemap: ${new URL("/sitemap.xml", expectedSiteUrl).href}`));
  assert.equal(sitemap.status, 200);
  assert.match(sitemap.headers.get("content-type") ?? "", /xml/i);
  assert.ok((await sitemap.text()).includes(`<loc>${expectedSiteUrl.href}</loc>`));
});
