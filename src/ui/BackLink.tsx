import { useNavigate } from "react-router";

export function BackLink() {
  const navigate = useNavigate();
  return (
    <button type="button" className="link-quiet back" onClick={() => navigate(-1)}>
      ← Back
    </button>
  );
}
