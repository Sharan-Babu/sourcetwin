import type {
  CommandResult,
  Diagnostic,
  SourceLocation,
} from "../core/result.js";

function formatLocation(location: SourceLocation | undefined): string {
  if (!location) return "";

  const line = location.line === undefined ? "" : `:${location.line}`;
  const column = location.column === undefined ? "" : `:${location.column}`;
  return `${location.path}${line}${column}: `;
}

function formatDiagnostic(diagnostic: Diagnostic): readonly string[] {
  const heading = `${formatLocation(diagnostic.location)}${diagnostic.severity} ${diagnostic.code}: ${diagnostic.message}`;
  const details: string[] = [heading];

  if (diagnostic.suggestion) details.push(`  Fix: ${diagnostic.suggestion}`);
  if (diagnostic.help) details.push(`  Help: ${diagnostic.help}`);

  return details;
}

export function renderText<T>(result: CommandResult<T>): string {
  const lines = [result.summary];

  for (const diagnostic of result.diagnostics) {
    lines.push(...formatDiagnostic(diagnostic));
  }

  return `${lines.join("\n")}\n`;
}
