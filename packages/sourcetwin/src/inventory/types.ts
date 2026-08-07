export interface InventoryEntity {
  readonly path: string;
  readonly kind: string;
  readonly locator: string;
  readonly line: number;
  readonly offset?: number;
}

export interface UnsupportedArea {
  readonly path: string;
  readonly kind: string;
  readonly reason: "unsupported-language" | "unsupported-kind" | "parse-error";
}

export interface InventoryScan {
  readonly entities: readonly InventoryEntity[];
  readonly unsupportedAreas: readonly UnsupportedArea[];
  readonly parseErrorPaths: readonly string[];
  readonly diagnostics: readonly InventoryDiagnostic[];
}

export interface CustomInventoryRule {
  readonly id: string;
  readonly path: string;
  readonly language: string;
  readonly kind: string;
  readonly locatorTemplate: string;
}

export interface InventoryDiagnostic {
  readonly path: string;
  readonly kind?: string;
  readonly locator?: string;
  readonly reason: "ambiguous-locator" | "invalid-locator" | "provider-error";
  readonly message: string;
}

export interface InventoryProviderInput {
  readonly repositoryRoot: string;
  readonly paths: readonly string[];
  readonly kinds: readonly string[];
  readonly rules: readonly CustomInventoryRule[];
  readonly astGrepConfig?: string;
}

export interface InventoryProvider {
  readonly id: string;
  scan(input: InventoryProviderInput): Promise<InventoryScan>;
}
