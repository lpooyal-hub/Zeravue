export const planetPresets = [
  { id: "amber", color: "#f3b46c", ring: false },
  { id: "blue", color: "#7db7ff", ring: false },
  { id: "rose", color: "#f095b8", ring: false },
  { id: "saturn", color: "#d6bd8a", ring: true }
];

export const defaultObserver = {
  latitude: 37.5665,
  longitude: 126.978,
  label: "Seoul"
};

export const VIEW_MODE_ORDER = [
  "space",
  "observer",
  // "panorama", // Kept in code for possible return, but hidden from the current UI.
  "projection"
];

export function getInitialObservedAt() {
  return new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export function shiftObservedTimestamp(value, hours) {
  const date = new Date(value);
  date.setHours(date.getHours() + hours);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export function setTonightTimestamp(value) {
  const date = new Date(value);
  date.setHours(21, 0, 0, 0);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export function setObserverHourTimestamp(value, hours, minutes = 0) {
  const date = new Date(value);
  date.setHours(hours, minutes, 0, 0);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export function createBlankSpaceScene(name = "") {
  const constellationId = `constellation-${Date.now()}`;
  return {
    id: `space-${Date.now()}`,
    name,
    activeConstellationId: constellationId,
    stars: [],
    planets: [],
    constellations: [
      {
        id: constellationId,
        name: "My Constellation",
        color: "#ffcf70",
        starIds: [],
        segments: []
      }
    ]
  };
}

export function clampCoordinate(value, min = -18, max = 18) {
  return Number(Math.min(max, Math.max(min, value)).toFixed(3));
}
