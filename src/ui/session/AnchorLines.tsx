import { useSessionContext } from "./SessionContext";
import type { Person } from "../../learning/types";
import { seenFilmWith } from "../../learning/cards";
import { Icon } from "../Icon";
import { filmLabel } from "./labels";

/**
 * The memory anchor (spec AC3): a film you've seen with this person when there is one,
 * and their best-known role or film.
 */
export function AnchorLines({ person }: { person: Person }) {
  const { films, seenFilmIds } = useSessionContext();
  const seen = seenFilmWith(person, { films, seenFilmIds });
  const best = person.knownFor.find((f) => f.id !== seen?.id) ?? (seen ? null : person.knownFor[0]);

  if (!seen && !best) return null;
  return (
    <section className="anchor" aria-label="Remember them by">
      {seen && (
        <div className="anchor-line">
          <Icon name="film" size={20} />
          <span>
            You saw {person.gender === "male" ? "him" : person.gender === "female" ? "her" : "them"}{" "}
            in <strong>{filmLabel(seen)}</strong>
          </span>
        </div>
      )}
      {best && (
        <div className="anchor-line">
          <Icon name="star" size={20} />
          <span>
            {person.role === "director" ? (
              <>
                Directed <strong>{filmLabel(best)}</strong>
              </>
            ) : best.character ? (
              <>
                Best known as {best.character} in <strong>{filmLabel(best)}</strong>
              </>
            ) : (
              <>
                Best known for <strong>{filmLabel(best)}</strong>
              </>
            )}
          </span>
        </div>
      )}
    </section>
  );
}
