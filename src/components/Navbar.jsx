// src/components/Navbar.jsx
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";

export default function Navbar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const isActive = (path) =>
    location.pathname === path
      ? "text-blue-600 dark:text-blue-400 font-semibold"
      : "text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white";

  return (
    <nav className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/90 backdrop-blur border-b border-slate-200/70 dark:border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between">
      {/* Logo */}
      <Link
        to="/"
        className="text-lg sm:text-xl font-bold tracking-tight flex items-center gap-1 text-slate-900 dark:text-white"
      >
        Study<span className="text-blue-500">Together</span>
      </Link>

      <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm">
        {/* Links */}
        <div className="hidden sm:flex items-center gap-4">
          <Link to="/" className={isActive("/")}>
            Home
          </Link>

          {user && (
            <>
              <Link to="/rooms" className={isActive("/rooms")}>
                Rooms
              </Link>
              <Link to="/dashboard" className={isActive("/dashboard")}>
                Dashboard
              </Link>
              <Link to="/tasks" className={isActive("/tasks")}>
                Tasks
              </Link>
              <Link
                to="/weekly-report"
                className={isActive("/weekly-report")}
              >
                Weekly Report
              </Link>
            </>
          )}
        </div>

        {/* Theme toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="px-2 py-1 rounded-full bg-slate-100 border border-slate-300 text-[11px] sm:text-xs text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200 dark:hover:bg-slate-700 flex items-center gap-1"
        >
          {theme === "dark" ? (
            <>
              <span>🌙</span>
              <span>Dark</span>
            </>
          ) : (
            <>
              <span>☀️</span>
              <span>Light</span>
            </>
          )}
        </button>

        {/* Auth button */}
        {user ? (
          <button
            onClick={logout}
            className="px-3 py-1 rounded-full bg-red-500 hover:bg-red-600 text-[11px] sm:text-xs font-semibold text-white"
          >
            Logout
          </button>
        ) : (
          <Link
            to="/login"
            className={
              "px-3 py-1 rounded-full border border-blue-500 text-[11px] sm:text-xs font-semibold hover:bg-blue-500 hover:text-white transition " +
              (location.pathname === "/login"
                ? "bg-blue-500 text-white"
                : "text-blue-600")
            }
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}
