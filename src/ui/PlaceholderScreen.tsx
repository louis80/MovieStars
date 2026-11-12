import { Link } from "react-router";

/** Stand-in for screens built in later tasks (T9, T10). */
export function PlaceholderScreen({ title, task }: { title: string; task: string }) {
  return (
    <main className="screen">
      <h1 className="title-sm">{title}</h1>
      <p className="lead">This screen is built in {task}.</p>
      <div className="bottom">
        <Link to="/" className="btn btn-secondary">
          Back to Home
        </Link>
      </div>
    </main>
  );
}
