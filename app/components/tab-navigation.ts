import type { KeyboardEvent } from "react";

const navigationKeys = new Set(["ArrowLeft", "ArrowRight", "Home", "End"]);

type TabNavigationOptions = {
  currentIndex: number;
  event: KeyboardEvent<HTMLButtonElement>;
  ids: readonly string[];
  onSelect: (id: string) => void;
  tabId: (id: string) => string;
};

export function navigateTabs({ currentIndex, event, ids, onSelect, tabId }: TabNavigationOptions) {
  if (!navigationKeys.has(event.key)) return;

  event.preventDefault();

  let nextIndex = currentIndex;
  if (event.key === "Home") nextIndex = 0;
  if (event.key === "End") nextIndex = ids.length - 1;
  if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % ids.length;
  if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + ids.length) % ids.length;

  const nextId = ids[nextIndex];
  onSelect(nextId);
  document.getElementById(tabId(nextId))?.focus();
}
