import { NavLink } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";

type NavbarProps = {
  onThemeToggle: () => void;
};

const navItems = [
  // { to: "/reader", label: "Karakterek" },
  // { to: "/books", label: "Művek" },
  { to: "/search", label: "Keresés" },
  { to: "/archive", label: "Adattár" },
  { to: "/tasks", label: "Feladatok" },
];

export function Navbar({ onThemeToggle }: NavbarProps) {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="navbar-brand">
          Irodalom Érettségi
        </NavLink>
        <nav className="navbar-menu" aria-label="Fő navigáció">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link${isActive ? " active-link" : ""}`}
            >
              {item.label}
            </NavLink>
          ))}
          <ThemeToggle onToggle={onThemeToggle} />
        </nav>
      </div>
    </header>
  );
}
