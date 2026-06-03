import { useEffect, useRef, useState } from "react";

const THUNDER_SAMPLE_URL = "/audio/monsoon-canopy-thunder.wav";

function createNoiseBuffer(context, duration = 4.8) {
  const frameCount = Math.ceil(context.sampleRate * duration);
  const buffer = context.createBuffer(1, frameCount, context.sampleRate);
  const data = buffer.getChannelData(0);
  let previous = 0;

  for (let index = 0; index < frameCount; index += 1) {
    const white = Math.random() * 2 - 1;
    previous = previous * 0.985 + white * 0.18;
    data[index] = previous;
  }

  return buffer;
}

function playThunderCue(context, intensity = 0.56) {
  const now = context.currentTime;
  const master = context.createGain();
  const rumbleGain = context.createGain();
  const crackGain = context.createGain();
  const snapGain = context.createGain();
  const lowpass = context.createBiquadFilter();
  const highpass = context.createBiquadFilter();
  const noiseSource = context.createBufferSource();
  const snapNoise = context.createBufferSource();
  const snapBand = context.createBiquadFilter();
  const subOsc = context.createOscillator();
  const midOsc = context.createOscillator();
  const snapOsc = context.createOscillator();

  lowpass.type = "lowpass";
  lowpass.frequency.value = 210;
  highpass.type = "highpass";
  highpass.frequency.value = 28;

  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.26 + intensity * 0.12, now + 0.12);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 4.8);

  rumbleGain.gain.setValueAtTime(0.0001, now);
  rumbleGain.gain.exponentialRampToValueAtTime(0.54 + intensity * 0.24, now + 0.22);
  rumbleGain.gain.exponentialRampToValueAtTime(0.0001, now + 4.6);

  crackGain.gain.setValueAtTime(0.0001, now + 0.08);
  crackGain.gain.exponentialRampToValueAtTime(0.16 + intensity * 0.08, now + 0.14);
  crackGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);

  snapGain.gain.setValueAtTime(0.0001, now + 0.06);
  snapGain.gain.exponentialRampToValueAtTime(0.28 + intensity * 0.12, now + 0.11);
  snapGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);

  noiseSource.buffer = createNoiseBuffer(context, 4.8);
  noiseSource.connect(lowpass);
  lowpass.connect(highpass);
  highpass.connect(rumbleGain);

  snapNoise.buffer = createNoiseBuffer(context, 1.2);
  snapBand.type = "bandpass";
  snapBand.frequency.value = 1400;
  snapBand.Q.value = 1.6;
  snapNoise.connect(snapBand);
  snapBand.connect(snapGain);

  subOsc.type = "sine";
  subOsc.frequency.setValueAtTime(52, now);
  subOsc.frequency.exponentialRampToValueAtTime(34, now + 4.6);
  subOsc.connect(rumbleGain);

  midOsc.type = "triangle";
  midOsc.frequency.setValueAtTime(150, now + 0.05);
  midOsc.frequency.exponentialRampToValueAtTime(78, now + 1.2);
  midOsc.connect(crackGain);

  snapOsc.type = "triangle";
  snapOsc.frequency.setValueAtTime(920, now + 0.03);
  snapOsc.frequency.exponentialRampToValueAtTime(480, now + 0.28);
  snapOsc.connect(snapGain);

  rumbleGain.connect(master);
  crackGain.connect(master);
  snapGain.connect(master);
  master.connect(context.destination);

  noiseSource.start(now);
  noiseSource.stop(now + 4.8);
  snapNoise.start(now + 0.02);
  snapNoise.stop(now + 0.42);
  subOsc.start(now);
  subOsc.stop(now + 4.8);
  midOsc.start(now + 0.05);
  midOsc.stop(now + 1.2);
  snapOsc.start(now + 0.03);
  snapOsc.stop(now + 0.3);
}

function playBufferedThunder(context, buffer, intensity = 0.56) {
  const source = context.createBufferSource();
  const master = context.createGain();
  const sampleGain = context.createGain();
  const lowShelf = context.createBiquadFilter();
  const lowPass = context.createBiquadFilter();
  const compressor = context.createDynamicsCompressor();
  const rumbleGain = context.createGain();
  const rumbleLowPass = context.createBiquadFilter();
  const rumbleNoise = context.createBufferSource();
  const rumbleOsc = context.createOscillator();
  const now = context.currentTime;

  source.buffer = buffer;
  rumbleNoise.buffer = createNoiseBuffer(context, 5.2);

  lowShelf.type = "lowshelf";
  lowShelf.frequency.value = 160;
  lowShelf.gain.value = 5 + intensity * 2.4;

  lowPass.type = "lowpass";
  lowPass.frequency.value = 920 - intensity * 120;
  lowPass.Q.value = 0.5;

  rumbleLowPass.type = "lowpass";
  rumbleLowPass.frequency.value = 140;
  rumbleLowPass.Q.value = 0.4;

  compressor.threshold.value = -22;
  compressor.knee.value = 14;
  compressor.ratio.value = 2.8;
  compressor.attack.value = 0.03;
  compressor.release.value = 0.6;

  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.72 + intensity * 0.28, now + 0.2);
  master.gain.exponentialRampToValueAtTime(0.34 + intensity * 0.16, now + 1.6);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 4.8);

  sampleGain.gain.setValueAtTime(0.0001, now);
  sampleGain.gain.exponentialRampToValueAtTime(0.42 + intensity * 0.18, now + 0.14);
  sampleGain.gain.exponentialRampToValueAtTime(0.18 + intensity * 0.08, now + 0.8);
  sampleGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.6);

  rumbleGain.gain.setValueAtTime(0.0001, now + 0.12);
  rumbleGain.gain.exponentialRampToValueAtTime(0.32 + intensity * 0.22, now + 0.48);
  rumbleGain.gain.exponentialRampToValueAtTime(0.18 + intensity * 0.12, now + 1.8);
  rumbleGain.gain.exponentialRampToValueAtTime(0.0001, now + 5.0);

  rumbleOsc.type = "sine";
  rumbleOsc.frequency.setValueAtTime(58, now + 0.08);
  rumbleOsc.frequency.exponentialRampToValueAtTime(36, now + 4.8);

  source.connect(lowShelf);
  lowShelf.connect(lowPass);
  lowPass.connect(sampleGain);
  sampleGain.connect(compressor);

  rumbleNoise.connect(rumbleLowPass);
  rumbleLowPass.connect(rumbleGain);
  rumbleOsc.connect(rumbleGain);
  rumbleGain.connect(compressor);

  compressor.connect(master);
  master.connect(context.destination);
  source.start();
  rumbleNoise.start(now + 0.06);
  rumbleNoise.stop(now + 5.2);
  rumbleOsc.start(now + 0.08);
  rumbleOsc.stop(now + 4.8);
}

export function useRainThunder({ enabled, audioEnabled, intensity }) {
  const [flashToken, setFlashToken] = useState(0);
  const timerRef = useRef(null);
  const audioContextRef = useRef(null);
  const unlockedRef = useRef(false);
  const thunderBufferRef = useRef(null);

  useEffect(() => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      return undefined;
    }

    const unlock = async () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextClass();
      }

      try {
        if (audioContextRef.current.state === "suspended") {
          await audioContextRef.current.resume();
        }
        unlockedRef.current = audioContextRef.current.state === "running";
        if (unlockedRef.current && !thunderBufferRef.current) {
          const response = await fetch(THUNDER_SAMPLE_URL);
          const arrayBuffer = await response.arrayBuffer();
          thunderBufferRef.current = await audioContextRef.current.decodeAudioData(arrayBuffer.slice(0));
        }
      } catch (error) {
        unlockedRef.current = false;
      }
    };

    window.addEventListener("pointerdown", unlock, { capture: true, passive: true });
    window.addEventListener("touchstart", unlock, { capture: true, passive: true });
    window.addEventListener("keydown", unlock, { capture: true });

    return () => {
      window.removeEventListener("pointerdown", unlock, true);
      window.removeEventListener("touchstart", unlock, true);
      window.removeEventListener("keydown", unlock, true);
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
      return undefined;
    }

    let isFirstCue = true;
    const scheduleNext = () => {
      const delay = isFirstCue ? 1100 + Math.random() * 1700 : 4200 + Math.random() * 4200 - intensity * 900;
      timerRef.current = window.setTimeout(async () => {
        setFlashToken((current) => current + 1);

        if (audioEnabled) {
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          if (AudioContextClass) {
            if (!audioContextRef.current) {
              audioContextRef.current = new AudioContextClass();
            }

            try {
              if (audioContextRef.current.state === "suspended") {
                await audioContextRef.current.resume();
              }
              if (audioContextRef.current.state === "running" || unlockedRef.current) {
                unlockedRef.current = true;
                if (thunderBufferRef.current) {
                  playBufferedThunder(audioContextRef.current, thunderBufferRef.current, intensity);
                } else {
                  playThunderCue(audioContextRef.current, intensity);
                }
              }
            } catch (error) {
              // Keep the visual cue even if audio resume/play fails.
            }
          }
        }

        isFirstCue = false;
        scheduleNext();
      }, Math.max(3800, delay));
    };

    scheduleNext();

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [audioEnabled, enabled, intensity]);

  return {
    flashToken
  };
}
