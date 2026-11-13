import { useEffect } from "react";

/** Run an action when Enter is pressed outside a text field (desktop shortcut from the spec). */
export function useEnterKey(action: (() => void) | null): void {
  useEffect(() => {
    if (!action) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (e.key !== "Enter" || target?.closest("input, textarea, button, a")) return;
      e.preventDefault();
      action();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [action]);
}
