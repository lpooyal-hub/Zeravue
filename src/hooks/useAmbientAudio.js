import { useCallback, useEffect, useRef, useState } from "react";

const AMBIENT_STORAGE_KEY = "planetarium-ambient-preference";
const AMBIENT_VOLUME_STORAGE_KEY = "planetarium-ambient-volume";
const DEFAULT_AMBIENT_VOLUME = 0.9;
const MIN_AMBIENT_VOLUME = 0.5;
const MAX_AMBIENT_VOLUME = 1.15;
const DEFAULT_OUTPUT_GAIN = 1.18;

function getInitialAmbientPreference() {
  return window.localStorage.getItem(AMBIENT_STORAGE_KEY) !== "off";
}

function getInitialAmbientVolume() {
  const saved = Number(window.localStorage.getItem(AMBIENT_VOLUME_STORAGE_KEY));
  if (Number.isFinite(saved)) {
    return Math.min(MAX_AMBIENT_VOLUME, Math.max(MIN_AMBIENT_VOLUME, saved));
  }

  return DEFAULT_AMBIENT_VOLUME;
}

export function useAmbientAudio({ trackUrl = "", isReady = true, outputGain = DEFAULT_OUTPUT_GAIN } = {}) {
  const audioRef = useRef(null);
  const enabledRef = useRef(getInitialAmbientPreference());
  const volumeRef = useRef(getInitialAmbientVolume());
  const interactionUnlockedRef = useRef(false);
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
      audioRef.current.volume = Math.min(1, ambientVolume * outputGain);
    }
  }, [ambientVolume, outputGain]);

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
      audio.volume = Math.min(1, volumeRef.current * outputGain);
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
  }, [outputGain, trackUrl]);

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

    interactionUnlockedRef.current = true;
    attemptPlay().catch(() => {});
  }, [attemptPlay, isReady]);

  const ensureAmbientOn = useCallback(async () => {
    if (enabledRef.current) {
      return attemptPlay();
    }
    return startAmbient();
  }, [attemptPlay, startAmbient]);

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
    audio.volume = Math.min(1, volumeRef.current * outputGain);
    audio.playsInline = true;
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
    const handleEnded = () => {
      // Defensive restart for environments where loop can be interrupted.
      audio.currentTime = 0;
      if (enabledRef.current) {
        audio.play().catch(() => {});
      }
    };

    audio.addEventListener("playing", handlePlaying);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("canplaythrough", handleCanPlay);
    audio.addEventListener("error", handleError);
    audio.addEventListener("ended", handleEnded);

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
      audio.removeEventListener("ended", handleEnded);
      audioRef.current = null;
    };
  }, [ambientEnabled, attemptPlay, isReady, outputGain, trackUrl]);

  useEffect(() => {
    if (ambientEnabled && isReady) {
      attemptPlay().catch(() => {});
    }
  }, [ambientEnabled, isReady, attemptPlay]);

  useEffect(() => {
    function unlockAndPlay() {
      if (!enabledRef.current || !isReady) {
        return;
      }
      interactionUnlockedRef.current = true;
      attemptPlay().catch(() => {});
    }

    function onVisibilityChange() {
      if (document.visibilityState === "visible" && enabledRef.current && isReady && interactionUnlockedRef.current) {
        attemptPlay().catch(() => {});
      }
    }

    window.addEventListener("pointerdown", unlockAndPlay, { capture: true, passive: true });
    window.addEventListener("keydown", unlockAndPlay, { capture: true });
    window.addEventListener("touchstart", unlockAndPlay, { capture: true, passive: true });
    window.addEventListener("focus", unlockAndPlay, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("pointerdown", unlockAndPlay, true);
      window.removeEventListener("keydown", unlockAndPlay, true);
      window.removeEventListener("touchstart", unlockAndPlay, true);
      window.removeEventListener("focus", unlockAndPlay);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [attemptPlay, isReady]);

  return {
    ambientEnabled,
    ambientVolume,
    setAmbientVolume,
    ambientStatus,
    toggleAmbientSound: toggleAmbient,
    wakeAmbient,
    ensureAmbientOn
  };
}
