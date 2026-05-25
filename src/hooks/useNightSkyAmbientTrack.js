import { useEffect, useState } from "react";
import { renderAuroraAmbientTrack } from "../audio/renderAuroraAmbientTrack.js";
import { renderNightSkyAmbientTrack } from "../audio/renderNightSkyAmbientTrack.js";

const THEME_RENDERERS = {
  "aurora-night": renderAuroraAmbientTrack
};

export function useNightSkyAmbientTrack({ configuredTrackUrl = "", themeId = "night-sky" } = {}) {
  const [generatedTrackUrl, setGeneratedTrackUrl] = useState("");
  const [trackPending, setTrackPending] = useState(!configuredTrackUrl);
  const [trackError, setTrackError] = useState("");

  useEffect(() => {
    if (configuredTrackUrl) {
      setGeneratedTrackUrl("");
      setTrackPending(false);
      setTrackError("");
      return undefined;
    }

    let cancelled = false;
    let objectUrl = "";
    setTrackPending(true);
    setTrackError("");

    const renderTrack = THEME_RENDERERS[themeId] || renderNightSkyAmbientTrack;

    renderTrack()
      .then((url) => {
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }

        objectUrl = url;
        setGeneratedTrackUrl(url);
        setTrackPending(false);
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        setTrackPending(false);
        setTrackError(error?.message || "Failed to render ambient track.");
      });

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [configuredTrackUrl, themeId]);

  return {
    ambientTrackUrl: configuredTrackUrl || generatedTrackUrl,
    ambientTrackPending: trackPending,
    ambientTrackError: trackError
  };
}
