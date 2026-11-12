import { Link } from "react-router";
import type { FaceSummary } from "../app/learningService";
import { FACE_ROW_SIZE } from "../app/learningService";
import { useServices } from "../app/ServicesContext";

/** How visible a face is at each level (spec: Visible progress). */
const LOOK = {
  1: { opacity: 0.35, grayscale: 1 },
  2: { opacity: 0.55, grayscale: 1 },
  3: { opacity: 0.8, grayscale: 0.4 },
  4: { opacity: 1, grayscale: 0 },
} as const;

function initials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  return (
    (parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts.at(-1)?.[0] ?? "") : "")
  ).toUpperCase();
}

function Face({ face }: { face: FaceSummary }) {
  const { image } = useServices();
  const src = image(face.photoPath, "w185");
  const look = LOOK[face.level];
  return (
    <span
      className={face.mastered ? "face face-mastered" : "face"}
      title={face.name}
      data-level={face.level}
      style={{ opacity: look.opacity, filter: `grayscale(${look.grayscale})` }}
    >
      {src ? (
        <img src={src} alt="" loading="lazy" />
      ) : (
        <span aria-hidden="true">{initials(face.name)}</span>
      )}
    </span>
  );
}

export function FaceRow({
  faces,
  total,
  knownWell,
}: {
  faces: FaceSummary[];
  total: number;
  knownWell: number;
}) {
  const more = total - faces.length;
  const shown = more > 0 ? faces.slice(0, FACE_ROW_SIZE - 1) : faces;
  const hidden = total - shown.length;
  const caption = `${total} ${total === 1 ? "person" : "people"} · ${knownWell} you know well`;

  return (
    <section aria-label="Your people">
      <div className="section-label">Your people</div>
      <Link to="/people" className="face-row" aria-label={`${caption}. Open My people`}>
        <span className="faces">
          {shown.map((face) => (
            <Face key={face.id} face={face} />
          ))}
          {hidden > 0 && <span className="face face-more">+{hidden}</span>}
        </span>
        <span className="face-caption">
          <span>{caption}</span>
          <span aria-hidden="true">›</span>
        </span>
      </Link>
    </section>
  );
}
