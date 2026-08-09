import assert from "node:assert/strict";
import test from "node:test";
import { navigateTabs } from "../app/components/tab-navigation.ts";

const ids = ["first", "second", "third"];

function exercise(key, currentIndex) {
  let prevented = false;
  let selected;
  let focused;

  const previousDocument = globalThis.document;
  globalThis.document = {
    getElementById(id) {
      return { focus: () => { focused = id; } };
    },
  };

  try {
    navigateTabs({
      currentIndex,
      event: { key, preventDefault: () => { prevented = true; } },
      ids,
      onSelect: (id) => { selected = id; },
      tabId: (id) => `tab-${id}`,
    });
  } finally {
    globalThis.document = previousDocument;
  }

  return { focused, prevented, selected };
}

test("tab navigation moves, wraps, and focuses the selected tab", () => {
  assert.deepEqual(exercise("ArrowRight", 0), {
    focused: "tab-second",
    prevented: true,
    selected: "second",
  });
  assert.equal(exercise("ArrowRight", 2).selected, "first");
  assert.equal(exercise("ArrowLeft", 0).selected, "third");
});

test("tab navigation supports Home and End without handling unrelated keys", () => {
  assert.equal(exercise("Home", 1).selected, "first");
  assert.equal(exercise("End", 1).selected, "third");
  assert.deepEqual(exercise("Enter", 1), {
    focused: undefined,
    prevented: false,
    selected: undefined,
  });
});
