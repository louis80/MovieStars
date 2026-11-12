import { createContext, useContext } from "react";
import type { Film } from "../../learning/types";

export interface SessionContextValue {
  films: Film[];
  seenFilmIds: ReadonlySet<number>;
}

export const SessionContext = createContext<SessionContextValue>({
  films: [],
  seenFilmIds: new Set(),
});

export function useSessionContext(): SessionContextValue {
  return useContext(SessionContext);
}
