import type { CommandResult, Diagnostic } from "../core/result.js";
import { exitCodeFor } from "../core/result.js";
import { renderResult } from "../output/render.js";
import { findRepositoryRoot } from "../repository/root.js";

export interface CliRuntime {
  readonly cwd: () => string;
  readonly writeError: (value: string) => void;
  readonly writeOutput: (value: string) => void;
  readonly setExitCode: (value: number) => void;
}

export interface CommandOptions {
  readonly json: boolean;
  readonly root?: string;
}

function errorResult(command: string, diagnostic: Diagnostic): CommandResult<null> {
  return {
    command,
    ok: false,
    summary: `${command} could not run.`,
    details: [],
    diagnostics: [diagnostic],
    data: null,
  };
}

export async function executeCommand<T>(
  command: string,
  options: CommandOptions,
  runtime: CliRuntime,
  run: (repositoryRoot: string) => Promise<CommandResult<T>>,
): Promise<void> {
  const repository = await findRepositoryRoot(options.root, runtime.cwd());
  let result: CommandResult<T> | CommandResult<null>;
  if (!repository.ok) {
    result = errorResult(command, repository.diagnostic);
  } else {
    try {
      result = await run(repository.root);
    } catch (error) {
      result = errorResult(command, {
        code: "ST500",
        severity: "error",
        message: error instanceof Error ? error.message : "An unexpected error occurred.",
        suggestion: "Retry the command. If it still fails, report this diagnostic.",
      });
    }
  }

  const rendered = renderResult(result, { json: options.json });
  if (result.ok) runtime.writeOutput(rendered);
  else runtime.writeError(rendered);
  runtime.setExitCode(exitCodeFor(result));
}
