import { describe, expect, it } from "vitest";
import type { CommandResult } from "../src/core/result.js";
import { exitCodeFor } from "../src/core/result.js";
import { renderResult } from "../src/output/render.js";

interface CheckData {
  readonly checked: number;
}

const success: CommandResult<CheckData> = {
  command: "check",
  ok: true,
  summary: "Checked 3 files.",
  details: [],
  diagnostics: [],
  data: { checked: 3 },
};

describe("command result output", () => {
  it("renders concise text with a trailing newline", () => {
    expect(renderResult(success, { json: false })).toBe("Checked 3 files.\n");
    expect(exitCodeFor(success)).toBe(0);
  });

  it("renders structured JSON without losing command facts", () => {
    const rendered = renderResult(success, { json: true });

    expect(rendered.endsWith("\n")).toBe(true);
    expect(JSON.parse(rendered)).toEqual(success);
  });

  it.each([NaN, Infinity, -Infinity, -0])(
    "rejects the non-JSON number %s",
    (invalidNumber) => {
      const invalid = {
        ...success,
        data: { checked: invalidNumber },
      };

      expect(() => renderResult(invalid, { json: true })).toThrow(
        "cannot contain a lossy number",
      );
    },
  );

  it.each([
    ["undefined", undefined],
    ["bigint", 1n],
    ["function", () => undefined],
    ["symbol", Symbol("value")],
  ])("rejects the unsupported runtime value %s", (kind, value) => {
    const invalid = { ...success, data: { value } } as unknown as CommandResult<CheckData>;

    expect(() => renderResult(invalid, { json: true })).toThrow(
      `cannot contain ${kind}`,
    );
  });

  it.each([new Map(), new Set(), new Date()])(
    "rejects the lossy object %s",
    (lossyObject) => {
      const invalid = {
        ...success,
        data: lossyObject,
      } as unknown as CommandResult<CheckData>;

      expect(() => renderResult(invalid, { json: true })).toThrow(
        "can contain only arrays and plain objects",
      );
    },
  );

  it("rejects circular data", () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    const invalid = { ...success, data: circular } as unknown as CommandResult<CheckData>;

    expect(() => renderResult(invalid, { json: true })).toThrow(
      "cannot contain a circular reference",
    );
  });

  it("rejects properties JSON would omit or execute", () => {
    const withSymbol = { [Symbol("hidden")]: "value" };
    const withGetter = Object.defineProperty({}, "value", {
      enumerable: true,
      get: () => "value",
    });

    expect(() =>
      renderResult({ ...success, data: withSymbol } as unknown as CommandResult<CheckData>, {
        json: true,
      }),
    ).toThrow("cannot contain symbol keys");
    expect(() =>
      renderResult({ ...success, data: withGetter } as unknown as CommandResult<CheckData>, {
        json: true,
      }),
    ).toThrow("can contain only enumerable data properties");
  });

  it("rejects lossy array shapes", () => {
    const named = Object.assign([], { note: "lost" });
    const sparse = new Array<unknown>(1);

    expect(() =>
      renderResult({ ...success, data: named } as unknown as CommandResult<CheckData>, {
        json: true,
      }),
    ).toThrow("arrays cannot contain named properties");
    expect(() =>
      renderResult({ ...success, data: sparse } as unknown as CommandResult<CheckData>, {
        json: true,
      }),
    ).toThrow("cannot contain sparse arrays");
  });

  it("rejects array subclasses that can change their JSON representation", () => {
    class RewritingArray extends Array<string> {
      toJSON(): string {
        return "rewritten";
      }
    }

    const invalid = new RewritingArray("kept");
    expect(() =>
      renderResult({ ...success, data: invalid } as unknown as CommandResult<CheckData>, {
        json: true,
      }),
    ).toThrow("cannot contain array subclasses");
  });

  it("accepts a plain object without a prototype", () => {
    const data = Object.assign(Object.create(null) as object, { checked: 3 });
    const rendered = renderResult(
      { ...success, data } as unknown as CommandResult<CheckData>,
      { json: true },
    );

    expect(JSON.parse(rendered)).toEqual(success);
  });

  it("renders actionable diagnostics with precise and path-only locations", () => {
    const failure: CommandResult<Record<string, never>> = {
      command: "check",
      ok: false,
      summary: "Source Twin has 2 errors.",
      details: [],
      diagnostics: [
        {
          code: "ST101",
          severity: "error",
          message: "The locator does not exist.",
          location: { path: "source-twin/billing.md", line: 4, column: 9 },
          suggestion: "Update the locator or restore the source symbol.",
          help: "sourcetwin help logic",
        },
        {
          code: "ST102",
          severity: "warning",
          message: "Test coverage is unknown.",
          location: { path: "source-twin/billing.md" },
        },
      ],
      data: {},
    };

    expect(renderResult(failure, { json: false })).toBe(
      [
        "Source Twin has 2 errors.",
        "source-twin/billing.md:4:9: error ST101: The locator does not exist.",
        "  Fix: Update the locator or restore the source symbol.",
        "  Help: sourcetwin help logic",
        "source-twin/billing.md: warning ST102: Test coverage is unknown.",
        "",
      ].join("\n"),
    );
    expect(exitCodeFor(failure)).toBe(1);
  });

  it("renders diagnostics without a source location", () => {
    const result: CommandResult<null> = {
      command: "check",
      ok: true,
      summary: "Checked configuration.",
      details: [],
      diagnostics: [
        {
          code: "ST001",
          severity: "info",
          message: "Coverage is not configured.",
        },
      ],
      data: null,
    };

    expect(renderResult(result, { json: false })).toContain(
      "info ST001: Coverage is not configured.",
    );
  });

  it("renders unsafe diagnostic characters visibly instead of controlling the terminal", () => {
    const result: CommandResult<null> = {
      command: "check",
      ok: true,
      summary: "Reviewed Git changes.",
      details: [],
      diagnostics: [{
        code: "ST603",
        severity: "warning",
        location: { path: "src/first\n\u001b[31mforged\u061c.ts" },
        message: "Mapped path\rchanged\u200e\u200f\u202e.",
        suggestion: "Review\ttogether.",
      }],
      data: null,
    };

    const rendered = renderResult(result, { json: false });
    expect(rendered).toContain("src/first\\n\\u001b[31mforged\\u061c.ts");
    expect(rendered).toContain("Mapped path\\rchanged\\u200e\\u200f\\u202e.");
    expect(rendered).toContain("Review\\ttogether.");
    expect(rendered).not.toContain("\u001b");
  });
});
