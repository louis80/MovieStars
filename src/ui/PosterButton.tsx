import { useServices } from "../app/ServicesContext";
import { yearFromDate } from "../tmdb/map";
import type { TmdbMovieSummary } from "../tmdb/types";
import { Icon } from "./Icon";

export function PosterButton({
  film,
  selected,
  onToggle,
}: {
  film: TmdbMovieSummary;
  selected: boolean;
  onToggle: () => void;
}) {
  const { image } = useServices();
  const src = image(film.poster_path, "w185");
  const year = yearFromDate(film.release_date);

  return (
    <button type="button" className="poster" aria-pressed={selected} onClick={onToggle}>
      <div className="poster-image">
        {src ? (
          <img src={src} alt="" loading="lazy" />
        ) : (
          <Icon name="film" size={28} color="#c9c9c7" />
        )}
        {selected && (
          <div className="poster-check">
            <Icon name="check" size={14} color="#ffffff" strokeWidth={3} />
          </div>
        )}
      </div>
      <span className="poster-title">
        {film.title}
        {year ? <span className="quiet"> · {year}</span> : null}
      </span>
    </button>
  );
}
