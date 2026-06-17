import { useCallback, useEffect, useRef, useState } from "react";

const BREATH_STORAGE_KEY = "zeravue-lagoon-breath-enabled";
const DIVE_STEP_MS = 140;
const FULL_DEPTH_MS = 280000;
const BREATH_CYCLE_MS = 7600;
const EXHALE_AT_MS = 4200;

function getInitialBreathEnabled() {
  return window.localStorage.getItem(BREATH_STORAGE_KEY) === "on";
}

function createNoiseBuffer(context, seconds = 2.2) {
  const length = Math.ceil(context.sampleRate * seconds);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  let previous = 0;
  for (let index = 0; index < data.length; index += 1) {
    const white = Math.random() * 2 - 1;
    previous = previous * 0.985 + white * 0.12;
    data[index] = previous * 0.78;
  }
  return buffer;
}

function playBreathCycle(context, masterGain, noiseBuffer, startedAt) {
  const inhaleNoise = context.createBufferSource();
  inhaleNoise.buffer = noiseBuffer;

  const inhaleFilter = context.createBiquadFilter();
  inhaleFilter.type = "bandpass";
  inhaleFilter.frequency.setValueAtTime(540, startedAt);
  inhaleFilter.Q.value = 0.35;

  const inhaleGain = context.createGain();
  inhaleGain.gain.setValueAtTime(0.0001, startedAt);
  inhaleGain.gain.linearRampToValueAtTime(0.05, startedAt + 1.4);
  inhaleGain.gain.linearRampToValueAtTime(0.018, startedAt + 3.2);
  inhaleGain.gain.exponentialRampToValueAtTime(0.0001, startedAt + 3.9);

  inhaleNoise.connect(inhaleFilter);
  inhaleFilter.connect(inhaleGain);
  inhaleGain.connect(masterGain);
  inhaleNoise.start(startedAt);
  inhaleNoise.stop(startedAt + 4);

  const exhaleNoise = context.createBufferSource();
  exhaleNoise.buffer = noiseBuffer;

  const exhaleFilter = context.createBiquadFilter();
  exhaleFilter.type = "lowpass";
  exhaleFilter.frequency.setValueAtTime(980, startedAt + 4.1);
  exhaleFilter.Q.value = 0.4;

  const exhaleGain = context.createGain();
  exhaleGain.gain.setValueAtTime(0.0001, startedAt + 4.05);
  exhaleGain.gain.linearRampToValueAtTime(0.07, startedAt + 4.55);
  exhaleGain.gain.linearRampToValueAtTime(0.032, startedAt + 5.6);
  exhaleGain.gain.exponentialRampToValueAtTime(0.0001, startedAt + 6.7);

  exhaleNoise.connect(exhaleFilter);
  exhaleFilter.connect(exhaleGain);
  exhaleGain.connect(masterGain);
  exhaleNoise.start(startedAt + 4.05);
  exhaleNoise.stop(startedAt + 6.8);

  for (let index = 0; index < 4; index += 1) {
    const moment = startedAt + 4.26 + index * 0.22;
    const bubble = context.createOscillator();
    const bubbleGain = context.createGain();
    const startFrequency = 180 + index * 32;
    const endFrequency = 440 + index * 40;

    bubble.type = "sine";
    bubble.frequency.setValueAtTime(startFrequency, moment);
    bubble.frequency.exponentialRampToValueAtTime(endFrequency, moment + 0.3);

    bubbleGain.gain.setValueAtTime(0.0001, moment);
    bubbleGain.gain.linearRampToValueAtTime(0.038, moment + 0.04);
    bubbleGain.gain.exponentialRampToValueAtTime(0.0001, moment + 0.34);

    bubble.connect(bubbleGain);
    bubbleGain.connect(masterGain);
    bubble.start(moment);
    bubble.stop(moment + 0.36);
  }
}

export function useLagoonDiveExperience({ active = false } = {}) {
  const [breathEnabled, setBreathEnabled] = useState(getInitialBreathEnabled);
  const [depthProgress, setDepthProgress] = useState(0);
  const [exhalePulse, setExhalePulse] = useState(0);
  const audioContextRef = useRef(null);
  const masterGainRef = useRef(null);
  const noiseBufferRef = useRef(null);
  const cycleTimerRef = useRef(null);
  const exhaleTimerRef = useRef(null);
  const depthTimerRef = useRef(null);

  const stopBreathingAudio = useCallback(() => {
    if (cycleTimerRef.current) {
      window.clearTimeout(cycleTimerRef.current);
      cycleTimerRef.current = null;
    }
    if (exhaleTimerRef.current) {
      window.clearTimeout(exhaleTimerRef.current);
      exhaleTimerRef.current = null;
    }
    if (masterGainRef.current && audioContextRef.current) {
      const now = audioContextRef.current.currentTime;
      masterGainRef.current.gain.cancelScheduledValues(now);
      masterGainRef.current.gain.setTargetAtTime(0.0001, now, 0.18);
    }
  }, []);

  const startBreathingAudio = useCallback(async () => {
    if (!breathEnabled || !active) {
      return;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      return;
    }

    if (!audioContextRef.current) {
      const context = new AudioContextClass();
      const masterGain = context.createGain();
      masterGain.gain.value = 0.0001;
      masterGain.connect(context.destination);
      audioContextRef.current = context;
      masterGainRef.current = masterGain;
      noiseBufferRef.current = createNoiseBuffer(context, 2.4);
    }

    const context = audioContextRef.current;
    const masterGain = masterGainRef.current;
    if (context.state === "suspended") {
      await context.resume();
    }

    const cycle = () => {
      if (!audioContextRef.current || !masterGainRef.current || !noiseBufferRef.current || !breathEnabled || !active) {
        return;
      }

      const currentContext = audioContextRef.current;
      const currentGain = masterGainRef.current;
      const startedAt = currentContext.currentTime + 0.04;
      currentGain.gain.cancelScheduledValues(startedAt);
      currentGain.gain.setTargetAtTime(0.12, startedAt, 0.4);
      playBreathCycle(currentContext, currentGain, noiseBufferRef.current, startedAt);

      exhaleTimerRef.current = window.setTimeout(() => {
        setExhalePulse((value) => value + 1);
      }, EXHALE_AT_MS);

      cycleTimerRef.current = window.setTimeout(cycle, BREATH_CYCLE_MS);
    };

    stopBreathingAudio();
    cycle();
  }, [active, breathEnabled, stopBreathingAudio]);

  const toggleBreathSound = useCallback(async () => {
    const next = !breathEnabled;
    setBreathEnabled(next);
    window.localStorage.setItem(BREATH_STORAGE_KEY, next ? "on" : "off");
    if (!next) {
      stopBreathingAudio();
      return false;
    }
    await startBreathingAudio();
    return true;
  }, [breathEnabled, startBreathingAudio, stopBreathingAudio]);

  useEffect(() => {
    if (!active) {
      stopBreathingAudio();
      setDepthProgress(0);
      if (depthTimerRef.current) {
        window.clearInterval(depthTimerRef.current);
        depthTimerRef.current = null;
      }
      return;
    }

    const step = DIVE_STEP_MS / FULL_DEPTH_MS;
    depthTimerRef.current = window.setInterval(() => {
      setDepthProgress((value) => Math.min(1, value + step));
    }, DIVE_STEP_MS);

    if (breathEnabled) {
      startBreathingAudio().catch(() => {});
    }

    return () => {
      if (depthTimerRef.current) {
        window.clearInterval(depthTimerRef.current);
        depthTimerRef.current = null;
      }
      stopBreathingAudio();
    };
  }, [active, breathEnabled, startBreathingAudio, stopBreathingAudio]);

  return {
    breathEnabled,
    toggleBreathSound,
    depthProgress,
    exhalePulse
  };
}
