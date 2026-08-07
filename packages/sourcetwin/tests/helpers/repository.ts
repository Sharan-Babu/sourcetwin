import { execFile } from "node:child_process";
import { mkdtemp, mkdir, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface TestRepository {
  readonly root: string;
  readonly cleanup: () => Promise<void>;
  readonly write: (path: string, content: string) => Promise<void>;
}

export async function createTestRepository(): Promise<TestRepository> {
  const temporaryRoot = await mkdtemp(join(tmpdir(), "sourcetwin-repository-"));
  const root = await realpath(temporaryRoot);
  await execFileAsync("git", ["init", "--quiet", root]);
  return {
    root,
    cleanup: () => rm(root, { force: true, recursive: true }),
    write: async (path, content) => {
      const absolutePath = join(root, ...path.split("/"));
      await mkdir(dirname(absolutePath), { recursive: true });
      await writeFile(absolutePath, content);
    },
  };
}
