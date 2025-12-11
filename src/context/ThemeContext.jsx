import { createContext, useContext, useEffect, useLayoutEffect, useState } from "react";

const ThemeContext = createContext(null);
const KEY = "studyTogetherTheme";

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");

  // 🔹 Apply theme BEFORE UI paints
  useLayoutEffect(() => {
    let saved = localStorage.getItem(KEY);

    if (saved !== "dark" && saved !== "light") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      saved = prefersDark ? "dark" : "light";
      localStorage.setItem(KEY, saved);
    }

    setTheme(saved);

    if (saved === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // 🔹 When switching theme — save & update DOM
  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem(KEY, next);

      if (next === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }

      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
