import { createContext, useContext, useEffect, useState } from "react";
import { getAllThemes, getDefaultTheme, DEFAULT_THEME_ID } from "../data/themes/index.js";

/**
 * ThemeContext - provides current theme to all components
 */
const THEME_STORAGE_KEY = "zeravue-theme";
const ThemeContext = createContext(null);

/**
 * ThemeProvider - wraps the app to provide theme data
 */
export function ThemeProvider({ children, defaultTheme = "night-sky" }) {
  const fallbackThemeId = defaultTheme || DEFAULT_THEME_ID;
  const fallbackTheme = getDefaultTheme();
  const [currentThemeId, setCurrentThemeId] = useState(() => {
    const saved = window.localStorage?.getItem(THEME_STORAGE_KEY);
    return saved && getAllThemes().find((t) => t.id === saved) ? saved : fallbackThemeId;
  });

  const themes = getAllThemes();
  const currentTheme = themes.find((t) => t.id === currentThemeId) || fallbackTheme;

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
    const fallbackTheme = getDefaultTheme();
    console.warn("useTheme called outside ThemeProvider. Using default theme fallback.");
    return {
      currentTheme: fallbackTheme,
      currentThemeId: fallbackTheme.id,
      themes: getAllThemes(),
      switchTheme: () => {}
    };
  }
  return context;
}
