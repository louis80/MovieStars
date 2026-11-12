import { useCallback, useEffect, useState, type DependencyList } from "react";

export type AsyncState<T> =
  { status: "loading" } | { status: "ready"; value: T } | { status: "error"; error: unknown };

/** Run an async loader when the deps change; `reload` runs it again. */
export function useAsync<T>(
  load: () => Promise<T>,
  deps: DependencyList,
): [AsyncState<T>, () => void] {
  const [state, setState] = useState<AsyncState<T>>({ status: "loading" });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    load().then(
      (value) => !cancelled && setState({ status: "ready", value }),
      (error: unknown) => !cancelled && setState({ status: "error", error }),
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return [state, reload];
}
