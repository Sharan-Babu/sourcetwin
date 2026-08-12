import { spawn } from "node:child_process";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import { createServer } from "node:net";

const wranglerCli = fileURLToPath(
  new URL("../../node_modules/wrangler/bin/wrangler.js", import.meta.url),
);

async function findAvailablePort() {
  const server = createServer();
  server.unref();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : undefined;
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));

  if (!port) {
    throw new Error("Could not reserve a local port for the Worker preview.");
  }
  return port;
}

async function waitUntilReady(child, url) {
  const deadline = Date.now() + 30_000;
  let output = "";
  child.stdout.on("data", (chunk) => { output += chunk; });
  child.stderr.on("data", (chunk) => { output += chunk; });

  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Worker preview exited before becoming ready.\n${output}`);
    }

    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // The local Worker is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  child.kill();
  throw new Error(`Worker preview did not become ready.\n${output}`);
}

export async function startWorkerPreview() {
  const port = await findAvailablePort();
  const url = new URL(`http://127.0.0.1:${port}`);
  const child = spawn(process.execPath, [wranglerCli, "dev", "--port", String(port)], {
    cwd: fileURLToPath(new URL("../../", import.meta.url)),
    env: { ...process.env, WRANGLER_SEND_METRICS: "false" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const exited = once(child, "exit");

  await waitUntilReady(child, url);

  return {
    url,
    async stop() {
      if (child.exitCode !== null) return;
      child.kill();
      await exited;
    },
  };
}
