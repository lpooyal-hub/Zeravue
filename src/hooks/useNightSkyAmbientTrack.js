import { useEffect, useState } from "react";
import { renderNightSkyAmbientTrack } from "../audio/renderNightSkyAmbientTrack.js";

export function useNightSkyAmbientTrack(configuredTrackUrl = "") {
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

    renderNightSkyAmbientTrack()
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
  }, [configuredTrackUrl]);

  return {
    ambientTrackUrl: configuredTrackUrl || generatedTrackUrl,
    ambientTrackPending: trackPending,
    ambientTrackError: trackError
  };
}
