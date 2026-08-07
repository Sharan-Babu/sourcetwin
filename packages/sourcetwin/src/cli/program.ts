import { Command } from "commander";
import { runCheck } from "../commands/check.js";
import { runCoverage } from "../commands/coverage.js";
import { runInit } from "../commands/init.js";
import type { CommandResult } from "../core/result.js";
import { PACKAGE_VERSION } from "../core/version.js";
import { getHelpTopic, HELP_TOPICS } from "../help/topics.js";
import { renderResult } from "../output/render.js";
import { executeCommand, type CliRuntime, type CommandOptions } from "./execute.js";

function setProcessExitCode(value: number): void {
  process.exitCode = value;
}

const DEFAULT_RUNTIME: CliRuntime = {
  cwd: process.cwd,
  writeError: process.stderr.write.bind(process.stderr),
  writeOutput: process.stdout.write.bind(process.stdout),
  setExitCode: setProcessExitCode,
};

function options(command: Command): CommandOptions {
  const values = command.optsWithGlobals<{ json?: boolean; root?: string }>();
  return {
    json: values.json ?? false,
    ...(values.root ? { root: values.root } : {}),
  };
}

interface HelpData {
  readonly topic: string | null;
  readonly available: readonly string[];
  readonly content: string;
}

function helpResult(program: Command, topic: string | undefined): CommandResult<HelpData> {
  const content = topic ? getHelpTopic(topic) : program.helpInformation();
  if (content) {
    return {
      command: "help",
      ok: true,
      summary: "Source Twin help.",
      details: [content.trimEnd()],
      diagnostics: [],
      data: { topic: topic ?? null, available: HELP_TOPICS, content },
    };
  }
  return {
    command: "help",
    ok: false,
    summary: `Unknown help topic: ${topic ?? ""}`,
    details: [`Available topics: ${HELP_TOPICS.join(", ")}`],
    diagnostics: [{
      code: "ST003",
      severity: "error",
      message: `Unknown help topic: ${topic ?? ""}`,
      suggestion: `Choose one of: ${HELP_TOPICS.join(", ")}.`,
    }],
    data: { topic: topic ?? null, available: HELP_TOPICS, content: "" },
  };
}

export function createProgram(runtime: CliRuntime = DEFAULT_RUNTIME): Command {
  const program = new Command()
    .name("sourcetwin")
    .description(
      "Maintain a version-controlled, plain-language semantic twin of a codebase.",
    )
    .version(PACKAGE_VERSION)
    .option("--root <path>", "run against the Git repository containing this path")
    .option("--json", "write equivalent structured output")
    .showHelpAfterError()
    .configureHelp({ showGlobalOptions: true })
    .addHelpCommand(false);

  const init = program
    .command("init")
    .description("create the minimal Source Twin foundation");
  init.action(async () => {
    await executeCommand("init", options(init), runtime, runInit);
  });

  const check = program
    .command("check")
    .description("validate Source Twin configuration and authored files")
    .option("--base <git-ref>", "also review changes against a branch, tag, or commit");
  check.action(async () => {
    const { base } = check.opts<{ base?: string }>();
    await executeCommand(
      "check",
      options(check),
      runtime,
      (repositoryRoot) => runCheck(repositoryRoot, base !== undefined ? { base } : {}),
    );
  });

  const coverage = program
    .command("coverage")
    .description("measure declared code and test scope");
  coverage.action(async () => {
    await executeCommand("coverage", options(coverage), runtime, runCoverage);
  });

  const help = program
    .command("help [topic]")
    .description(`show offline reference material (${HELP_TOPICS.join(", ")})`);
  help.action((topic: string | undefined) => {
      const result = helpResult(program, topic);
      const rendered = renderResult(result, { json: options(help).json });
      if (result.ok) runtime.writeOutput(rendered);
      else runtime.writeError(rendered);
      runtime.setExitCode(result.ok ? 0 : 1);
    });

  return program;
}
