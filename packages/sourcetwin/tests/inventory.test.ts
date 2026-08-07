import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { scanInventory } from "../src/inventory/scan.js";
import type { InventoryProvider } from "../src/inventory/types.js";
import { createTestRepository, type TestRepository } from "./helpers/repository.js";

let repository: TestRepository;

beforeEach(async () => {
  repository = await createTestRepository();
});

afterEach(async () => {
  await repository.cleanup();
});

describe("ast-grep structural inventory", () => {
  it("extracts proven functions, methods, and tests across supported languages", async () => {
    await Promise.all([
      repository.write(
        "src/service.ts",
        `export function start() {}
export const stop = () => {};
export let change = () => {};
const text = "=>";
class Service {
  run() {}
  handler = () => {};
  static make = function () {};
  value = compute(() => 1);
}
const helpers = { save: () => {}, clean() {}, data: compute(() => 1) };
test("starts the service", () => {});
it.each([[1]])("handles %s", () => {});
Deno.test("runs in Deno", () => {});
test(dynamicName, () => {});
test.describe("service suite", () => {});
`,
      ),
      repository.write(
        "src/service.py",
        `class Service:
    def run(self):
        pass

def start():
    pass

def test_starts_service():
    pass
`,
      ),
      repository.write(
        "src/service.go",
        `package service
type Service struct{}
func (s Service) Run() {}
func Start() {}
func TestStartsService(t *testing.T) {}
`,
      ),
      repository.write(
        "src/service.rs",
        `struct Service;
impl Service { fn run(&self) {} }
fn start() {}
`,
      ),
      repository.write(
        "src/Service.java",
        "class Service { void run() {} static void start() {} }\n",
      ),
    ]);

    const result = await scanInventory(
      repository.root,
      ["src/Service.java", "src/service.go", "src/service.py", "src/service.rs", "src/service.ts"],
      ["function", "test"],
      [],
    );

    expect(result.diagnostics).toEqual([]);
    expect(result.entities).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: "src/service.ts", kind: "function", locator: "start" }),
      expect.objectContaining({ path: "src/service.ts", kind: "function", locator: "stop" }),
      expect.objectContaining({ path: "src/service.ts", kind: "function", locator: "change" }),
      expect.objectContaining({ path: "src/service.ts", kind: "function", locator: "Service.run" }),
      expect.objectContaining({ path: "src/service.ts", kind: "function", locator: "Service.handler" }),
      expect.objectContaining({ path: "src/service.ts", kind: "function", locator: "Service.make" }),
      expect.objectContaining({ path: "src/service.ts", kind: "function", locator: "helpers.save" }),
      expect.objectContaining({ path: "src/service.ts", kind: "function", locator: "helpers.clean" }),
      expect.objectContaining({ path: "src/service.ts", kind: "test", locator: "starts the service" }),
      expect.objectContaining({ path: "src/service.ts", kind: "test", locator: "handles %s" }),
      expect.objectContaining({ path: "src/service.ts", kind: "test", locator: "runs in Deno" }),
      expect.objectContaining({ path: "src/service.py", kind: "function", locator: "Service.run" }),
      expect.objectContaining({ path: "src/service.py", kind: "function", locator: "start" }),
      expect.objectContaining({ path: "src/service.py", kind: "test", locator: "test_starts_service" }),
      expect.objectContaining({ path: "src/service.go", kind: "function", locator: "Service.Run" }),
      expect.objectContaining({ path: "src/service.go", kind: "function", locator: "Start" }),
      expect.objectContaining({ path: "src/service.go", kind: "test", locator: "TestStartsService" }),
      expect.objectContaining({ path: "src/service.rs", kind: "function", locator: "Service.run" }),
      expect.objectContaining({ path: "src/service.rs", kind: "function", locator: "start" }),
      expect.objectContaining({ path: "src/Service.java", kind: "function", locator: "Service.run" }),
      expect.objectContaining({ path: "src/Service.java", kind: "function", locator: "Service.start" }),
    ]));
    expect(result.entities).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: "function", locator: "text" }),
      expect.objectContaining({ kind: "function", locator: "helpers" }),
      expect.objectContaining({ kind: "function", locator: "Service.value" }),
      expect.objectContaining({ kind: "function", locator: "helpers.data" }),
      expect.objectContaining({ kind: "test", locator: "dynamicName" }),
      expect.objectContaining({ kind: "test", locator: "service suite" }),
    ]));
    expect(result.entities.filter(({ path, kind, locator }) =>
      path === "src/service.ts" && kind === "function" && locator === "change"))
      .toHaveLength(1);
    expect(result.unsupportedAreas).toEqual(expect.arrayContaining([
      { path: "src/Service.java", kind: "test", reason: "unsupported-kind" },
      { path: "src/service.rs", kind: "test", reason: "unsupported-kind" },
    ]));
  });

  it("reports parser errors, unsupported languages, and unsupported entity kinds", async () => {
    await repository.write("src/broken.ts", "export function (");
    await repository.write("src/empty.ts", "");
    await repository.write("src/example.py", "def run():\n    pass\n");
    await repository.write("src/README", "plain text\n");

    const result = await scanInventory(
      repository.root,
      ["src/broken.ts", "src/empty.ts", "src/example.py", "src/README"],
      ["function", "job"],
      [],
    );

    expect(result.parseErrorPaths).toEqual(["src/broken.ts"]);
    expect(result.unsupportedAreas).toEqual(expect.arrayContaining([
      { path: "src/broken.ts", kind: "function", reason: "parse-error" },
      { path: "src/example.py", kind: "job", reason: "unsupported-kind" },
      { path: "src/README", kind: "function", reason: "unsupported-language" },
    ]));
    expect(result.unsupportedAreas).not.toContainEqual(
      { path: "src/empty.ts", kind: "function", reason: "unsupported-language" },
    );
  });

  it("keeps the provider boundary internal and injectable for contract tests", async () => {
    const provider: InventoryProvider = {
      id: "fixture-provider",
      scan: async ({ paths }) => ({
        entities: [{ path: paths[0]!, kind: "function", locator: "task", line: 1 }],
        unsupportedAreas: [],
        parseErrorPaths: [],
        diagnostics: [],
      }),
    };

    const result = await scanInventory(
      repository.root,
      ["src/task.custom"],
      ["function"],
      [],
      undefined,
      provider,
    );
    expect(result.entities).toEqual([
      { path: "src/task.custom", kind: "function", locator: "task", line: 1 },
    ]);
  });

});
