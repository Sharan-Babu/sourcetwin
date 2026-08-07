import { execFile } from "node:child_process";
import { mkdtemp, mkdir, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface TestRepository {
  readonly root: string;
  readonly cleanup: () => Promise<void>;
  readonly commitAll: (message?: string) => Promise<string>;
  readonly git: (arguments_: readonly string[]) => Promise<string>;
  readonly write: (path: string, content: string) => Promise<void>;
}

export async function createTestRepository(): Promise<TestRepository> {
  const temporaryRoot = await mkdtemp(join(tmpdir(), "sourcetwin-repository-"));
  const root = await realpath(temporaryRoot);
  await execFileAsync("git", ["init", "--quiet", root]);
  const git = async (arguments_: readonly string[]): Promise<string> => {
    const { stdout } = await execFileAsync("git", [...arguments_], { cwd: root });
    return stdout.trim();
  };
  return {
    root,
    cleanup: () => rm(root, { force: true, recursive: true }),
    git,
    commitAll: async (message = "test fixture") => {
      await git(["add", "--all"]);
      await git([
        "-c", "user.name=Source Twin Tests",
        "-c", "user.email=tests@sourcetwin.local",
        "commit", "--quiet", "-m", message,
      ]);
      return git(["rev-parse", "HEAD"]);
    },
    write: async (path, content) => {
      const absolutePath = join(root, ...path.split("/"));
      await mkdir(dirname(absolutePath), { recursive: true });
      await writeFile(absolutePath, content);
    },
  };
}
