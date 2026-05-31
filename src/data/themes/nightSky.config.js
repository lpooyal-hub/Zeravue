/**
 * Night Sky Theme Configuration
 * 
 * Defines the night-sky healing panorama experience:
 * - Quiet appreciation of stars
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
    en: "Quiet rest under the stars",
    ko: "별빛 아래 조용한 휴식"
  },
  description: {
    en: "A peaceful, immersive night-sky experience for resting with slow stars, soft motion, and personal sky sketches.",
    ko: "느린 별빛과 부드러운 움직임, 나만의 하늘 스케치를 함께 즐기는 고요한 밤하늘 감상 경험입니다."
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
    observer: "Look upward from a calm ground-level sky.",
    panorama: "Let the horizon spread gently across the screen.",
    projection: "See the sky as a soft circular scene."
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
