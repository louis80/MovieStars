import { NavLink } from "react-router";
import { Icon } from "./Icon";

export function BottomNav() {
  return (
    <nav className="nav" aria-label="Main">
      <NavLink to="/" end>
        <Icon name="home" />
        <span>Home</span>
      </NavLink>
      <NavLink to="/people">
        <Icon name="people" />
        <span>My people</span>
      </NavLink>
      <NavLink to="/films">
        <Icon name="film" />
        <span>I just watched</span>
      </NavLink>
    </nav>
  );
}
