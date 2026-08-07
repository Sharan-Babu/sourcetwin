import { availableParallelism } from "node:os";
import pLimit from "p-limit";

const MAX_ARGUMENT_CHARACTERS = 6000;
export const AST_GREP_PROCESS_LIMIT = Math.max(1, Math.min(availableParallelism(), 8));
const limitProcess = pLimit(AST_GREP_PROCESS_LIMIT);

export function pathBatches(paths: readonly string[]): string[][] {
  const result: string[][] = [];
  let current: string[] = [];
  let characters = 0;
  for (const path of paths) {
    if (current.length > 0 && characters + path.length + 1 > MAX_ARGUMENT_CHARACTERS) {
      result.push(current);
      current = [];
      characters = 0;
    }
    current.push(path);
    characters += path.length + 1;
  }
  if (current.length > 0) result.push(current);
  return result;
}

export async function mapPathBatches<T>(
  paths: readonly string[],
  operation: (batch: readonly string[]) => Promise<T>,
): Promise<T[]> {
  return Promise.all(pathBatches(paths).map((batch) =>
    limitProcess(() => operation(batch))));
}
