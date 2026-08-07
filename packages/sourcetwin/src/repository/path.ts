import { realpath, stat } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";

export function fromRepositoryPath(root: string, repositoryPath: string): string {
  return resolve(root, ...repositoryPath.split("/"));
}

export function toRepositoryPath(root: string, absolutePath: string): string {
  return relative(root, absolutePath).split(sep).join("/");
}

export function isInsideRoot(root: string, absolutePath: string): boolean {
  const path = relative(root, absolutePath);
  return path === "" || (!path.startsWith(`..${sep}`) && path !== ".." && !isAbsolute(path));
}

export async function existingPathInsideRoot(
  root: string,
  repositoryPath: string,
): Promise<{
  readonly exists: boolean;
  readonly file: boolean;
  readonly directory: boolean;
  readonly resolvedPath?: string;
}> {
  try {
    const absolutePath = fromRepositoryPath(root, repositoryPath);
    const [resolvedRoot, resolvedPath, pathStat] = await Promise.all([
      realpath(root),
      realpath(absolutePath),
      stat(absolutePath),
    ]);
    if (!isInsideRoot(resolvedRoot, resolvedPath)) {
      return { exists: false, file: false, directory: false };
    }
    return {
      exists: true,
      file: pathStat.isFile(),
      directory: pathStat.isDirectory(),
      resolvedPath,
    };
  } catch {
    return { exists: false, file: false, directory: false };
  }
}
