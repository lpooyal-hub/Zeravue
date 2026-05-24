import { createContext, useContext, useEffect, useState } from "react";
import { getAllThemes, nightSkyTheme } from "../data/themes/nightSky.config.js";

/**
 * ThemeContext - provides current theme to all components
 */
const THEME_STORAGE_KEY = "zeravue-theme";
const ThemeContext = createContext(null);

/**
 * ThemeProvider - wraps the app to provide theme data
 */
export function ThemeProvider({ children, defaultTheme = "night-sky" }) {
  const [currentThemeId, setCurrentThemeId] = useState(() => {
    const saved = window.localStorage?.getItem(THEME_STORAGE_KEY);
    return saved && getAllThemes().find((t) => t.id === saved) ? saved : defaultTheme;
  });

  const themes = getAllThemes();
  const currentTheme = themes.find((t) => t.id === currentThemeId) || nightSkyTheme;

  // Persist theme selection
  useEffect(() => {
    window.localStorage?.setItem(THEME_STORAGE_KEY, currentThemeId);
  }, [currentThemeId]);

  const switchTheme = (themeId) => {
    const theme = themes.find((t) => t.id === themeId);
    if (theme) {
      setCurrentThemeId(themeId);
    }
  };

  const value = {
    currentTheme,
    currentThemeId,
    themes,
    switchTheme
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * useTheme - hook to access current theme
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    console.warn("useTheme called outside ThemeProvider. Using nightSkyTheme as fallback.");
    return {
      currentTheme: nightSkyTheme,
      currentThemeId: "night-sky",
      themes: getAllThemes(),
      switchTheme: () => {}
    };
  }
  return context;
}
