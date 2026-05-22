import { useCallback, useEffect, useRef, useState } from "react";

const AMBIENT_STORAGE_KEY = "planetarium-ambient-preference";
const AMBIENT_VOLUME_STORAGE_KEY = "planetarium-ambient-volume";
const DEFAULT_AMBIENT_VOLUME = 0.9;

function getInitialAmbientPreference() {
  return window.localStorage.getItem(AMBIENT_STORAGE_KEY) !== "off";
}

function getInitialAmbientVolume() {
  const saved = Number(window.localStorage.getItem(AMBIENT_VOLUME_STORAGE_KEY));
  if (Number.isFinite(saved)) {
    return Math.min(1, Math.max(0.35, saved));
  }

  return DEFAULT_AMBIENT_VOLUME;
}

export function useAmbientAudio({ trackUrl = "", isReady = true } = {}) {
  const audioRef = useRef(null);
  const enabledRef = useRef(getInitialAmbientPreference());
  const volumeRef = useRef(getInitialAmbientVolume());
  const [ambientEnabled, setAmbientEnabled] = useState(getInitialAmbientPreference);
  const [ambientVolume, setAmbientVolume] = useState(getInitialAmbientVolume);
  const [ambientStatus, setAmbientStatus] = useState(() => {
    if (!getInitialAmbientPreference()) {
      return "disabled";
    }

    return trackUrl ? "waiting" : "missing";
  });

  useEffect(() => {
    enabledRef.current = ambientEnabled;
    window.localStorage.setItem(AMBIENT_STORAGE_KEY, ambientEnabled ? "on" : "off");
  }, [ambientEnabled]);

  useEffect(() => {
    volumeRef.current = ambientVolume;
    window.localStorage.setItem(AMBIENT_VOLUME_STORAGE_KEY, String(ambientVolume));

    if (audioRef.current) {
      audioRef.current.volume = ambientVolume;
    }
  }, [ambientVolume]);

  const attemptPlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!enabledRef.current) {
      setAmbientStatus("disabled");
      return false;
    }

    if (!trackUrl || !audio) {
      setAmbientStatus("missing");
      return false;
    }

    try {
      audio.volume = volumeRef.current;
      await audio.play();
      setAmbientStatus("playing");
      return true;
    } catch (error) {
      if (audio.error) {
        setAmbientStatus("error");
      } else {
        setAmbientStatus("waiting");
      }
      return false;
    }
  }, [trackUrl]);

  const stopAmbient = useCallback(() => {
    enabledRef.current = false;
    setAmbientEnabled(false);

    if (audioRef.current) {
      audioRef.current.pause();
    }

    setAmbientStatus("disabled");
  }, []);

  const startAmbient = useCallback(async () => {
    enabledRef.current = true;
    setAmbientEnabled(true);
    return attemptPlay();
  }, [attemptPlay]);

  const toggleAmbient = useCallback(async () => {
    if (enabledRef.current) {
      stopAmbient();
      return false;
    }

    return startAmbient();
  }, [startAmbient, stopAmbient]);

  const wakeAmbient = useCallback(() => {
    if (!enabledRef.current || !isReady) {
      return;
    }

    attemptPlay().catch(() => {});
  }, [attemptPlay, isReady]);

  useEffect(() => {
    if (!ambientEnabled) {
      setAmbientStatus("disabled");
      return;
    }

    if (!trackUrl) {
      setAmbientStatus("missing");
      return;
    }

    const audio = new Audio(trackUrl);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = volumeRef.current;
    audioRef.current = audio;

    const handlePlaying = () => setAmbientStatus("playing");
    const handlePause = () => {
      if (!enabledRef.current) {
        setAmbientStatus("disabled");
        return;
      }
      setAmbientStatus("waiting");
    };
    const handleWaiting = () => {
      if (enabledRef.current) {
        setAmbientStatus("waiting");
      }
    };
    const handleCanPlay = () => {
      if (enabledRef.current && audio.paused) {
        setAmbientStatus("waiting");
      }
    };
    const handleError = () => setAmbientStatus("error");

    audio.addEventListener("playing", handlePlaying);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("canplaythrough", handleCanPlay);
    audio.addEventListener("error", handleError);

    if (ambientEnabled && isReady) {
      attemptPlay().catch(() => {});
    }

    return () => {
      audio.pause();
      audio.removeEventListener("playing", handlePlaying);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("canplaythrough", handleCanPlay);
      audio.removeEventListener("error", handleError);
      audioRef.current = null;
    };
  }, [ambientEnabled, attemptPlay, isReady, trackUrl]);

  useEffect(() => {
    if (ambientEnabled && isReady) {
      attemptPlay().catch(() => {});
    }
  }, [ambientEnabled, isReady, attemptPlay]);

  return {
    ambientEnabled,
    ambientVolume,
    setAmbientVolume,
    ambientStatus,
    toggleAmbientSound: toggleAmbient,
    wakeAmbient
  };
}
