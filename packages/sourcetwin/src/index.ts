export type {
  CommandResult,
  Diagnostic,
  JsonCompatible,
  JsonPrimitive,
  JsonValue,
  Severity,
  SourceLocation,
} from "./core/result.js";
export { exitCodeFor } from "./core/result.js";
export { renderResult, type RenderOptions } from "./output/render.js";
