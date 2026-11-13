import { useMemo, useState } from "react";
import { Link } from "react-router";
import type { MyPerson } from "../../app/learningService";
import { useServices } from "../../app/ServicesContext";
import { normalize } from "../../learning/answer";
import type { Role } from "../../learning/types";
import { BottomNav } from "../BottomNav";
import { Icon } from "../Icon";
import { countryName, personLine } from "../session/labels";
import { useAsync } from "../useAsync";
import { PersonRow } from "./PersonRow";

/** Groups from best known to newest, with plain explanations of each level. */
const GROUPS = [
  { key: "mastered", title: "Mastered", note: "Back every month or so" },
  { key: 4, title: "Connect", note: "Linking them to their films" },
  { key: 3, title: "Recall", note: "Naming them without choices" },
  { key: 2, title: "Distinguish", note: "Telling them from look-alikes" },
  { key: 1, title: "Recognise", note: "Picking the name from four" },
] as const;

type RoleFilter = "all" | Role;

export function MyPeopleScreen() {
  const { learning } = useServices();
  const [list] = useAsync(() => learning.myPeople(), [learning]);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<RoleFilter>("all");
  const [country, setCountry] = useState("");
  const [decade, setDecade] = useState("");
  const [online] = useAsync(() => learning.findNewPeople(query), [learning, query]);

  const people = useMemo(() => (list.status === "ready" ? list.value : []), [list]);
  const countries = useMemo(
    () =>
      [...new Set(people.map((p) => p.person.country).filter((c): c is string => c !== null))]
        .map((code) => ({ code, name: countryName(code) ?? code }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [people],
  );
  const decades = useMemo(
    () =>
      [...new Set(people.map((p) => p.person.decade).filter((d): d is number => d !== null))].sort(
        (a, b) => b - a,
      ),
    [people],
  );

  const q = normalize(query);
  const shown = people.filter(
    ({ person }) =>
      (role === "all" || person.role === role) &&
      (!country || person.country === country) &&
      (!decade || String(person.decade) === decade) &&
      (!q || normalize(person.name).includes(q)),
  );

  const inGroup = (key: (typeof GROUPS)[number]["key"]) => (p: MyPerson) =>
    key === "mastered" ? p.mastered : !p.mastered && p.level === key;

  return (
    <>
      <main className="screen" style={{ gap: 20 }}>
        <h1 className="title-sm">My people</h1>

        <label className="search">
          <Icon name="search" size={18} strokeWidth={2} />
          <span className="visually-hidden">Search a name</span>
          <input
            id="people-search"
            type="search"
            placeholder="Search a name"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>

        <div className="filters" role="group" aria-label="Filters">
          {(["all", "actor", "director"] as const).map((r) => (
            <button
              key={r}
              type="button"
              className="chip"
              aria-pressed={role === r}
              onClick={() => setRole(r)}
            >
              {r === "all" ? "Everyone" : r === "actor" ? "Actors" : "Directors"}
            </button>
          ))}
          <label className="visually-hidden" htmlFor="filter-country">
            Country
          </label>
          <select
            id="filter-country"
            className="chip-select"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          >
            <option value="">Any country</option>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
          <label className="visually-hidden" htmlFor="filter-decade">
            Era
          </label>
          <select
            id="filter-decade"
            className="chip-select"
            value={decade}
            onChange={(e) => setDecade(e.target.value)}
          >
            <option value="">Any era</option>
            {decades.map((d) => (
              <option key={d} value={String(d)}>
                {d}s
              </option>
            ))}
          </select>
        </div>

        {list.status === "ready" && people.length === 0 && (
          <div className="empty">
            <p className="lead">No one yet. Start a session or tell us which films you've seen.</p>
            <Link to="/films" className="btn btn-secondary">
              I just watched…
            </Link>
          </div>
        )}

        {people.length > 0 && shown.length === 0 && (
          <p className="lead">No one in your list matches.</p>
        )}

        {GROUPS.map((group) => {
          const members = shown.filter(inGroup(group.key));
          if (members.length === 0) return null;
          return (
            <section key={group.key} aria-label={group.title} className="group">
              <div className="group-head">
                <span className="section-label" style={{ padding: 0 }}>
                  {group.title} · {members.length}
                </span>
                <span className="quiet" style={{ fontSize: 13 }}>
                  {group.note}
                </span>
              </div>
              {members.map(({ person }) => (
                <PersonRow
                  key={person.id}
                  id={person.id}
                  name={person.name}
                  photoPath={person.photoPath}
                  detail={personLine(person)}
                />
              ))}
            </section>
          );
        })}

        {online.status === "ready" && online.value.length > 0 && (
          <section aria-label="Not in your list yet" className="group">
            <div className="group-head">
              <span className="section-label" style={{ padding: 0 }}>
                Not in your list yet
              </span>
            </div>
            {online.value.slice(0, 8).map((p) => (
              <PersonRow
                key={p.id}
                id={p.id}
                name={p.name}
                photoPath={p.profile_path}
                detail={p.known_for_department === "Directing" ? "Director" : "Acting"}
              />
            ))}
          </section>
        )}
      </main>
      <BottomNav />
    </>
  );
}
