import { auroraNightTheme } from "./auroraNight.config.js";

/**
 * Night Sky Theme Configuration
 * 
 * Defines the night-sky healing panorama experience:
 * - Quiet observation of stars
 * - Observer-based sky calculation
 * - Contemplative viewing modes
 */

export const nightSkyTheme = {
  // Identity
  id: "night-sky",
  name: "Night Sky",
  displayName: {
    en: "Night Sky",
    ko: "밤하늘"
  },
  subtitle: {
    en: "Quiet observation of the stars",
    ko: "별의 조용한 관찰"
  },
  description: {
    en: "A peaceful, immersive night-sky viewing experience. Watch stars move across the horizon, track constellations, and sketch your own celestial patterns.",
    ko: "고요하고 몰입적인 밤하늘 감상 경험. 별의 움직임을 따라보고, 별자리를 추적하고, 자신만의 천문 패턴을 그려보세요."
  },

  // Visual Design
  colors: {
    background: "#010208",
    horizon: "#ffcf70",
    zenith: "#fff2b3",
    atmosphereLight: "#b8d2ff",
    atmosphereDark: "#ffbf8a",
    constellation: "#7fdbc9",
    constellationActive: "#ffcf70",
    text: "#eef4ff",
    guide: "#b9cde6"
  },

  // Viewing Modes
  viewModes: ["space", "observer", "panorama", "projection"],
  defaultViewMode: "space",
  viewModeDescriptions: {
    space: "Drift through outer space. Stars surround you in all directions.",
    observer: "View from Earth. See constellations rise and set with the horizon.",
    panorama: "Horizon-focused panoramic view. Track changes in sky position.",
    projection: "Map projection. See the entire celestial sphere in one view."
  },

  // Control Configuration
  controlConfig: {
    showLatLongControls: true,
    showTimeControls: true,
    showObserverModeUI: true,
    showAmbientControls: true,
    showFavorites: true,
    showFavoriteConstellations: true
  },

  // Data & Backend
  dataSource: "sky", // Points to /api/sky backend
  
  // Ambient Audio
  ambientTrack: {
    default: import.meta.env?.VITE_AMBIENT_TRACK_URL || "",
    description: {
      en: "Ambient night sounds",
      ko: "밤의 고요한 음향"
    }
  },

  // Camera & Rendering Defaults
  rendering: {
    atmosphereStrength: 0.7,
    starGlowStrength: 0.8,
    autoRotate: true,
    limitingMagnitude: 5.2,
    maxStars: 3600,
    showGuides: false,
    showLabels: false,
    showConstellations: true
  },

  // Observer Defaults
  observer: {
    default: {
      latitude: 37.5665,  // Seoul
      longitude: 126.978,
      label: {
        en: "Seoul",
        ko: "서울"
      }
    }
  },

  // UI Strings (references to i18n keys)
  strings: {
    controlsLabel: "viewer.controls",
    viewModeLabel: "viewer.viewModeLabel",
    constellationFocus: "viewer.constellationFocus",
    favoriteConstellations: "viewer.favoriteConstellations",
    observedAt: "viewer.observedAt",
    observer: "viewer.observer"
  },

  // Feature Flags
  features: {
    sketching: true,
    favorites: true,
    tracking: true,
    observerMode: true,
    fullscreen: true,
    ambientAudio: true
  }
};

/**
 * Get theme by ID
 */
export function getThemeById(id) {
  return getAllThemes().find((theme) => theme.id === id) || null;
}

/**
 * List all available themes
 */
export function getAllThemes() {
  return [nightSkyTheme, auroraNightTheme];
}
