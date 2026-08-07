export type Severity = "error" | "warning" | "info";

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue =
  | JsonPrimitive
  | { readonly [key: string]: JsonValue }
  | readonly JsonValue[];

type NonJsonObject =
  | ArrayBuffer
  | ArrayBufferView
  | Date
  | Error
  | Promise<unknown>
  | ReadonlyMap<unknown, unknown>
  | ReadonlySet<unknown>
  | RegExp
  | WeakMap<object, unknown>
  | WeakSet<object>;

export type JsonCompatible<T> = T extends JsonPrimitive
  ? T
  : T extends (...arguments_: never[]) => unknown
    ? never
    : T extends NonJsonObject
      ? never
      : T extends readonly (infer Item)[]
        ? readonly JsonCompatible<Item>[]
        : T extends object
          ? { readonly [Key in keyof T]: JsonCompatible<T[Key]> }
          : never;

export type SourceLocation =
  | {
      readonly path: string;
      readonly line?: never;
      readonly column?: never;
    }
  | {
      readonly path: string;
      readonly line: number;
      readonly column?: number;
    };

export interface Diagnostic {
  readonly code: string;
  readonly severity: Severity;
  readonly message: string;
  readonly location?: SourceLocation;
  readonly suggestion?: string;
  readonly help?: string;
}

export interface CommandResult<T = JsonValue> {
  readonly command: string;
  readonly ok: boolean;
  readonly summary: string;
  readonly details: readonly string[];
  readonly diagnostics: readonly Diagnostic[];
  readonly data: JsonCompatible<T>;
}

export function exitCodeFor<T>(result: CommandResult<T>): 0 | 1 {
  return result.ok ? 0 : 1;
}
