import { Link } from "react-router";
import { useServices } from "../../app/ServicesContext";
import { initials } from "../FaceRow";

/** One person in a list: small round photo, name, and a quiet second line. */
export function PersonRow({
  id,
  name,
  photoPath,
  detail,
}: {
  id: number;
  name: string;
  photoPath: string | null;
  detail: string;
}) {
  const { image } = useServices();
  const src = image(photoPath, "w185");
  return (
    <Link to={`/person/${id}`} className="person-row">
      <span className="face">
        {src ? (
          <img src={src} alt="" loading="lazy" />
        ) : (
          <span aria-hidden="true">{initials(name)}</span>
        )}
      </span>
      <span className="person-row-text">
        <span className="person-row-name">{name}</span>
        <span className="quiet">{detail}</span>
      </span>
      <span aria-hidden="true" className="quiet">
        ›
      </span>
    </Link>
  );
}
