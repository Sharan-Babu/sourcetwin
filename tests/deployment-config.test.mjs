import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import { gzipSync } from "node:zlib";

const root = new URL("../", import.meta.url);

test("configures the website for Cloudflare Workers through OpenNext", async () => {
  const [packageText, nextConfig, openNextConfig, wranglerText, headers] = await Promise.all([
    readFile(new URL("package.json", root), "utf8"),
    readFile(new URL("next.config.ts", root), "utf8"),
    readFile(new URL("open-next.config.ts", root), "utf8"),
    readFile(new URL("wrangler.jsonc", root), "utf8"),
    readFile(new URL("public/_headers", root), "utf8"),
  ]);
  const packageJson = JSON.parse(packageText);
  const wrangler = JSON.parse(wranglerText);

  assert.equal(packageJson.scripts.build, "next build");
  assert.equal(packageJson.homepage, "https://sourcetwin.com");
  assert.equal(packageJson.repository.url, "git+https://github.com/Sharan-Babu/sourcetwin.git");
  assert.match(packageJson.scripts.preview, /opennextjs-cloudflare build/);
  assert.match(packageJson.scripts.deploy, /opennextjs-cloudflare deploy/);
  assert.equal(typeof packageJson.dependencies["@opennextjs/cloudflare"], "string");
  assert.equal(packageJson.devDependencies.vinext, undefined);
  assert.equal(packageJson.devDependencies["@cloudflare/vite-plugin"], undefined);

  assert.match(nextConfig, /initOpenNextCloudflareForDev/);
  assert.match(nextConfig, /unoptimized: true/);
  assert.match(openNextConfig, /defineCloudflareConfig/);
  assert.equal(wrangler.name, "sourcetwin");
  assert.equal(wrangler.main, ".open-next/worker.js");
  assert.ok(wrangler.compatibility_flags.includes("nodejs_compat"));
  assert.equal(wrangler.assets.directory, ".open-next/assets");
  assert.equal(wrangler.observability.enabled, true);
  assert.match(headers, /Cache-Control: public,max-age=31536000,immutable/);

  for (const oldPath of [
    ".openai/hosting.json",
    "build/sites-vite-plugin.ts",
    "vite.config.ts",
    "worker/index.ts",
  ]) {
    await assert.rejects(access(new URL(oldPath, root)));
  }
});

test("keeps the compressed Worker under the free plan bundle limit", async () => {
  const worker = await readFile(new URL(".wrangler/dry-run/worker.js", root));
  const compressedBytes = gzipSync(worker).byteLength;

  assert.ok(
    compressedBytes < 3 * 1024 * 1024,
    `Worker gzip size is ${(compressedBytes / 1024 / 1024).toFixed(2)} MiB`,
  );
});
