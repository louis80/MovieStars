import { useEffect, useRef } from "react";

/**
 * Keyboard shortcuts for the current screen (spec: Keyboard on desktop).
 * Keys are matched on `event.key`, case-insensitive. Ignored while typing in a field.
 */
export function useKeys(bindings: Record<string, () => void>, enabled = true): void {
  const ref = useRef(bindings);
  useEffect(() => {
    ref.current = bindings;
  });

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea")) return;
      const key = e.key === " " ? "Space" : e.key.length === 1 ? e.key.toLowerCase() : e.key;
      const action = ref.current[key];
      if (!action) return;
      // Enter on a focused button already clicks it.
      if (key === "Enter" && target?.closest("button, a")) return;
      e.preventDefault();
      action();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled]);
}
