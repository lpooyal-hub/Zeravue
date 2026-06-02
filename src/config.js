export const config = {
  apiBaseUrl: import.meta.env?.VITE_API_BASE_URL || "",
  ambientTrackUrl: import.meta.env?.VITE_AMBIENT_TRACK_URL || "",
  auroraAmbientTrackUrl: import.meta.env?.VITE_AURORA_AMBIENT_TRACK_URL || "",
  rainAmbientTrackUrl: import.meta.env?.VITE_RAIN_AMBIENT_TRACK_URL || ""
};
