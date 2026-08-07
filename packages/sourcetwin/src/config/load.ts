import { readFile } from "node:fs/promises";
import { LineCounter, parseDocument } from "yaml";
import type { Diagnostic } from "../core/result.js";
import { PACKAGE_VERSION, SUPPORTED_SCHEMAS } from "../core/version.js";
import { existingPathInsideRoot } from "../repository/path.js";
import { configSchema, type SourceTwinConfig } from "./schema.js";

export interface ConfigLoadResult {
  readonly config?: SourceTwinConfig;
  readonly diagnostics: readonly Diagnostic[];
}

function configDiagnostic(
  code: string,
  message: string,
  suggestion: string,
  line?: number,
): Diagnostic {
  return {
    code,
    severity: "error",
    message,
    location: line === undefined
      ? { path: "source-twin/config.yml" }
      : { path: "source-twin/config.yml", line },
    suggestion,
    help: "sourcetwin help config",
  };
}

export async function loadConfig(repositoryRoot: string): Promise<ConfigLoadResult> {
  const repositoryPath = "source-twin/config.yml";
  const target = await existingPathInsideRoot(repositoryRoot, repositoryPath);
  const configPath = target.file ? target.resolvedPath : undefined;
  if (!configPath) {
    return {
      diagnostics: [
        configDiagnostic(
          "ST101",
          "Source Twin configuration is missing or resolves outside the repository.",
          "Run sourcetwin init, or restore source-twin/config.yml inside the repository.",
        ),
      ],
    };
  }
  let source: string;
  try {
    source = await readFile(configPath, "utf8");
  } catch {
    return {
      diagnostics: [
        configDiagnostic(
          "ST101",
          "Source Twin configuration is missing.",
          "Run sourcetwin init, or restore source-twin/config.yml.",
        ),
      ],
    };
  }

  const lineCounter = new LineCounter();
  const document = parseDocument(source, { lineCounter, prettyErrors: false, uniqueKeys: true });
  if (document.errors.length > 0) {
    return {
      diagnostics: document.errors.map((error) =>
        configDiagnostic(
          "ST102",
          error.message,
          "Correct the YAML syntax and run the command again.",
          error.linePos?.[0]?.line ?? lineCounter.linePos(error.pos[0]).line,
        ),
      ),
    };
  }

  const value = document.toJS() as unknown;
  if (
    typeof value === "object" &&
    value !== null &&
    "schema" in value &&
    (value as { readonly schema?: unknown }).schema !== 1
  ) {
    const actual = String((value as { readonly schema?: unknown }).schema);
    return {
      diagnostics: [
        configDiagnostic(
          "ST103",
          `Source Twin ${PACKAGE_VERSION} cannot read schema ${actual}; supported schemas: ${SUPPORTED_SCHEMAS.join(", ")}.`,
          "Upgrade Source Twin or use a supported, reviewable repository schema.",
        ),
      ],
    };
  }

  const parsed = configSchema.safeParse(value);
  if (!parsed.success) {
    return {
      diagnostics: parsed.error.issues.map((issue) =>
        configDiagnostic(
          "ST104",
          `${issue.path.join(".") || "config"}: ${issue.message}`,
          "Use only the fields and values documented by sourcetwin help config.",
        ),
      ),
    };
  }

  return { config: parsed.data, diagnostics: [] };
}
