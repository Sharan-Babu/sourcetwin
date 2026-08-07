import type { CommandResult } from "../core/result.js";

function assertJsonValue(value: unknown, ancestors = new Set<object>()): void {
  if (value === null || typeof value === "string" || typeof value === "boolean") return;

  if (typeof value === "number" && (!Number.isFinite(value) || Object.is(value, -0))) {
    throw new TypeError("Source Twin output cannot contain a lossy number.");
  }

  if (typeof value === "number") return;

  if (
    value === undefined ||
    typeof value === "bigint" ||
    typeof value === "function" ||
    typeof value === "symbol"
  ) {
    throw new TypeError(`Source Twin output cannot contain ${typeof value}.`);
  }

  if (ancestors.has(value)) {
    throw new TypeError("Source Twin output cannot contain a circular reference.");
  }

  const isArray = Array.isArray(value);
  const prototype = Object.getPrototypeOf(value) as unknown;
  if (isArray && prototype !== Array.prototype) {
    throw new TypeError("Source Twin output cannot contain array subclasses.");
  }
  if (!isArray && prototype !== Object.prototype && prototype !== null) {
    throw new TypeError("Source Twin output can contain only arrays and plain objects.");
  }

  ancestors.add(value);
  let arrayItemCount = 0;
  for (const key of Reflect.ownKeys(value)) {
    if (isArray && key === "length") continue;
    if (typeof key === "symbol") {
      throw new TypeError("Source Twin output cannot contain symbol keys.");
    }
    if (isArray && !/^(0|[1-9]\d*)$/.test(key)) {
      throw new TypeError("Source Twin output arrays cannot contain named properties.");
    }

    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor?.enumerable || !("value" in descriptor)) {
      throw new TypeError("Source Twin output can contain only enumerable data properties.");
    }
    if (isArray) arrayItemCount += 1;
    assertJsonValue(descriptor.value, ancestors);
  }
  if (isArray && arrayItemCount !== value.length) {
    throw new TypeError("Source Twin output cannot contain sparse arrays.");
  }
  ancestors.delete(value);
}

export function renderJson<T>(result: CommandResult<T>): string {
  assertJsonValue(result);
  return `${JSON.stringify(result, undefined, 2)}\n`;
}
