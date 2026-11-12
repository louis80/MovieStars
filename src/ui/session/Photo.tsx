import { useServices } from "../../app/ServicesContext";
import type { Person } from "../../learning/types";

/** The face that is the quiz: large, rounded, with a silhouette when there is no photo. */
export function Photo({
  person,
  height,
  alt = "Photo of the person to name",
}: {
  person: Person;
  height: number;
  alt?: string;
}) {
  const { image } = useServices();
  const src = image(person.photoPath, "h632");
  return (
    <div className="photo" style={{ height }}>
      {src ? (
        <img src={src} alt={alt} />
      ) : (
        <svg
          width={Math.round(height * 0.55)}
          height={Math.round(height * 0.66)}
          viewBox="0 0 210 250"
          role="img"
          aria-label="Photo placeholder"
        >
          <circle cx="105" cy="88" r="56" fill="#d9d9d7" />
          <path d="M10 250c6-62 46-96 95-96s89 34 95 96z" fill="#d9d9d7" />
        </svg>
      )}
    </div>
  );
}
