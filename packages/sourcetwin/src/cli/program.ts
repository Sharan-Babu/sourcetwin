import { Command } from "commander";
import packageJson from "../../package.json" with { type: "json" };

export function createProgram(): Command {
  return new Command()
    .name("sourcetwin")
    .description(
      "Maintain a version-controlled, plain-language semantic twin of a codebase.",
    )
    .version(packageJson.version)
    .showHelpAfterError();
}
