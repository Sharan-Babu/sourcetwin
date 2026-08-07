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

beforeAll(async () => {
  temporaryRoot = await mkdtemp(join(tmpdir(), "sourcetwin-pack-test-"));
  consumerRoot = join(temporaryRoot, "consumer");
  isolatedPackageRoot = await mkdtemp(join(packageRoot, ".pack-test-"));
  await mkdir(consumerRoot);

  for (const path of ["package.json", "src", "tsconfig.json", "tsconfig.build.json"]) {
    await cp(join(packageRoot, path), join(isolatedPackageRoot, path), {
      recursive: true,
    });
  }

  const workspaceBin = join(packageRoot, "..", "..", "node_modules", ".bin");

  await execFileAsync("npm", ["pack", "--pack-destination", temporaryRoot], {
    cwd: isolatedPackageRoot,
    env: { ...process.env, PATH: `${workspaceBin}${delimiter}${process.env.PATH ?? ""}` },
  });
  await execFileAsync(
    "npm",
    ["install", join(temporaryRoot, "sourcetwin-0.1.0.tgz")],
    { cwd: consumerRoot },
  );
});

afterAll(async () => {
  await rm(temporaryRoot, { force: true, recursive: true });
  await rm(isolatedPackageRoot, { force: true, recursive: true });
});

describe("published package", () => {
  it("installs an executable CLI built by prepack", async () => {
    const executable = join(consumerRoot, "node_modules", ".bin", "sourcetwin");
    const { stderr, stdout } = await execFileAsync(executable, ["--version"]);

    expect(stderr).toBe("");
    expect(stdout).toBe("0.1.0\n");
  });

  it("exports its public API", async () => {
    const script = "import { exitCodeFor } from 'sourcetwin'; console.log(exitCodeFor({ ok: true }));";
    const { stderr, stdout } = await execFileAsync(
      process.execPath,
      ["--input-type=module", "--eval", script],
      { cwd: consumerRoot },
    );

    expect(stderr).toBe("");
    expect(stdout).toBe("0\n");
  });

  it("contains the declared CLI entry point", async () => {
    const manifest = JSON.parse(
      await readFile(join(consumerRoot, "node_modules", "sourcetwin", "package.json"), "utf8"),
    ) as { readonly bin?: { readonly sourcetwin?: string } };

    expect(manifest.bin?.sourcetwin).toBe("dist/cli.js");
  });

  it("ships a working structural inventory dependency", async () => {
    const executable = join(consumerRoot, "node_modules", ".bin", "sourcetwin");
    await execFileAsync("git", ["init", "--quiet"], { cwd: consumerRoot });
    await execFileAsync(executable, ["init"], { cwd: consumerRoot });
    await mkdir(join(consumerRoot, "src"));
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

    const checked = await execFileAsync(executable, ["check", "--json"], { cwd: consumerRoot });
    const result = JSON.parse(checked.stdout) as { readonly ok: boolean };
    expect(result.ok).toBe(true);
  });
});
