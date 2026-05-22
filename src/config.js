export const config = {
  nasaApiKey: import.meta.env?.VITE_NASA_API_KEY || "DEMO_KEY",
  nasaBaseUrl: "https://api.nasa.gov",
  apiBaseUrl: import.meta.env?.VITE_API_BASE_URL || "",
  ambientTrackUrl: import.meta.env?.VITE_AMBIENT_TRACK_URL || ""
};
