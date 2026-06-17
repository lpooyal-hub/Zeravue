import { auroraNightTheme } from "./auroraNight.config.js";
import { lagoonBelowTheme } from "./lagoonBelow.config.js";
import { monsoonCanopyTheme } from "./monsoonCanopy.config.js";
import { nightSkyTheme } from "./nightSky.config.js";
import { rainWindowTheme } from "./rainWindow.config.js";

export const DEFAULT_THEME_ID = "night-sky";

export const ALL_THEMES = [nightSkyTheme, auroraNightTheme, monsoonCanopyTheme, lagoonBelowTheme, rainWindowTheme];

export const THEME_ROUTES = {
  "/night-sky": {
    themeId: "night-sky",
    auroraRenderer: null
  },
  "/aurora": {
    themeId: "aurora-night",
    auroraRenderer: "css"
  },
  "/aurora-live": {
    themeId: "aurora-night",
    auroraRenderer: "webgl"
  },
  "/monsoon-canopy": {
    themeId: "monsoon-canopy",
    auroraRenderer: null
  },
  "/lagoon-below": {
    themeId: "lagoon-below",
    auroraRenderer: null
  },
  "/rain-window": {
    themeId: "rain-window",
    auroraRenderer: null
  }
};

export function getAllThemes() {
  return ALL_THEMES;
}

export function getThemeById(id) {
  return ALL_THEMES.find((theme) => theme.id === id) || null;
}

export function getDefaultTheme() {
  return getThemeById(DEFAULT_THEME_ID) || nightSkyTheme;
}

export function getThemeRouteConfig(path) {
  return THEME_ROUTES[path] || null;
}
