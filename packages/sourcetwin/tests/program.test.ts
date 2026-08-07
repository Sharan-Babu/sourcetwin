import { describe, expect, it } from "vitest";
import { createProgram } from "../src/cli/program.js";

describe("CLI program", () => {
  it("exposes stable identity and useful root help", () => {
    const program = createProgram();

    expect(program.name()).toBe("sourcetwin");
    expect(program.version()).toBe("0.1.0");
    expect(program.helpInformation()).toContain(
      "Maintain a version-controlled, plain-language semantic twin",
    );
  });
});
