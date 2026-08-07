import { expectTypeOf, test } from "vitest";
import type { CommandResult } from "../src/core/result.js";

interface OrdinaryPayload {
  readonly count: number;
  readonly names: readonly string[];
}

test("ordinary interfaces are valid structured payloads", () => {
  const result: CommandResult<OrdinaryPayload> = {
    command: "check",
    ok: true,
    summary: "Done.",
    diagnostics: [],
    data: { count: 2, names: ["one", "two"] },
  };

  expectTypeOf(result.data).toEqualTypeOf<OrdinaryPayload>();
});

test("known lossy objects are rejected by the payload type", () => {
  type MapData = CommandResult<Map<string, string>>["data"];
  type DateData = CommandResult<Date>["data"];
  type FunctionData = CommandResult<() => void>["data"];

  expectTypeOf<MapData>().toEqualTypeOf<never>();
  expectTypeOf<DateData>().toEqualTypeOf<never>();
  expectTypeOf<FunctionData>().toEqualTypeOf<never>();
});
