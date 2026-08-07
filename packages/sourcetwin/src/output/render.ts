import type { CommandResult } from "../core/result.js";
import { renderJson } from "./json.js";
import { renderText } from "./text.js";

export interface RenderOptions {
  readonly json: boolean;
}

export function renderResult<T>(
  result: CommandResult<T>,
  options: RenderOptions,
): string {
  return options.json ? renderJson(result) : renderText(result);
}
