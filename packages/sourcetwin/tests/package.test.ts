import { execFile } from "node:child_process";
import { cp, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { delimiter, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const packageRoot = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
let temporaryRoot: string;
let consumerRoot: string;
let isolatedPackageRoot: string;

function runCli(...arguments_: readonly string[]) {
  return runNpm(
    ["exec", "--offline", "--", "sourcetwin", ...arguments_],
    { cwd: consumerRoot },
  );
}

function runNpm(
  arguments_: readonly string[],
  options: { readonly cwd: string; readonly env?: NodeJS.ProcessEnv },
) {
  const npmCli = process.env.npm_execpath;
  if (!npmCli) throw new Error("The package test must run from an npm command.");
  return execFileAsync(process.execPath, [npmCli, ...arguments_], {
    ...options,
    encoding: "utf8",
  });
}

beforeAll(async () => {
  temporaryRoot = await mkdtemp(join(tmpdir(), "sourcetwin-pack-test-"));
  consumerRoot = join(temporaryRoot, "consumer");
  isolatedPackageRoot = await mkdtemp(join(packageRoot, ".pack-test-"));
  await mkdir(consumerRoot);

  for (const path of [
    "package.json", "README.md", "LICENSE", "src", "tsconfig.json", "tsconfig.build.json",
  ]) {
    await cp(join(packageRoot, path), join(isolatedPackageRoot, path), {
      recursive: true,
    });
  }

  const workspaceBin = join(packageRoot, "..", "..", "node_modules", ".bin");

  await runNpm(["pack", "--pack-destination", temporaryRoot], {
    cwd: isolatedPackageRoot,
    env: { ...process.env, PATH: `${workspaceBin}${delimiter}${process.env.PATH ?? ""}` },
  });
  await runNpm(
    ["install", join(temporaryRoot, "sourcetwin-0.1.0.tgz")],
    { cwd: consumerRoot },
  );
});

afterAll(async () => {
  await rm(temporaryRoot, { force: true, recursive: true });
  await rm(isolatedPackageRoot, { force: true, recursive: true });
});

describe("published package", () => {
  it("installs a runnable CLI built by prepack", async () => {
    const { stderr, stdout } = await runCli("--version");

    expect(stderr).toBe("");
    expect(stdout).toBe("0.1.0\n");
  });

  it("exports its public API", async () => {
    const script = `
      import { exitCodeFor, renderResult } from 'sourcetwin';
      const result = {
        command: 'example', ok: true, summary: 'Ready.', details: [], diagnostics: [], data: {}
      };
      process.stdout.write(renderResult(result, { json: false }));
      console.log(exitCodeFor(result));
    `;
    const { stderr, stdout } = await execFileAsync(
      process.execPath,
      ["--input-type=module", "--eval", script],
      { cwd: consumerRoot },
    );

    expect(stderr).toBe("");
    expect(stdout).toBe("Ready.\n0\n");
  });

  it("contains its CLI entry point, metadata, and user documentation", async () => {
    const manifest = JSON.parse(
      await readFile(join(consumerRoot, "node_modules", "sourcetwin", "package.json"), "utf8"),
    ) as {
      readonly bin?: { readonly sourcetwin?: string };
      readonly engines?: { readonly node?: string };
      readonly homepage?: string;
      readonly license?: string;
      readonly repository?: { readonly directory?: string; readonly url?: string };
    };
    const installedRoot = join(consumerRoot, "node_modules", "sourcetwin");

    expect(manifest.bin?.sourcetwin).toBe("dist/cli.js");
    expect(manifest.engines?.node).toContain(">=22");
    expect(manifest.homepage).toBe("https://sourcetwin.com");
    expect(manifest.license).toBe("Apache-2.0");
    expect(manifest.repository).toEqual({
      directory: "packages/sourcetwin",
      type: "git",
      url: "git+https://github.com/Sharan-Babu/sourcetwin.git",
    });
    await expect(readFile(join(installedRoot, "README.md"), "utf8"))
      .resolves.toContain("sourcetwin check --base main");
    await expect(readFile(join(installedRoot, "LICENSE"), "utf8"))
      .resolves.toContain("Apache License");
  });

  it("ships the complete initialized, structural, coverage, help, and review workflow", async () => {
    await execFileAsync("git", ["init", "--quiet"], { cwd: consumerRoot });
    await runCli("init");
    await mkdir(join(consumerRoot, "src"));
    await writeFile(join(consumerRoot, ".gitignore"), "node_modules/\n");
    await writeFile(join(consumerRoot, "src", "service.ts"), "export function start() {}\n");
    await writeFile(
      join(consumerRoot, "source-twin", "config.yml"),
      `schema: 1
coverage:
  code: { include: [src/**/*.ts], exclude: [], entities: [function] }
  tests: { include: [], exclude: [], entities: [] }
`,
    );
    await writeFile(
      join(consumerRoot, "source-twin", "service.md"),
      "---\nid: service\nsource:\n  code: [src/service.ts#start]\n---\n# Service\n\nStarts.\n",
    );

    const checked = await runCli("check", "--json");
    const result = JSON.parse(checked.stdout) as { readonly ok: boolean };
    expect(result.ok).toBe(true);

    const coverage = JSON.parse((await runCli("coverage", "--json")).stdout) as {
      readonly ok: boolean;
      readonly data: { readonly code: { readonly entities: { readonly direct: number } } };
    };
    expect(coverage).toMatchObject({ ok: true, data: { code: { entities: { direct: 1 } } } });
    expect((await runCli("help", "logic")).stdout).toContain("# Logic files");

    await execFileAsync("git", ["add", ".gitignore", "package.json", "package-lock.json", "src", "source-twin"], {
      cwd: consumerRoot,
    });
    await execFileAsync("git", [
      "-c", "user.name=Source Twin Tests",
      "-c", "user.email=tests@sourcetwin.local",
      "commit", "--quiet", "-m", "baseline",
    ], { cwd: consumerRoot });
    await writeFile(join(consumerRoot, "src", "service.ts"), "export function start() { return true; }\n");
    await writeFile(
      join(consumerRoot, "source-twin", "service.md"),
      "---\nid: service\nsource:\n  code: [src/service.ts#start]\n---\n# Service\n\nStarts and confirms readiness.\n",
    );

    const reviewed = JSON.parse((await runCli("check", "--base", "HEAD", "--json")).stdout) as {
      readonly ok: boolean;
      readonly data: { readonly gitReview: { readonly paired: readonly unknown[] } };
    };
    expect(reviewed.ok).toBe(true);
    expect(reviewed.data.gitReview.paired).toHaveLength(1);
  });
});
