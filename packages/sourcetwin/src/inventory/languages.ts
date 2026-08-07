import { extname } from "node:path";
import type { OutlineFile } from "./output.js";

const LANGUAGE_BY_EXTENSION: Readonly<Record<string, string>> = {
  ".cjs": "JavaScript",
  ".cts": "TypeScript",
  ".go": "Go",
  ".java": "Java",
  ".js": "JavaScript",
  ".jsx": "JavaScript",
  ".mjs": "JavaScript",
  ".mts": "TypeScript",
  ".py": "Python",
  ".pyi": "Python",
  ".rs": "Rust",
  ".ts": "TypeScript",
  ".tsx": "Tsx",
};

export function detectedLanguages(
  paths: readonly string[],
  outlined: readonly OutlineFile[],
): ReadonlyMap<string, string> {
  const detected = new Map<string, string>();
  for (const path of paths) {
    const language = LANGUAGE_BY_EXTENSION[extname(path).toLowerCase()];
    if (language) detected.set(path, language);
  }
  for (const { language, path } of outlined) detected.set(path, language);
  return detected;
}
