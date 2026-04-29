import { Outlet } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";
import { Navbar } from "./Navbar";

export function AppLayout() {
  const { toggleTheme } = useTheme();

  return (
    <>
      <Navbar onThemeToggle={toggleTheme} />
      <main className="app">
        <Outlet />
      </main>
    </>
  );
}
