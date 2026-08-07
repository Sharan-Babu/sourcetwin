import type {
  CommandResult,
  Diagnostic,
  SourceLocation,
} from "../core/result.js";

const UNSAFE_TERMINAL_CHARACTER = /[\p{Cc}\p{Bidi_Control}]/gu;

function visibleText(value: string): string {
  return value.replace(UNSAFE_TERMINAL_CHARACTER, (character) => {
    if (character === "\n") return "\\n";
    if (character === "\r") return "\\r";
    if (character === "\t") return "\\t";
    return `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`;
  });
}

function formatLocation(location: SourceLocation | undefined): string {
  if (!location) return "";

  const line = location.line === undefined ? "" : `:${location.line}`;
  const column = location.column === undefined ? "" : `:${location.column}`;
  return `${visibleText(location.path)}${line}${column}: `;
}

function formatDiagnostic(diagnostic: Diagnostic): readonly string[] {
  const heading = `${formatLocation(diagnostic.location)}${diagnostic.severity} ${diagnostic.code}: ${visibleText(diagnostic.message)}`;
  const details: string[] = [heading];

  if (diagnostic.suggestion) details.push(`  Fix: ${visibleText(diagnostic.suggestion)}`);
  if (diagnostic.help) details.push(`  Help: ${visibleText(diagnostic.help)}`);

  return details;
}

export function renderText<T>(result: CommandResult<T>): string {
  const lines = [result.summary, ...result.details];

  for (const diagnostic of result.diagnostics) {
    lines.push(...formatDiagnostic(diagnostic));
  }

  return `${lines.join("\n")}\n`;
}
