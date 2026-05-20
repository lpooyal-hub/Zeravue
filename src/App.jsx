import { useEffect, useMemo, useRef, useState } from "react";
import { getSkyScene } from "./api/backend.js";
import { PlanetariumCanvas } from "./components/PlanetariumCanvas.jsx";
import { getInitialLanguage, translations } from "./data/i18n.js";

const SKETCH_STORAGE_KEY = "planetarium-custom-space-scenes";
const AMBIENT_STORAGE_KEY = "planetarium-ambient-preference";
const AMBIENT_VOLUME_STORAGE_KEY = "planetarium-ambient-volume";
const DEFAULT_AMBIENT_VOLUME = 0.9;

const planetPresets = [
  { id: "amber", color: "#f3b46c", ring: false },
  { id: "blue", color: "#7db7ff", ring: false },
  { id: "rose", color: "#f095b8", ring: false },
  { id: "saturn", color: "#d6bd8a", ring: true }
];

function getInitialAmbientVolume() {
  const saved = Number(window.localStorage.getItem(AMBIENT_VOLUME_STORAGE_KEY));
  if (Number.isFinite(saved)) {
    return Math.min(1, Math.max(0.35, saved));
  }

  return DEFAULT_AMBIENT_VOLUME;
}

function createAmbientSoundscape(initialVolume = DEFAULT_AMBIENT_VOLUME) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return null;
  }

  const context = new AudioContextClass();
  const master = context.createGain();
  const delay = context.createDelay(5);
  const feedback = context.createGain();
  const wash = context.createGain();
  const compressor = context.createDynamicsCompressor();
  const nodes = [];
  const timers = [];

  master.gain.value = 0;
  wash.gain.value = 0.52;
  delay.delayTime.value = 1.9;
  feedback.gain.value = 0.26;
  compressor.threshold.value = -22;
  compressor.knee.value = 18;
  compressor.ratio.value = 4;
  compressor.attack.value = 0.02;
  compressor.release.value = 0.42;

  wash.connect(master);
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(master);
  master.connect(compressor);
  compressor.connect(context.destination);

  const voices = [
    { frequency: 55, gain: 0.088, lfo: 0.026 },
    { frequency: 82.41, gain: 0.062, lfo: 0.021 },
    { frequency: 110, gain: 0.042, lfo: 0.017 },
    { frequency: 146.83, gain: 0.028, lfo: 0.013 }
  ];

  voices.forEach((voice, index) => {
    const oscillator = context.createOscillator();
    const voiceGain = context.createGain();
    const filter = context.createBiquadFilter();
    const lfo = context.createOscillator();
    const lfoGain = context.createGain();

    oscillator.type = index === 0 ? "sine" : "triangle";
    oscillator.frequency.value = voice.frequency;
    voiceGain.gain.value = voice.gain;
    filter.type = "lowpass";
    filter.frequency.value = 540 + index * 180;
    filter.Q.value = 0.55;
    lfo.frequency.value = voice.lfo;
    lfoGain.gain.value = voice.gain * 0.45;

    oscillator.connect(filter);
    filter.connect(voiceGain);
    voiceGain.connect(wash);
    voiceGain.connect(delay);
    lfo.connect(lfoGain);
    lfoGain.connect(voiceGain.gain);

    oscillator.start();
    lfo.start();
    nodes.push(oscillator, lfo);
  });

  const shimmerBuffer = context.createBuffer(1, context.sampleRate * 3, context.sampleRate);
  const shimmerData = shimmerBuffer.getChannelData(0);
  for (let index = 0; index < shimmerData.length; index += 1) {
    shimmerData[index] = (Math.random() * 2 - 1) * 0.035;
  }

  const shimmer = context.createBufferSource();
  const shimmerFilter = context.createBiquadFilter();
  const shimmerGain = context.createGain();
  shimmer.buffer = shimmerBuffer;
  shimmer.loop = true;
  shimmerFilter.type = "bandpass";
  shimmerFilter.frequency.value = 1280;
  shimmerFilter.Q.value = 0.65;
  shimmerGain.gain.value = 0.052;
  shimmer.connect(shimmerFilter);
  shimmerFilter.connect(shimmerGain);
  shimmerGain.connect(master);
  shimmer.start();
  nodes.push(shimmer);

  function playChime(delaySeconds = 0) {
    const startAt = context.currentTime + delaySeconds;
    const oscillator = context.createOscillator();
    const chimeGain = context.createGain();
    const filter = context.createBiquadFilter();
    const frequencies = [329.63, 392, 493.88, 659.25];
    const frequency = frequencies[Math.floor(Math.random() * frequencies.length)];

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, startAt);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.01, startAt + 2.4);
    filter.type = "highpass";
    filter.frequency.value = 420;
    chimeGain.gain.setValueAtTime(0, startAt);
    chimeGain.gain.linearRampToValueAtTime(0.065, startAt + 0.18);
    chimeGain.gain.exponentialRampToValueAtTime(0.001, startAt + 3.4);

    oscillator.connect(filter);
    filter.connect(chimeGain);
    chimeGain.connect(master);
    chimeGain.connect(delay);
    oscillator.start(startAt);
    oscillator.stop(startAt + 3.6);
  }

  playChime(0.18);
  playChime(1.1);
  timers.push(window.setInterval(() => playChime(), 6200));

  master.gain.setTargetAtTime(initialVolume, context.currentTime, 0.9);

  return {
    context,
    setVolume(volume) {
      master.gain.cancelScheduledValues(context.currentTime);
      master.gain.setTargetAtTime(volume, context.currentTime, 0.18);
    },
    stop() {
      master.gain.cancelScheduledValues(context.currentTime);
      master.gain.setTargetAtTime(0, context.currentTime, 0.35);
      timers.forEach((timer) => window.clearInterval(timer));
      window.setTimeout(() => {
        nodes.forEach((node) => {
          try {
            node.stop();
          } catch {
            // Some browser audio nodes may already be stopped.
          }
        });
        context.close();
      }, 900);
    }
  };
}

const defaultObserver = {
  latitude: 37.5665,
  longitude: 126.978,
  label: "Seoul"
};

function getInitialObservedAt() {
  return new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function shiftObservedTimestamp(value, hours) {
  const date = new Date(value);
  date.setHours(date.getHours() + hours);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function setTonightTimestamp(value) {
  const date = new Date(value);
  date.setHours(21, 0, 0, 0);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function setObserverHourTimestamp(value, hours, minutes = 0) {
  const date = new Date(value);
  date.setHours(hours, minutes, 0, 0);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function createBlankSpaceScene(name = "") {
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

function clampCoordinate(value, min = -18, max = 18) {
  return Number(Math.min(max, Math.max(min, value)).toFixed(3));
}

const VIEW_MODE_ORDER = ["space", "observer", "panorama", "projection"];

export function App() {
  const viewerRef = useRef(null);
  const ambientSoundRef = useRef(null);
  const ambientPreferenceRef = useRef(true);
  const ambientRestartingRef = useRef(false);
  const ambientVolumeRef = useRef(getInitialAmbientVolume());
  const ambientWatchdogRef = useRef({ frame: 0, until: 0, lastAttempt: 0 });
  const ambientRetryTimersRef = useRef([]);
  const [currentPage, setCurrentPage] = useState("watch");
  const [language, setLanguage] = useState(getInitialLanguage);
  const [observer, setObserver] = useState(defaultObserver);
  const [observedAt, setObservedAt] = useState(getInitialObservedAt);
  const [limitingMagnitude, setLimitingMagnitude] = useState(5.2);
  const [maxStars, setMaxStars] = useState(3600);
  const [sceneState, setSceneState] = useState({ status: "loading", data: null, error: "" });
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [showLabels, setShowLabels] = useState(false);
  const [showGuides, setShowGuides] = useState(false);
  const [showConstellations, setShowConstellations] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);
  const [atmosphereStrength, setAtmosphereStrength] = useState(0.7);
  const [starGlowStrength, setStarGlowStrength] = useState(0.8);
  const [viewMode, setViewMode] = useState("space");
  const [zoomLevel, setZoomLevel] = useState(0.52);
  const [focusedConstellation, setFocusedConstellation] = useState("all");
  const [constellationSearch, setConstellationSearch] = useState("");
  const [trackConstellation, setTrackConstellation] = useState(false);
  const [creativeTool, setCreativeTool] = useState("star");
  const [planetPreset, setPlanetPreset] = useState(planetPresets[0].id);
  const [presetConstellationName, setPresetConstellationName] = useState("");
  const [sketchName, setSketchName] = useState("");
  const [savedSketches, setSavedSketches] = useState([]);
  const [activeSketchId, setActiveSketchId] = useState("draft");
  const [customSpace, setCustomSpace] = useState(() => createBlankSpaceScene());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [ambientEnabled, setAmbientEnabled] = useState(true);
  const [ambientVolume, setAmbientVolume] = useState(getInitialAmbientVolume);
  const dictionary = translations[language];

  useEffect(() => {
    const saved = window.localStorage.getItem(SKETCH_STORAGE_KEY);
    if (!saved) {
      return;
    }

    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        setSavedSketches(parsed.filter((scene) => Array.isArray(scene.stars) && Array.isArray(scene.planets) && Array.isArray(scene.constellations)));
      }
    } catch (error) {
      console.warn("Failed to restore saved sketches:", error);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    window.localStorage.setItem("planetarium-language", language);
  }, [language]);

  useEffect(
    () => {
      return () => {
        ambientRetryTimersRef.current.forEach((timer) => window.clearTimeout(timer));
        ambientRetryTimersRef.current = [];
        if (ambientWatchdogRef.current.frame) {
          window.cancelAnimationFrame(ambientWatchdogRef.current.frame);
        }
        ambientSoundRef.current?.stop();
        ambientSoundRef.current = null;
      };
    },
    []
  );

  useEffect(() => {
    if (!ambientPreferenceRef.current) {
      return undefined;
    }

    const scheduleAmbientRetries = (durations = [180, 900, 2200, 4200]) => {
      ambientRetryTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      ambientRetryTimersRef.current = durations.map((delay) =>
        window.setTimeout(() => {
          if (!ambientPreferenceRef.current) {
            return;
          }
          kickAmbientWatchdog(18000);
          ensureAmbientSound().catch(() => {});
        }, delay)
      );
    };

    const retryAmbient = () => {
      if (!ambientPreferenceRef.current) {
        return;
      }
      kickAmbientWatchdog(18000);
      ensureAmbientSound().catch(() => {});
      scheduleAmbientRetries();
    };
    const retryWhenVisible = () => {
      if (document.visibilityState === "visible") {
        retryAmbient();
      }
    };
    const interval = window.setInterval(() => {
      if (!ambientPreferenceRef.current) {
        return;
      }
      if (!ambientSoundRef.current || ambientSoundRef.current.context.state !== "running") {
        retryAmbient();
        return;
      }
      ambientSoundRef.current.setVolume(ambientVolumeRef.current);
      ambientSoundRef.current.context.resume().catch(() => {
        retryAmbient();
      });
    }, 1500);

    retryAmbient();
    window.addEventListener("load", retryAmbient);
    window.addEventListener("pointerdown", retryAmbient, { passive: true });
    window.addEventListener("click", retryAmbient, { passive: true });
    window.addEventListener("mousemove", retryAmbient, { passive: true });
    window.addEventListener("keydown", retryAmbient);
    window.addEventListener("touchstart", retryAmbient, { passive: true });
    window.addEventListener("focus", retryAmbient);
    window.addEventListener("pageshow", retryAmbient);
    window.addEventListener("online", retryAmbient);
    document.addEventListener("visibilitychange", retryWhenVisible);

    return () => {
      window.clearInterval(interval);
      ambientRetryTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      ambientRetryTimersRef.current = [];
      window.removeEventListener("load", retryAmbient);
      window.removeEventListener("pointerdown", retryAmbient);
      window.removeEventListener("click", retryAmbient);
      window.removeEventListener("mousemove", retryAmbient);
      window.removeEventListener("keydown", retryAmbient);
      window.removeEventListener("touchstart", retryAmbient);
      window.removeEventListener("focus", retryAmbient);
      window.removeEventListener("pageshow", retryAmbient);
      window.removeEventListener("online", retryAmbient);
      document.removeEventListener("visibilitychange", retryWhenVisible);
    };
  }, []);

  useEffect(() => {
    if (!ambientPreferenceRef.current || sceneState.status !== "ready") {
      return;
    }
    kickAmbientWatchdog(18000);
    ensureAmbientSound().catch(() => {});
  }, [sceneState.status, observedAt, viewMode]);

  useEffect(() => {
    window.localStorage.setItem(SKETCH_STORAGE_KEY, JSON.stringify(savedSketches));
  }, [savedSketches]);

  useEffect(() => {
    ambientVolumeRef.current = ambientVolume;
    window.localStorage.setItem(AMBIENT_VOLUME_STORAGE_KEY, String(ambientVolume));
    ambientSoundRef.current?.setVolume(ambientVolume);
  }, [ambientVolume]);

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadScene() {
      setSceneState((current) => ({ ...current, status: "loading", error: "" }));

      try {
        const data = await getSkyScene({
          latitude: observer.latitude,
          longitude: observer.longitude,
          observedAt: new Date(observedAt).toISOString(),
          limitingMagnitude,
          maxStars
        });

        if (cancelled) {
          return;
        }

        setSceneState({ status: "ready", data, error: "" });
        setSelectedTarget((current) => current || { kind: "star", id: data.stars.find((star) => star.visible)?.id || data.stars[0]?.id || null });
      } catch (error) {
        if (cancelled) {
          return;
        }

        setSceneState({ status: "error", data: null, error: error.message || "Failed to load the scene." });
      }
    }

    loadScene();

    return () => {
      cancelled = true;
    };
  }, [observer.latitude, observer.longitude, observedAt, limitingMagnitude, maxStars]);

  const selectedStar = useMemo(
    () => (selectedTarget?.kind === "star" ? sceneState.data?.stars.find((star) => star.id === selectedTarget.id) || null : null),
    [sceneState.data, selectedTarget]
  );
  const visibleConstellations = sceneState.data?.summary.visibleConstellations || [];
  const filteredConstellations = useMemo(() => {
    const query = constellationSearch.trim().toLowerCase();
    if (!query) {
      return visibleConstellations;
    }

    return visibleConstellations.filter((name) => {
      const translated = dictionary.constellations?.[name]?.[language] || name;
      return name.toLowerCase().includes(query) || translated.toLowerCase().includes(query);
    });
  }, [constellationSearch, dictionary.constellations, language, visibleConstellations]);
  const activeCustomConstellation = useMemo(
    () => customSpace.constellations.find((constellation) => constellation.id === customSpace.activeConstellationId) || customSpace.constellations[0],
    [customSpace]
  );
  const activeCustomConstellationStars = useMemo(() => {
    if (!activeCustomConstellation) {
      return [];
    }
    const starIds = new Set(activeCustomConstellation.starIds);
    return customSpace.stars.filter((star) => starIds.has(star.id));
  }, [activeCustomConstellation, customSpace.stars]);
  const activeConstellationCenter = useMemo(() => {
    if (!activeCustomConstellationStars.length) {
      return null;
    }

    const total = activeCustomConstellationStars.reduce(
      (current, star) => ({
        x: current.x + star.x,
        y: current.y + star.y,
        z: current.z + star.z
      }),
      { x: 0, y: 0, z: 0 }
    );

    return {
      x: total.x / activeCustomConstellationStars.length,
      y: total.y / activeCustomConstellationStars.length,
      z: total.z / activeCustomConstellationStars.length
    };
  }, [activeCustomConstellationStars]);
  const selectedCustomStar = useMemo(
    () => (selectedTarget?.kind === "custom-star" ? customSpace.stars.find((star) => star.id === selectedTarget.id) || null : null),
    [customSpace.stars, selectedTarget]
  );
  const selectedCustomPlanet = useMemo(
    () => (selectedTarget?.kind === "custom-planet" ? customSpace.planets.find((planet) => planet.id === selectedTarget.id) || null : null),
    [customSpace.planets, selectedTarget]
  );
  const activeSketchName = sketchName.trim() || customSpace.name || dictionary.viewer.draftSketch;
  const activeConstellationKey = useMemo(() => {
    if (focusedConstellation !== "all") {
      return focusedConstellation;
    }
    if (selectedStar?.constellation && selectedStar.constellation !== "Unknown") {
      return selectedStar.constellation;
    }
    return visibleConstellations[0] || null;
  }, [focusedConstellation, selectedStar, visibleConstellations]);
  const activeConstellationName = activeConstellationKey ? dictionary.constellations?.[activeConstellationKey]?.[language] || activeConstellationKey : null;
  const activeConstellationStory =
    (activeConstellationKey && dictionary.viewer.constellationMoods?.[activeConstellationKey]?.[language]) || dictionary.viewer.constellationFallback;
  const sketchViewDescription = dictionary.viewer.viewModeDescriptions[viewMode];
  const observerMomentLabel = useMemo(() => {
    const date = new Date(observedAt);
    if (Number.isNaN(date.getTime())) {
      return observedAt;
    }
    return new Intl.DateTimeFormat(language === "ko" ? "ko-KR" : "en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    }).format(date);
  }, [language, observedAt]);
  const currentViewConstellations = useMemo(() => {
    const stars = sceneState.data?.stars || [];
    if (!stars.length) {
      return [];
    }

    const minAltitude = viewMode === "observer" ? 28 : viewMode === "panorama" ? 18 : viewMode === "projection" ? 22 : 12;
    const minStars = viewMode === "space" ? 2 : 3;
    const bucket = new Map();

    stars.forEach((star) => {
      if (!star.visible || star.constellation === "Unknown" || star.altitude < minAltitude) {
        return;
      }
      const current = bucket.get(star.constellation) || { count: 0, altitude: 0, magnitude: 0 };
      bucket.set(star.constellation, {
        count: current.count + 1,
        altitude: current.altitude + star.altitude,
        magnitude: current.magnitude + star.magnitude
      });
    });

    return [...bucket.entries()]
      .filter(([, value]) => value.count >= minStars)
      .map(([name, value]) => ({
        name,
        score: value.count * 3 + value.altitude / value.count / 14 - value.magnitude / value.count / 3
      }))
      .sort((left, right) => right.score - left.score)
      .slice(0, 10)
      .map((item) => item.name);
  }, [sceneState.data?.stars, viewMode]);

  useEffect(() => {
    if (!visibleConstellations.length) {
      setPresetConstellationName("");
      return;
    }
    if (!presetConstellationName || !visibleConstellations.includes(presetConstellationName)) {
      setPresetConstellationName(visibleConstellations[0]);
    }
  }, [presetConstellationName, visibleConstellations]);

  useEffect(() => {
    if (focusedConstellation === "all") {
      setTrackConstellation(false);
    }
  }, [focusedConstellation]);

  useEffect(() => {
    if (!trackConstellation || focusedConstellation === "all") {
      return;
    }
    setZoomLevel((current) => Number(Math.min(current, 0.44).toFixed(2)));
  }, [focusedConstellation, trackConstellation]);

  function updateObserver(key, value) {
    setObserver((current) => ({
      ...current,
      [key]: Number(value),
      label: language === "ko" ? "사용자 위치" : "Custom observer"
    }));
  }

  function requestLocation() {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition((position) => {
      setObserver({
        latitude: Number(position.coords.latitude.toFixed(4)),
        longitude: Number(position.coords.longitude.toFixed(4)),
        label: language === "ko" ? "현재 위치" : "Live location"
      });
    });
  }

  function selectTarget(target) {
    if (currentPage === "sketch" && target?.kind?.startsWith("custom-")) {
      if (creativeTool === "delete") {
        removeCustomObject(target);
        return;
      }
      setSelectedTarget(target);
      return;
    }

    if (currentPage === "watch" && viewMode === "space") {
      return;
    }

    setSelectedTarget(target);

    if (target?.kind === "star") {
      const star = sceneState.data?.stars.find((item) => item.id === target.id);
      if (star?.constellation) {
        setFocusedConstellation(star.constellation);
      }
    }
  }

  function startNewSketch() {
    const nextScene = createBlankSpaceScene();
    setActiveSketchId("draft");
    setCustomSpace(nextScene);
    setSelectedTarget(null);
    setSketchName("");
  }

  function clearDraftSketch() {
    setCustomSpace((current) => ({
      ...current,
      stars: [],
      planets: [],
      constellations: current.constellations.map((constellation) => ({ ...constellation, starIds: [] }))
    }));
    setSelectedTarget(null);
  }

  function saveDraftSketch() {
    if (customSpace.stars.length === 0 && customSpace.planets.length === 0) {
      return;
    }

    const name = sketchName.trim() || `${dictionary.viewer.savedSketch} ${savedSketches.length + 1}`;
    const sketchId = customSpace.id.startsWith("space-") ? customSpace.id : `space-${Date.now()}`;
    const nextSketch = { ...customSpace, id: sketchId, name };
    setSavedSketches((current) => [nextSketch, ...current.filter((sketch) => sketch.id !== sketchId)]);
    setActiveSketchId(sketchId);
    setSketchName("");
  }

  function loadSketch(sketchId) {
    const sketch = savedSketches.find((item) => item.id === sketchId);
    if (!sketch) {
      return;
    }
    setCustomSpace(sketch);
    setActiveSketchId(sketch.id);
    setSketchName(sketch.name);
    setSelectedTarget(null);
  }

  function removeSketch(sketchId) {
    setSavedSketches((current) => current.filter((sketch) => sketch.id !== sketchId));
    if (activeSketchId === sketchId) {
      setActiveSketchId("draft");
    }
  }

  function addCustomConstellation() {
    const nextId = `constellation-${Date.now()}`;
    setCustomSpace((current) => ({
      ...current,
      activeConstellationId: nextId,
      constellations: [
        ...current.constellations,
        {
          id: nextId,
          name: `${dictionary.viewer.customConstellation} ${current.constellations.length + 1}`,
          color: ["#ffcf70", "#7fdbc9", "#a7c7ff", "#f095b8"][current.constellations.length % 4],
          starIds: [],
          segments: []
        }
      ]
    }));
  }

  function transformActiveConstellation(transformer) {
    const constellationId = customSpace.activeConstellationId || customSpace.constellations[0]?.id;
    if (!constellationId) {
      return;
    }

    setCustomSpace((current) => ({
      ...current,
      stars: current.stars.map((star) => (star.constellationId === constellationId ? transformer(star) : star))
    }));
  }

  function nudgeActiveConstellation(deltaX, deltaY) {
    transformActiveConstellation((star) => ({
      ...star,
      x: clampCoordinate(star.x + deltaX),
      y: clampCoordinate(star.y + deltaY)
    }));
  }

  function scaleActiveConstellation(scaleDelta) {
    if (!activeConstellationCenter) {
      return;
    }

    transformActiveConstellation((star) => ({
      ...star,
      x: clampCoordinate(activeConstellationCenter.x + (star.x - activeConstellationCenter.x) * scaleDelta),
      y: clampCoordinate(activeConstellationCenter.y + (star.y - activeConstellationCenter.y) * scaleDelta),
      z: clampCoordinate(activeConstellationCenter.z + (star.z - activeConstellationCenter.z) * scaleDelta, -16, 4)
    }));
  }

  function spreadActiveConstellation(spreadDelta) {
    if (!activeConstellationCenter) {
      return;
    }

    transformActiveConstellation((star) => ({
      ...star,
      x: clampCoordinate(activeConstellationCenter.x + (star.x - activeConstellationCenter.x) * spreadDelta),
      y: clampCoordinate(activeConstellationCenter.y + (star.y - activeConstellationCenter.y) * spreadDelta)
    }));
  }

  function rotateActiveConstellation(angleDegrees) {
    if (!activeConstellationCenter) {
      return;
    }

    const angle = (angleDegrees * Math.PI) / 180;
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);

    transformActiveConstellation((star) => {
      const offsetX = star.x - activeConstellationCenter.x;
      const offsetY = star.y - activeConstellationCenter.y;
      return {
        ...star,
        x: clampCoordinate(activeConstellationCenter.x + offsetX * cosine - offsetY * sine),
        y: clampCoordinate(activeConstellationCenter.y + offsetX * sine + offsetY * cosine)
      };
    });
  }

  function importPresetConstellation() {
    if (!presetConstellationName || !sceneState.data) {
      return;
    }

    const sourceStars = sceneState.data.stars
      .filter((star) => star.constellation === presetConstellationName && star.visible)
      .sort((left, right) => left.magnitude - right.magnitude);

    if (sourceStars.length < 2) {
      return;
    }

    const constellationId = `constellation-${Date.now()}`;
    const offsetX = customSpace.constellations.length * 1.2;
    const idMap = new Map();
    const importedStars = sourceStars.map((star, index) => {
      const starId = `star-${Date.now()}-${index}`;
      idMap.set(star.id, starId);
      return {
        id: starId,
        name: star.name,
        x: Number((star.x + offsetX).toFixed(3)),
        y: Number(star.y.toFixed(3)),
        z: Number(star.z.toFixed(3)),
        size: Number(Math.max(0.95, Math.min(2.2, star.size * 3.4)).toFixed(2)),
        color: star.color,
        constellationId
      };
    });

    const importedSegments = sceneState.data.lines
      .filter((line) => idMap.has(line.from) && idMap.has(line.to))
      .map((line) => [idMap.get(line.from), idMap.get(line.to)]);

    setCustomSpace((current) => ({
      ...current,
      activeConstellationId: constellationId,
      stars: [...current.stars, ...importedStars],
      constellations: [
        ...current.constellations,
        {
          id: constellationId,
          name: dictionary.constellations?.[presetConstellationName]?.[language] || presetConstellationName,
          color: "#ffcf70",
          starIds: importedStars.map((star) => star.id),
          segments: importedSegments
        }
      ]
    }));
    setSelectedTarget({ kind: "custom-star", id: importedStars[0].id });
  }

  function updateActiveConstellationName(name) {
    setCustomSpace((current) => ({
      ...current,
      constellations: current.constellations.map((constellation) =>
        constellation.id === current.activeConstellationId ? { ...constellation, name } : constellation
      )
    }));
  }

  function addCustomObject(point) {
    if (currentPage !== "sketch") {
      return;
    }

    if (creativeTool === "star") {
      const starId = `star-${Date.now()}`;
      const constellationId = customSpace.activeConstellationId || customSpace.constellations[0]?.id;
      const star = {
        id: starId,
        name: `${dictionary.viewer.customStar} ${customSpace.stars.length + 1}`,
        x: Number(point.x.toFixed(3)),
        y: Number(point.y.toFixed(3)),
        z: Number(point.z.toFixed(3)),
        size: 1.25 + (customSpace.stars.length % 4) * 0.22,
        color: ["#fff3c8", "#dbe8ff", "#ffe0b5", "#bfefff"][customSpace.stars.length % 4],
        constellationId
      };

      setCustomSpace((current) => ({
        ...current,
        stars: [...current.stars, star],
        constellations: current.constellations.map((constellation) =>
          constellation.id === constellationId ? { ...constellation, starIds: [...constellation.starIds, starId] } : constellation
        )
      }));
      setSelectedTarget({ kind: "custom-star", id: starId });
      return;
    }

    if (creativeTool === "planet") {
      const preset = planetPresets.find((item) => item.id === planetPreset) || planetPresets[0];
      const planetId = `planet-${Date.now()}`;
      const planet = {
        id: planetId,
        name: `${dictionary.viewer.customPlanet} ${customSpace.planets.length + 1}`,
        x: Number(point.x.toFixed(3)),
        y: Number(point.y.toFixed(3)),
        z: Number(point.z.toFixed(3)),
        size: 1.6 + (customSpace.planets.length % 3) * 0.34,
        color: preset.color,
        ring: preset.ring
      };

      setCustomSpace((current) => ({ ...current, planets: [...current.planets, planet] }));
      setSelectedTarget({ kind: "custom-planet", id: planetId });
    }
  }

  function removeCustomObject(target) {
    setCustomSpace((current) => {
      if (target.kind === "custom-star") {
        return {
          ...current,
          stars: current.stars.filter((star) => star.id !== target.id),
          constellations: current.constellations.map((constellation) => ({
            ...constellation,
            starIds: constellation.starIds.filter((starId) => starId !== target.id),
            segments: (constellation.segments || []).filter((segment) => !segment.includes(target.id))
          }))
        };
      }

      if (target.kind === "custom-planet") {
        return {
          ...current,
          planets: current.planets.filter((planet) => planet.id !== target.id)
        };
      }

      return current;
    });
    setSelectedTarget(null);
  }

  function updateCustomObject(target, patch) {
    if (!target?.kind) {
      return;
    }

    setCustomSpace((current) => {
      if (target.kind === "custom-star") {
        return {
          ...current,
          stars: current.stars.map((star) => (star.id === target.id ? { ...star, ...patch } : star))
        };
      }

      if (target.kind === "custom-planet") {
        return {
          ...current,
          planets: current.planets.map((planet) => (planet.id === target.id ? { ...planet, ...patch } : planet))
        };
      }

      return current;
    });
  }

  async function toggleFullscreen() {
    if (!viewerRef.current) {
      return;
    }

    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    await viewerRef.current.requestFullscreen();
  }

  function stopAmbientSound({ remember = true } = {}) {
    ambientRetryTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    ambientRetryTimersRef.current = [];
    if (ambientWatchdogRef.current.frame) {
      window.cancelAnimationFrame(ambientWatchdogRef.current.frame);
      ambientWatchdogRef.current.frame = 0;
    }
    if (ambientSoundRef.current) {
      ambientSoundRef.current.stop();
      ambientSoundRef.current = null;
    }

    setAmbientEnabled(false);
    if (remember) {
      ambientPreferenceRef.current = false;
      window.localStorage.setItem(AMBIENT_STORAGE_KEY, "off");
    }
  }

  function kickAmbientWatchdog(durationMs = 12000) {
    if (!ambientPreferenceRef.current) {
      return;
    }

    const now = performance.now();
    ambientWatchdogRef.current.until = Math.max(ambientWatchdogRef.current.until, now + durationMs);

    if (ambientWatchdogRef.current.frame) {
      return;
    }

    const tick = async (timestamp) => {
      if (!ambientPreferenceRef.current) {
        ambientWatchdogRef.current.frame = 0;
        return;
      }

      if (timestamp > ambientWatchdogRef.current.until) {
        ambientWatchdogRef.current.frame = 0;
        return;
      }

      const soundscape = ambientSoundRef.current;
      const isRunning = soundscape?.context?.state === "running";

      if (!isRunning && timestamp - ambientWatchdogRef.current.lastAttempt > 700) {
        ambientWatchdogRef.current.lastAttempt = timestamp;
        try {
          await ensureAmbientSound();
        } catch {
          // Keep retrying until the watchdog window ends.
        }
      } else if (isRunning) {
        soundscape.setVolume(ambientVolumeRef.current);
        setAmbientEnabled(true);
      }

      ambientWatchdogRef.current.frame = window.requestAnimationFrame(tick);
    };

    ambientWatchdogRef.current.frame = window.requestAnimationFrame(tick);
  }

  async function ensureAmbientSound() {
    if (!ambientPreferenceRef.current || ambientRestartingRef.current) {
      return false;
    }

    if (ambientSoundRef.current?.context?.state === "running") {
      ambientSoundRef.current.setVolume(ambientVolumeRef.current);
      setAmbientEnabled(true);
      kickAmbientWatchdog(8000);
      return true;
    }

    ambientRestartingRef.current = true;
    try {
      return await startAmbientSound({ remember: false });
    } finally {
      ambientRestartingRef.current = false;
    }
  }

  async function startAmbientSound({ remember = true } = {}) {
    ambientPreferenceRef.current = true;
    setAmbientEnabled(true);

    if (ambientSoundRef.current) {
      try {
        if (ambientSoundRef.current.context.state === "suspended") {
          await ambientSoundRef.current.context.resume();
        }
        if (ambientSoundRef.current.context.state === "running") {
          setAmbientEnabled(true);
          if (remember) {
            window.localStorage.setItem(AMBIENT_STORAGE_KEY, "on");
          }
          return true;
        }
      } catch (error) {
        console.warn("Restarting ambient audio after a suspended context:", error);
      }

      ambientSoundRef.current.stop();
      ambientSoundRef.current = null;
      setAmbientEnabled(false);
    }

    const soundscape = createAmbientSoundscape(ambientVolume);
    if (!soundscape) {
      return false;
    }

    ambientSoundRef.current = soundscape;
    soundscape.context.onstatechange = () => {
      if (soundscape.context.state !== "running") {
        setAmbientEnabled(false);
      }
      if (ambientPreferenceRef.current && soundscape.context.state !== "closed") {
        kickAmbientWatchdog(18000);
        window.setTimeout(() => {
          ensureAmbientSound().catch(() => {});
        }, 180);
      }
    };
    try {
      await soundscape.context.resume();
      if (soundscape.context.state !== "running") {
        throw new Error(`Audio context stayed ${soundscape.context.state}`);
      }
      soundscape.setVolume(ambientVolumeRef.current);
      setAmbientEnabled(true);
      window.localStorage.setItem(AMBIENT_STORAGE_KEY, "on");
      kickAmbientWatchdog(18000);
      return true;
    } catch (error) {
      console.warn("Ambient audio is waiting for a user gesture:", error);
      soundscape.stop();
      ambientSoundRef.current = null;
      setAmbientEnabled(false);
      return false;
    }
  }

  async function toggleAmbientSound() {
    if (ambientSoundRef.current) {
      stopAmbientSound();
      return;
    }

    await startAmbientSound();
  }

  function handleViewerWakeAmbient() {
    if (!ambientPreferenceRef.current) {
      ambientPreferenceRef.current = true;
      window.localStorage.setItem(AMBIENT_STORAGE_KEY, "on");
    }
    kickAmbientWatchdog(18000);
    ensureAmbientSound().catch(() => {});
  }

  function shiftTime(hours) {
    setObservedAt((current) => shiftObservedTimestamp(current, hours));
  }

  function changeZoom(delta) {
    setZoomLevel((current) => Math.min(1, Math.max(0, Number((current + delta).toFixed(2)))));
  }

  return (
    <div className="planetarium-app">
      <header className="topbar">
        <div>
          <p className="eyebrow">{dictionary.viewer.eyebrow}</p>
          <h1>{dictionary.viewer.title}</h1>
          <p className="topbar-copy">{dictionary.viewer.subtitle}</p>
        </div>
        <div className="topbar-controls">
          <div className="page-switcher" aria-label={dictionary.viewer.pageMode}>
            <button type="button" aria-pressed={currentPage === "watch"} onClick={() => setCurrentPage("watch")}>
              {dictionary.viewer.pages.watch}
            </button>
            <button type="button" aria-pressed={currentPage === "sketch"} onClick={() => setCurrentPage("sketch")}>
              {dictionary.viewer.pages.sketch}
            </button>
          </div>
          <div className="language-switcher" aria-label="Language">
            <button type="button" aria-pressed={language === "en"} onClick={() => setLanguage("en")}>
              EN
            </button>
            <button type="button" aria-pressed={language === "ko"} onClick={() => setLanguage("ko")}>
              KR
            </button>
          </div>
        <div className="observer-pill">
          <span>{dictionary.viewer.observer}</span>
          <strong>{observer.label}</strong>
          <small>
            {observer.latitude.toFixed(2)}, {observer.longitude.toFixed(2)}
          </small>
        </div>
        </div>
      </header>

      <div className="workspace">
        <aside className="control-panel">
          <section>
            <p className="eyebrow">{currentPage === "watch" ? dictionary.viewer.controls : dictionary.viewer.sketchControls}</p>
            {currentPage === "watch" ? (
              <>
                <label className="stacked-field">
                  <span>{dictionary.viewer.observedAt}</span>
                  <input type="datetime-local" value={observedAt} onChange={(event) => setObservedAt(event.target.value)} />
                </label>
                <div className="time-jump-row">
                  <button type="button" className="focus-chip" onClick={() => shiftTime(-3)}>
                    {dictionary.viewer.timeJump.back}
                  </button>
                  <button type="button" className="focus-chip" onClick={() => setObservedAt((current) => setTonightTimestamp(current))}>
                    {dictionary.viewer.timeJump.tonight}
                  </button>
                  <button type="button" className="focus-chip" onClick={() => shiftTime(3)}>
                    {dictionary.viewer.timeJump.forward}
                  </button>
                </div>
                {viewMode === "observer" ? (
                  <>
                    <div className="observer-moment-card">
                      <strong>{language === "ko" ? "현재 관측 시각" : "Observer time"}</strong>
                      <span>{observerMomentLabel}</span>
                      <small>{language === "ko" ? "시간을 바꾸면 지평선 위 별자리 위치가 함께 이동합니다." : "Changing the time shifts where constellations sit above the horizon."}</small>
                    </div>
                    <div className="constellation-list focus-list">
                      <button type="button" className="focus-chip" onClick={() => setObservedAt((current) => setObserverHourTimestamp(current, 21))}>
                        {language === "ko" ? "초저녁 21:00" : "9 PM"}
                      </button>
                      <button type="button" className="focus-chip" onClick={() => setObservedAt((current) => setObserverHourTimestamp(current, 0))}>
                        {language === "ko" ? "한밤중 00:00" : "12 AM"}
                      </button>
                      <button type="button" className="focus-chip" onClick={() => setObservedAt((current) => setObserverHourTimestamp(current, 3))}>
                        {language === "ko" ? "새벽 03:00" : "3 AM"}
                      </button>
                    </div>
                  </>
                ) : null}
                <div className="field-grid">
                  <label>
                    <span>{dictionary.viewer.latitude}</span>
                    <input
                      type="number"
                      min="-90"
                      max="90"
                      step="0.01"
                      value={observer.latitude}
                      onChange={(event) => updateObserver("latitude", event.target.value)}
                    />
                  </label>
                  <label>
                    <span>{dictionary.viewer.longitude}</span>
                    <input
                      type="number"
                      min="-180"
                      max="180"
                      step="0.01"
                      value={observer.longitude}
                      onChange={(event) => updateObserver("longitude", event.target.value)}
                    />
                  </label>
                </div>
                <button className="primary-button" type="button" onClick={requestLocation}>
                  {dictionary.viewer.useLocation}
                </button>
              </>
            ) : (
              <>
                <p className="eyebrow">{dictionary.viewer.viewModeLabel}</p>
                <div className="constellation-list focus-list">
                  {VIEW_MODE_ORDER.map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      className={`focus-chip ${viewMode === mode ? "is-active" : ""}`}
                      onClick={() => setViewMode(mode)}
                    >
                      {dictionary.viewer.viewModes[mode]}
                    </button>
                  ))}
                </div>
                <p className="helper-copy">{sketchViewDescription}</p>
              </>
            )}
          </section>

          {currentPage === "watch" ? (
            <>
              <section>
                <p className="eyebrow">{dictionary.viewer.viewModeLabel}</p>
                <div className="constellation-list focus-list">
                  {VIEW_MODE_ORDER.map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      className={`focus-chip ${viewMode === mode ? "is-active" : ""}`}
                      onClick={() => setViewMode(mode)}
                    >
                      {dictionary.viewer.viewModes[mode]}
                    </button>
                  ))}
                </div>
                <p className="helper-copy">{dictionary.viewer.viewModeDescriptions[viewMode]}</p>
              </section>
              <section>
                <p className="eyebrow">{dictionary.viewer.constellationFocus}</p>
                <label className="stacked-field">
                  <span>{dictionary.viewer.searchConstellation}</span>
                  <input
                    type="text"
                    value={constellationSearch}
                    placeholder={dictionary.viewer.searchPlaceholder}
                    onChange={(event) => setConstellationSearch(event.target.value)}
                  />
                </label>
                <label className="stacked-field">
                  <span>{dictionary.viewer.focusConstellation}</span>
                  <select value={focusedConstellation} onChange={(event) => setFocusedConstellation(event.target.value)}>
                    <option value="all">{dictionary.viewer.allSky}</option>
                    {(filteredConstellations.length ? filteredConstellations : visibleConstellations).map((name) => (
                      <option key={name} value={name}>
                        {dictionary.constellations?.[name]?.[language] || name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="toggle-item">
                  <input
                    type="checkbox"
                    checked={trackConstellation}
                    disabled={focusedConstellation === "all"}
                    onChange={(event) => setTrackConstellation(event.target.checked)}
                  />
                  <span>{dictionary.viewer.trackConstellation}</span>
                </label>
                {focusedConstellation !== "all" ? (
                  <button
                    type="button"
                    className="focus-chip"
                    onClick={() => {
                      setFocusedConstellation("all");
                      setTrackConstellation(false);
                    }}
                  >
                    {language === "ko" ? "선택 해제" : "Clear selection"}
                  </button>
                ) : null}
                <div className="constellation-list focus-list">
                  <button
                    type="button"
                    className={`focus-chip ${focusedConstellation === "all" ? "is-active" : ""}`}
                    onClick={() => setFocusedConstellation("all")}
                  >
                    {dictionary.viewer.allSky}
                  </button>
                  {filteredConstellations.slice(0, 10).map((name) => (
                    <button
                      key={name}
                      type="button"
                      className={`focus-chip ${focusedConstellation === name ? "is-active" : ""}`}
                      onClick={() => setFocusedConstellation(name)}
                    >
                      {dictionary.constellations?.[name]?.[language] || name}
                    </button>
                  ))}
                </div>
              </section>
              <section className="story-card">
                <p className="eyebrow">{dictionary.viewer.tonightMood}</p>
                <h2>{activeConstellationName || dictionary.viewer.allSky}</h2>
                <p>{activeConstellationStory}</p>
              </section>
            </>
          ) : (
            <section>
              <p className="eyebrow">{dictionary.viewer.sketchLab}</p>
              <div className="toggle-grid">
                <button type="button" className={`focus-chip ${creativeTool === "star" ? "is-active" : ""}`} onClick={() => setCreativeTool("star")}>
                  {dictionary.viewer.addStarTool}
                </button>
                <button type="button" className={`focus-chip ${creativeTool === "planet" ? "is-active" : ""}`} onClick={() => setCreativeTool("planet")}>
                  {dictionary.viewer.addPlanetTool}
                </button>
                <button type="button" className={`focus-chip ${creativeTool === "delete" ? "is-active" : ""}`} onClick={() => setCreativeTool("delete")}>
                  {dictionary.viewer.deleteTool}
                </button>
                <button type="button" className="focus-chip" onClick={addCustomConstellation}>
                  {dictionary.viewer.addConstellation}
                </button>
              </div>
              <label className="stacked-field">
                <span>{dictionary.viewer.activeConstellation}</span>
                <select
                  value={customSpace.activeConstellationId}
                  onChange={(event) => setCustomSpace((current) => ({ ...current, activeConstellationId: event.target.value }))}
                >
                  {customSpace.constellations.map((constellation) => (
                    <option key={constellation.id} value={constellation.id}>
                      {constellation.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="stacked-field">
                <span>{dictionary.viewer.presetConstellation}</span>
                <select value={presetConstellationName} onChange={(event) => setPresetConstellationName(event.target.value)} disabled={visibleConstellations.length === 0}>
                  {visibleConstellations.length === 0 ? (
                    <option value="">{dictionary.viewer.noPresetConstellations}</option>
                  ) : (
                    visibleConstellations.map((name) => (
                      <option key={name} value={name}>
                        {dictionary.constellations?.[name]?.[language] || name}
                      </option>
                    ))
                  )}
                </select>
              </label>
              <button type="button" className="focus-chip" onClick={importPresetConstellation} disabled={!presetConstellationName}>
                {dictionary.viewer.importConstellation}
              </button>
              <div className="toggle-grid">
                <button
                  type="button"
                  className="focus-chip"
                  onClick={() => nudgeActiveConstellation(-0.7, 0)}
                  disabled={!activeCustomConstellationStars.length}
                >
                  {dictionary.viewer.arrange.left}
                </button>
                <button
                  type="button"
                  className="focus-chip"
                  onClick={() => nudgeActiveConstellation(0.7, 0)}
                  disabled={!activeCustomConstellationStars.length}
                >
                  {dictionary.viewer.arrange.right}
                </button>
                <button
                  type="button"
                  className="focus-chip"
                  onClick={() => nudgeActiveConstellation(0, 0.7)}
                  disabled={!activeCustomConstellationStars.length}
                >
                  {dictionary.viewer.arrange.up}
                </button>
                <button
                  type="button"
                  className="focus-chip"
                  onClick={() => nudgeActiveConstellation(0, -0.7)}
                  disabled={!activeCustomConstellationStars.length}
                >
                  {dictionary.viewer.arrange.down}
                </button>
                <button
                  type="button"
                  className="focus-chip"
                  onClick={() => scaleActiveConstellation(1.14)}
                  disabled={activeCustomConstellationStars.length < 2}
                >
                  {dictionary.viewer.arrange.bigger}
                </button>
                <button
                  type="button"
                  className="focus-chip"
                  onClick={() => scaleActiveConstellation(0.88)}
                  disabled={activeCustomConstellationStars.length < 2}
                >
                  {dictionary.viewer.arrange.smaller}
                </button>
                <button
                  type="button"
                  className="focus-chip"
                  onClick={() => spreadActiveConstellation(1.12)}
                  disabled={activeCustomConstellationStars.length < 2}
                >
                  {dictionary.viewer.arrange.spread}
                </button>
                <button
                  type="button"
                  className="focus-chip"
                  onClick={() => spreadActiveConstellation(0.9)}
                  disabled={activeCustomConstellationStars.length < 2}
                >
                  {dictionary.viewer.arrange.tighten}
                </button>
                <button
                  type="button"
                  className="focus-chip"
                  onClick={() => rotateActiveConstellation(-12)}
                  disabled={activeCustomConstellationStars.length < 2}
                >
                  {dictionary.viewer.arrange.rotateLeft}
                </button>
                <button
                  type="button"
                  className="focus-chip"
                  onClick={() => rotateActiveConstellation(12)}
                  disabled={activeCustomConstellationStars.length < 2}
                >
                  {dictionary.viewer.arrange.rotateRight}
                </button>
              </div>
              <label className="stacked-field">
                <span>{dictionary.viewer.constellationName}</span>
                <input
                  type="text"
                  value={activeCustomConstellation?.name || ""}
                  onChange={(event) => updateActiveConstellationName(event.target.value)}
                />
              </label>
              <label className="stacked-field">
                <span>{dictionary.viewer.planetStyle}</span>
                <select value={planetPreset} onChange={(event) => setPlanetPreset(event.target.value)} disabled={creativeTool !== "planet"}>
                  {planetPresets.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {dictionary.viewer.planetPresets[preset.id]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="stacked-field">
                <span>{dictionary.viewer.sketchName}</span>
                <input
                  type="text"
                  value={sketchName}
                  placeholder={dictionary.viewer.sketchPlaceholder}
                  onChange={(event) => setSketchName(event.target.value)}
                />
              </label>
              <dl className="summary-list compact">
                <div>
                  <dt>{dictionary.viewer.currentSketch}</dt>
                  <dd>{activeSketchName}</dd>
                </div>
                <div>
                  <dt>{dictionary.viewer.activeConstellation}</dt>
                  <dd>{activeCustomConstellation?.name || "--"}</dd>
                </div>
                <div>
                  <dt>{dictionary.viewer.customStars}</dt>
                  <dd>{customSpace.stars.length}</dd>
                </div>
                <div>
                  <dt>{dictionary.viewer.customPlanets}</dt>
                  <dd>{customSpace.planets.length}</dd>
                </div>
              </dl>
              <div className="constellation-list">
                <button type="button" className="focus-chip" onClick={startNewSketch}>
                  {dictionary.viewer.newSketch}
                </button>
                <button type="button" className="focus-chip" onClick={clearDraftSketch} disabled={customSpace.stars.length === 0 && customSpace.planets.length === 0}>
                  {dictionary.viewer.clearSketch}
                </button>
                <button type="button" className="focus-chip is-active" onClick={saveDraftSketch} disabled={customSpace.stars.length === 0 && customSpace.planets.length === 0}>
                  {dictionary.viewer.saveSketch}
                </button>
              </div>
              <p className="helper-copy">{dictionary.viewer.sketchHint}</p>
            </section>
          )}

          <section>
            <p className="eyebrow">{dictionary.viewer.atmosphere}</p>
            {currentPage === "watch" ? (
              <>
                <label className="stacked-field">
                  <span>
                    {dictionary.viewer.atmosphereDensity}: {Math.round(atmosphereStrength * 100)}%
                  </span>
                  <input
                    type="range"
                    min="0.2"
                    max="1"
                    step="0.05"
                    value={atmosphereStrength}
                    onChange={(event) => setAtmosphereStrength(Number(event.target.value))}
                  />
                </label>
                <label className="stacked-field">
                  <span>
                    {dictionary.viewer.starGlow}: {Math.round(starGlowStrength * 100)}%
                  </span>
                  <input
                    type="range"
                    min="0.2"
                    max="1"
                    step="0.05"
                    value={starGlowStrength}
                    onChange={(event) => setStarGlowStrength(Number(event.target.value))}
                  />
                </label>
                <label className="stacked-field">
                  <span>
                    {dictionary.viewer.limitingMagnitude}: {limitingMagnitude.toFixed(1)}
                  </span>
                  <input
                    type="range"
                    min="3"
                    max="6"
                    step="0.1"
                    value={limitingMagnitude}
                    onChange={(event) => setLimitingMagnitude(Number(event.target.value))}
                  />
                </label>
                <label className="stacked-field">
                  <span>
                    {dictionary.viewer.maxStars}: {maxStars.toLocaleString()}
                  </span>
                  <input
                    type="range"
                    min="1800"
                    max="6000"
                    step="200"
                    value={maxStars}
                    onChange={(event) => setMaxStars(Number(event.target.value))}
                  />
                </label>
              </>
            ) : (
              <p className="helper-copy">{dictionary.viewer.creationPickHint}</p>
            )}
            <div className="toggle-grid">
              {currentPage === "watch" ? (
                <label className="toggle-item">
                  <input
                    type="checkbox"
                    checked={showConstellations}
                    onChange={(event) => setShowConstellations(event.target.checked)}
                  />
                  <span>{dictionary.viewer.toggles.constellations}</span>
                </label>
              ) : null}
              <label className="toggle-item">
                <input type="checkbox" checked={showLabels} onChange={(event) => setShowLabels(event.target.checked)} />
                <span>{dictionary.viewer.toggles.labels}</span>
              </label>
              <label className="toggle-item">
                <input type="checkbox" checked={autoRotate} onChange={(event) => setAutoRotate(event.target.checked)} />
                <span>{dictionary.viewer.toggles.autoRotate}</span>
              </label>
              <label className="toggle-item">
                <input type="checkbox" checked={showGuides} onChange={(event) => setShowGuides(event.target.checked)} />
                <span>{dictionary.viewer.toggles.guides}</span>
              </label>
            </div>
          </section>
        </aside>

        <main
          ref={viewerRef}
          className={`viewer ${isFullscreen ? "is-fullscreen" : ""}`}
          onClickCapture={handleViewerWakeAmbient}
          onWheelCapture={handleViewerWakeAmbient}
          onPointerDownCapture={handleViewerWakeAmbient}
          onTouchStartCapture={handleViewerWakeAmbient}
        >
          <PlanetariumCanvas
            scene={sceneState.data}
            selectedTarget={selectedTarget}
            onSelectTarget={selectTarget}
            language={language}
            dictionary={dictionary}
            showLabels={showLabels}
            showGuides={showGuides}
            showConstellations={showConstellations}
            autoRotate={autoRotate}
            atmosphereStrength={atmosphereStrength}
            starGlowStrength={starGlowStrength}
            viewMode={viewMode}
            zoomLevel={zoomLevel}
            focusedConstellation={currentPage === "watch" ? focusedConstellation : "all"}
            trackConstellation={currentPage === "watch" ? trackConstellation : false}
            drawMode={currentPage === "sketch"}
            customSketchStarIds={[]}
            creativeMode={currentPage === "sketch"}
            customSpace={customSpace}
            creativeTool={creativeTool}
            onCreativeSpaceClick={addCustomObject}
          />
          {currentPage === "watch" ? (
            <div className="viewer-focus-overlay">
              <label className="overlay-focus-field">
                <span>{dictionary.viewer.searchConstellation}</span>
                <input
                  type="text"
                  value={constellationSearch}
                  placeholder={dictionary.viewer.searchPlaceholder}
                  onChange={(event) => setConstellationSearch(event.target.value)}
                />
              </label>
              <label className="overlay-focus-field">
                <span>{dictionary.viewer.focusConstellation}</span>
                <select value={focusedConstellation} onChange={(event) => setFocusedConstellation(event.target.value)}>
                  <option value="all">{dictionary.viewer.allSky}</option>
                  {(filteredConstellations.length ? filteredConstellations : visibleConstellations).map((name) => (
                    <option key={name} value={name}>
                      {dictionary.constellations?.[name]?.[language] || name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="overlay-track-toggle">
                <input
                  type="checkbox"
                  checked={trackConstellation}
                  disabled={focusedConstellation === "all"}
                  onChange={(event) => setTrackConstellation(event.target.checked)}
                />
                <span>{dictionary.viewer.trackConstellation}</span>
              </label>
              {focusedConstellation !== "all" ? (
                <button
                  type="button"
                  className="overlay-button"
                  onClick={() => {
                    setFocusedConstellation("all");
                    setTrackConstellation(false);
                  }}
                >
                  {language === "ko" ? "선택 해제" : "Clear selection"}
                </button>
              ) : null}
              <label className="overlay-zoom">
                <span>{dictionary.viewer.zoom}</span>
                <div className="overlay-zoom-controls">
                  <button type="button" className="overlay-button" onClick={() => changeZoom(-0.1)}>
                    {dictionary.viewer.zoomOut}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={zoomLevel}
                    aria-label={dictionary.viewer.zoom}
                    onChange={(event) => setZoomLevel(Number(event.target.value))}
                  />
                  <button type="button" className="overlay-button" onClick={() => changeZoom(0.1)}>
                    {dictionary.viewer.zoomIn}
                  </button>
                </div>
              </label>
            </div>
          ) : null}
          <div className="viewer-overlay">
            <label className="overlay-volume">
              <span>{dictionary.viewer.ambient.volumeShort}</span>
              <input
                type="range"
                min="0.35"
                max="1"
                step="0.05"
                value={ambientVolume}
                aria-label={dictionary.viewer.ambient.volume}
                onChange={(event) => setAmbientVolume(Number(event.target.value))}
              />
              <strong>{Math.round(ambientVolume * 100)}%</strong>
            </label>
            <button type="button" className="overlay-button" onClick={toggleFullscreen}>
              {isFullscreen ? dictionary.viewer.exitFullscreen : dictionary.viewer.enterFullscreen}
            </button>
            <button type="button" className={`overlay-button ${ambientEnabled ? "is-active" : ""}`} onClick={toggleAmbientSound}>
              {ambientEnabled ? dictionary.viewer.ambient.off : dictionary.viewer.ambient.on}
            </button>
          </div>
        </main>

        <aside className="inspector-panel">
          <section>
            <p className="eyebrow">{currentPage === "watch" ? dictionary.viewer.starInspector : dictionary.viewer.creationInspector}</p>
            {currentPage === "sketch" && selectedCustomStar ? (
              <>
                <h2>{selectedCustomStar.name}</h2>
                <p className="constellation-copy">{activeCustomConstellation?.name || dictionary.viewer.customConstellation}</p>
                <label className="stacked-field">
                  <span>{dictionary.viewer.objectName}</span>
                  <input
                    type="text"
                    value={selectedCustomStar.name}
                    onChange={(event) => updateCustomObject(selectedTarget, { name: event.target.value })}
                  />
                </label>
                <label className="stacked-field">
                  <span>
                    {dictionary.viewer.objectSize}: {selectedCustomStar.size.toFixed(2)}
                  </span>
                  <input
                    type="range"
                    min="0.7"
                    max="2.8"
                    step="0.05"
                    value={selectedCustomStar.size}
                    onChange={(event) => updateCustomObject(selectedTarget, { size: Number(event.target.value) })}
                  />
                </label>
                <label className="stacked-field">
                  <span>{dictionary.viewer.objectColor}</span>
                  <input type="color" value={selectedCustomStar.color} onChange={(event) => updateCustomObject(selectedTarget, { color: event.target.value })} />
                </label>
                <dl className="summary-list compact">
                  <div>
                    <dt>{dictionary.viewer.type}</dt>
                    <dd>{dictionary.viewer.customStar}</dd>
                  </div>
                  <div>
                    <dt>{dictionary.viewer.belongsTo}</dt>
                    <dd>
                      {customSpace.constellations.find((constellation) => constellation.id === selectedCustomStar.constellationId)?.name ||
                        dictionary.viewer.customConstellation}
                    </dd>
                  </div>
                </dl>
                <button type="button" className="focus-chip" onClick={() => removeCustomObject(selectedTarget)}>
                  {dictionary.viewer.removeObject}
                </button>
              </>
            ) : currentPage === "sketch" && selectedCustomPlanet ? (
              <>
                <h2>{selectedCustomPlanet.name}</h2>
                <p className="constellation-copy">{dictionary.viewer.customPlanet}</p>
                <label className="stacked-field">
                  <span>{dictionary.viewer.objectName}</span>
                  <input
                    type="text"
                    value={selectedCustomPlanet.name}
                    onChange={(event) => updateCustomObject(selectedTarget, { name: event.target.value })}
                  />
                </label>
                <label className="stacked-field">
                  <span>
                    {dictionary.viewer.objectSize}: {selectedCustomPlanet.size.toFixed(2)}
                  </span>
                  <input
                    type="range"
                    min="0.9"
                    max="4"
                    step="0.05"
                    value={selectedCustomPlanet.size}
                    onChange={(event) => updateCustomObject(selectedTarget, { size: Number(event.target.value) })}
                  />
                </label>
                <label className="stacked-field">
                  <span>{dictionary.viewer.objectColor}</span>
                  <input
                    type="color"
                    value={selectedCustomPlanet.color}
                    onChange={(event) => updateCustomObject(selectedTarget, { color: event.target.value })}
                  />
                </label>
                <label className="toggle-item">
                  <input
                    type="checkbox"
                    checked={selectedCustomPlanet.ring}
                    onChange={(event) => updateCustomObject(selectedTarget, { ring: event.target.checked })}
                  />
                  <span>{dictionary.viewer.planetRing}</span>
                </label>
                <dl className="summary-list compact">
                  <div>
                    <dt>{dictionary.viewer.type}</dt>
                    <dd>{selectedCustomPlanet.ring ? dictionary.viewer.ringedPlanet : dictionary.viewer.customPlanet}</dd>
                  </div>
                  <div>
                    <dt>{dictionary.viewer.planetStyle}</dt>
                    <dd>{selectedCustomPlanet.color}</dd>
                  </div>
                </dl>
                <button type="button" className="focus-chip" onClick={() => removeCustomObject(selectedTarget)}>
                  {dictionary.viewer.removeObject}
                </button>
              </>
            ) : currentPage === "watch" && selectedStar ? (
              <>
                <h2>{selectedStar.name}</h2>
                <p className="constellation-copy">
                  {dictionary.constellations?.[selectedStar.constellation]?.[language] || selectedStar.constellation}
                </p>
                <dl className="summary-list compact">
                  <div>
                    <dt>{dictionary.viewer.magnitude}</dt>
                    <dd>{selectedStar.magnitude}</dd>
                  </div>
                  <div>
                    <dt>{dictionary.viewer.altitude}</dt>
                    <dd>{selectedStar.altitude} deg</dd>
                  </div>
                  <div>
                    <dt>{dictionary.viewer.azimuth}</dt>
                    <dd>{selectedStar.azimuth} deg</dd>
                  </div>
                  <div>
                    <dt>{dictionary.viewer.visibility}</dt>
                    <dd>{selectedStar.visible ? dictionary.viewer.aboveHorizon : dictionary.viewer.belowHorizon}</dd>
                  </div>
                </dl>
              </>
            ) : (
              <p className="helper-copy">{currentPage === "watch" ? dictionary.viewer.pickHint : dictionary.viewer.creationPickHint}</p>
            )}
          </section>

          {currentPage === "watch" ? (
            <>
              <section>
                <p className="eyebrow">{dictionary.viewer.constellationsInFrame}</p>
                <div className="constellation-list">
                  {currentViewConstellations.map((name) => (
                    <button
                      key={name}
                      type="button"
                      className={`constellation-pill ${focusedConstellation === name ? "is-active" : ""}`}
                      onClick={() => setFocusedConstellation(name)}
                    >
                      {dictionary.constellations?.[name]?.[language] || name}
                    </button>
                  ))}
                </div>
              </section>
            </>
          ) : (
            <>
              <section>
                <p className="eyebrow">{dictionary.viewer.savedSketches}</p>
                <div className="saved-sketch-list">
                  {savedSketches.length === 0 ? (
                    <p className="helper-copy">{dictionary.viewer.noSavedSketches}</p>
                  ) : (
                    savedSketches.map((sketch) => (
                      <div key={sketch.id} className={`saved-sketch-card ${activeSketchId === sketch.id ? "is-active" : ""}`}>
                        <button type="button" className="saved-sketch-button" onClick={() => loadSketch(sketch.id)}>
                          <strong>{sketch.name}</strong>
                          <small>
                            {sketch.stars.length} {dictionary.viewer.customStars} / {sketch.planets.length} {dictionary.viewer.customPlanets}
                          </small>
                        </button>
                        <button type="button" className="focus-chip" onClick={() => removeSketch(sketch.id)}>
                          {dictionary.viewer.deleteSketch}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </section>
              <section>
                <p className="eyebrow">{dictionary.viewer.sketchTips}</p>
                <div className="constellation-list">
                  <span>{dictionary.viewer.sketchTipsList.pick}</span>
                  <span>{dictionary.viewer.sketchTipsList.order}</span>
                  <span>{dictionary.viewer.sketchTipsList.save}</span>
                </div>
              </section>
            </>
          )}
          <section className="scene-status-section">
            <p className="eyebrow">{dictionary.viewer.sceneStatus}</p>
            <dl className="summary-list compact">
              <div>
                <dt>{dictionary.viewer.status}</dt>
                <dd>{sceneState.status}</dd>
              </div>
              <div>
                <dt>{dictionary.viewer.catalog}</dt>
                <dd>{sceneState.data?.summary.catalog ?? "--"}</dd>
              </div>
              <div>
                <dt>{dictionary.viewer.visibleStars}</dt>
                <dd>{sceneState.data?.summary.visibleStars ?? "--"}</dd>
              </div>
              <div>
                <dt>{dictionary.viewer.visibleConstellations}</dt>
                <dd>{sceneState.data?.summary.visibleConstellations.length ?? "--"}</dd>
              </div>
            </dl>
            {sceneState.error ? <p className="error-copy">{sceneState.error}</p> : null}
          </section>
        </aside>
      </div>
    </div>
  );
}
