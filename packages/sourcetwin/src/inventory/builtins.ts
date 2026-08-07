interface BuiltinRule {
  readonly id: string;
  readonly language: string;
  readonly kind: "function" | "test" | "parse-error";
  readonly locatorTemplate: string;
  readonly qualifier?: "outline-owner" | undefined;
  readonly rule: Readonly<Record<string, unknown>>;
  readonly constraints?: Readonly<Record<string, unknown>>;
}
const JS_TEST_PATTERNS = [
  "test($NAME, $$$ARGS)",
  "test.only($NAME, $$$ARGS)",
  "test.skip($NAME, $$$ARGS)",
  "test.todo($NAME, $$$ARGS)",
  "test.concurrent($NAME, $$$ARGS)",
  "test.fails($NAME, $$$ARGS)",
  "test.fixme($NAME, $$$ARGS)",
  "test.each($$$DATA)($NAME, $$$ARGS)",
  "it($NAME, $$$ARGS)",
  "it.only($NAME, $$$ARGS)",
  "it.skip($NAME, $$$ARGS)",
  "it.todo($NAME, $$$ARGS)",
  "it.concurrent($NAME, $$$ARGS)",
  "it.fails($NAME, $$$ARGS)",
  "it.fixme($NAME, $$$ARGS)",
  "it.each($$$DATA)($NAME, $$$ARGS)",
  "Deno.test($NAME, $$$ARGS)",
];

function jsTestRule(language: string): BuiltinRule {
  return {
    id: `sourcetwin-${language.toLowerCase()}-test`,
    language,
    kind: "test",
    locatorTemplate: "$NAME",
    rule: { any: JS_TEST_PATTERNS.map((pattern) => ({ pattern })) },
  };
}

const CALLABLE_VALUE = { any: [{ kind: "arrow_function" }, { kind: "function_expression" }] };

function jsValueFunctionRule(language: string, fieldKind: string): BuiltinRule {
  return {
    id: `sourcetwin-${language.toLowerCase()}-function-value`,
    language,
    kind: "function",
    locatorTemplate: "$NAME",
    qualifier: "outline-owner",
    rule: {
      any: [
        { pattern: { context: "class A { $NAME = $VALUE }", selector: fieldKind } },
        { pattern: { context: "class A { static $NAME = $VALUE }", selector: fieldKind } },
        { pattern: { context: "({ $NAME: $VALUE })", selector: "pair" } },
      ],
    },
    constraints: { VALUE: CALLABLE_VALUE },
  };
}

function jsObjectMethodRule(language: string): BuiltinRule {
  const insideObject = { inside: { kind: "object", stopBy: "end" } };
  return {
    id: `sourcetwin-${language.toLowerCase()}-function-object-method`,
    language,
    kind: "function",
    locatorTemplate: "$NAME",
    qualifier: "outline-owner",
    rule: {
      any: [
        {
          all: [
            { pattern: {
              context: "({ $NAME($$$PARAMS) { $$$BODY } })",
              selector: "method_definition",
            } },
            insideObject,
          ],
        },
        {
          all: [
            { pattern: {
              context: "({ async $NAME($$$PARAMS) { $$$BODY } })",
              selector: "method_definition",
            } },
            insideObject,
          ],
        },
      ],
    },
  };
}

function jsTopFunctionRule(language: string): BuiltinRule {
  return {
    id: `sourcetwin-${language.toLowerCase()}-function-variable`,
    language,
    kind: "function",
    locatorTemplate: "$NAME",
    rule: {
      any: ["const", "let", "var"].map((keyword) => ({
        pattern: {
          context: `${keyword} $NAME = $VALUE`,
          selector: "variable_declarator",
        },
      })),
    },
    constraints: {
      VALUE: CALLABLE_VALUE,
    },
  };
}

const FUNCTION_RULES: readonly BuiltinRule[] = [
  jsValueFunctionRule("JavaScript", "field_definition"),
  jsObjectMethodRule("JavaScript"), jsTopFunctionRule("JavaScript"),
  jsValueFunctionRule("TypeScript", "public_field_definition"),
  jsObjectMethodRule("TypeScript"), jsTopFunctionRule("TypeScript"),
  jsValueFunctionRule("Tsx", "public_field_definition"),
  jsObjectMethodRule("Tsx"), jsTopFunctionRule("Tsx"),
];

const TEST_RULES: readonly BuiltinRule[] = [
  jsTestRule("JavaScript"),
  jsTestRule("TypeScript"),
  jsTestRule("Tsx"),
  {
    id: "sourcetwin-python-test",
    language: "Python",
    kind: "test",
    locatorTemplate: "$NAME",
    rule: { pattern: "def $NAME($$$PARAMS): $$$BODY" },
    constraints: { NAME: { regex: "^test_" } },
  },
  {
    id: "sourcetwin-python-async-test",
    language: "Python",
    kind: "test",
    locatorTemplate: "$NAME",
    rule: { pattern: "async def $NAME($$$PARAMS): $$$BODY" },
    constraints: { NAME: { regex: "^test_" } },
  },
  {
    id: "sourcetwin-go-test",
    language: "Go",
    kind: "test",
    locatorTemplate: "$NAME",
    rule: { pattern: "func $NAME($$$PARAMS) { $$$BODY }" },
    constraints: { NAME: { regex: "^Test" } },
  },
];

const PARSE_LANGUAGES = ["JavaScript", "TypeScript", "Tsx", "Python", "Go", "Rust", "Java"];
const PARSE_RULES: readonly BuiltinRule[] = PARSE_LANGUAGES.map((language) => ({
  id: `sourcetwin-${language.toLowerCase()}-parse-error`,
  language,
  kind: "parse-error",
  locatorTemplate: "parse-error",
  rule: { kind: "ERROR" },
}));

function yamlValue(value: unknown, indentation = 0): string {
  const spaces = " ".repeat(indentation);
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return value.map((item) => `${spaces}- ${yamlValue(item, indentation + 2).trimStart()}`).join("\n");
  }
  const entries = Object.entries(value as Readonly<Record<string, unknown>>);
  return entries.map(([key, item]) => {
    if (typeof item === "object" && item !== null) {
      return `${spaces}${key}:\n${yamlValue(item, indentation + 2)}`;
    }
    return `${spaces}${key}: ${yamlValue(item)}`;
  }).join("\n");
}

export function builtinRuleDocuments(kinds: ReadonlySet<string>): string {
  const rules = [
    ...PARSE_RULES,
    ...(kinds.has("function") ? FUNCTION_RULES : []),
    ...(kinds.has("test") ? TEST_RULES : []),
  ];
  return rules.map((rule) => yamlValue({
    id: rule.id,
    language: rule.language,
    rule: rule.rule,
    ...(rule.constraints ? { constraints: rule.constraints } : {}),
    metadata: {
      sourceTwinKind: rule.kind,
      sourceTwinLocator: rule.locatorTemplate,
      ...(rule.qualifier ? { sourceTwinQualifier: rule.qualifier } : {}),
    },
  })).join("\n---\n");
}
