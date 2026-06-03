function writeString(view, offset, value) {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

function audioBufferToWavBlob(buffer) {
  const channels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1;
  const bitDepth = 16;
  const samples = buffer.length;
  const blockAlign = channels * (bitDepth / 8);
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples * blockAlign;
  const arrayBuffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(arrayBuffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let sampleIndex = 0; sampleIndex < samples; sampleIndex += 1) {
    for (let channelIndex = 0; channelIndex < channels; channelIndex += 1) {
      const sample = buffer.getChannelData(channelIndex)[sampleIndex];
      const clamped = Math.max(-1, Math.min(1, sample));
      view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

function createSeededRandom(seed = 73) {
  let value = seed >>> 0;
  return () => {
    value = (1664525 * value + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}

function scheduleAuroraGraph(context, destination, initialVolume = 0.8, loopDuration = 27.5) {
  const random = createSeededRandom(73);
  const master = context.createGain();
  const reverbSend = context.createGain();
  const delay = context.createDelay(6);
  const feedback = context.createGain();
  const compressor = context.createDynamicsCompressor();

  master.gain.value = 0;
  reverbSend.gain.value = 0.5;
  delay.delayTime.value = 2.15;
  feedback.gain.value = 0.34;
  compressor.threshold.value = -24;
  compressor.knee.value = 16;
  compressor.ratio.value = 3.5;
  compressor.attack.value = 0.03;
  compressor.release.value = 0.58;

  reverbSend.connect(delay);
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(master);
  master.connect(compressor);
  compressor.connect(destination);

  const windNoiseBuffer = context.createBuffer(1, context.sampleRate * loopDuration, context.sampleRate);
  const windNoiseData = windNoiseBuffer.getChannelData(0);
  let previous = 0;
  for (let index = 0; index < windNoiseData.length; index += 1) {
    const white = random() * 2 - 1;
    previous = previous * 0.992 + white * 0.1;
    windNoiseData[index] = previous;
  }

  const bedVoices = [
    { frequency: 46.25, gain: 0.048, lfo: 0.012 }, // F#1
    { frequency: 69.3, gain: 0.03, lfo: 0.01 }, // C#2
    { frequency: 103.83, gain: 0.022, lfo: 0.008 } // G#2
  ];

  bedVoices.forEach((voice, index) => {
    const oscillator = context.createOscillator();
    const voiceGain = context.createGain();
    const filter = context.createBiquadFilter();
    const lfo = context.createOscillator();
    const lfoGain = context.createGain();

    oscillator.type = index === 0 ? "sine" : "triangle";
    oscillator.frequency.value = voice.frequency;
    voiceGain.gain.value = voice.gain;
    filter.type = "lowpass";
    filter.frequency.value = 480 + index * 190;
    filter.Q.value = 0.52;
    lfo.frequency.value = voice.lfo;
    lfoGain.gain.value = voice.gain * 0.52;

    oscillator.connect(filter);
    filter.connect(voiceGain);
    voiceGain.connect(master);
    voiceGain.connect(reverbSend);
    lfo.connect(lfoGain);
    lfoGain.connect(voiceGain.gain);

    oscillator.start(0);
    oscillator.stop(loopDuration);
    lfo.start(0);
    lfo.stop(loopDuration);
  });

  function createWindLayer({ gainValue, lowpassFrequency, highpassFrequency, lfoRate, lfoDepth, pan = 0 }) {
    const source = context.createBufferSource();
    const highpass = context.createBiquadFilter();
    const lowpass = context.createBiquadFilter();
    const gain = context.createGain();
    const lfo = context.createOscillator();
    const lfoGain = context.createGain();
    const panner = context.createStereoPanner();

    source.buffer = windNoiseBuffer;
    source.loop = true;
    highpass.type = "highpass";
    highpass.frequency.value = highpassFrequency;
    lowpass.type = "lowpass";
    lowpass.frequency.value = lowpassFrequency;
    gain.gain.value = gainValue;
    lfo.type = "sine";
    lfo.frequency.value = lfoRate;
    lfoGain.gain.value = lfoDepth;
    panner.pan.value = pan;

    source.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(panner);
    panner.connect(master);
    panner.connect(reverbSend);
    lfo.connect(lfoGain);
    lfoGain.connect(lowpass.frequency);
    lfoGain.connect(gain.gain);

    source.start(0);
    source.stop(loopDuration);
    lfo.start(0);
    lfo.stop(loopDuration);
  }

  createWindLayer({
    gainValue: 0.22,
    lowpassFrequency: 640,
    highpassFrequency: 90,
    lfoRate: 0.043,
    lfoDepth: 140,
    pan: -0.16
  });

  createWindLayer({
    gainValue: 0.14,
    lowpassFrequency: 1220,
    highpassFrequency: 240,
    lfoRate: 0.057,
    lfoDepth: 220,
    pan: 0.22
  });

  createWindLayer({
    gainValue: 0.085,
    lowpassFrequency: 2100,
    highpassFrequency: 420,
    lfoRate: 0.074,
    lfoDepth: 260,
    pan: 0.05
  });

  const shimmerBuffer = context.createBuffer(1, context.sampleRate * 4, context.sampleRate);
  const shimmerData = shimmerBuffer.getChannelData(0);
  for (let index = 0; index < shimmerData.length; index += 1) {
    shimmerData[index] = (random() * 2 - 1) * 0.018;
  }

  const shimmer = context.createBufferSource();
  const shimmerFilter = context.createBiquadFilter();
  const shimmerGain = context.createGain();
  shimmer.buffer = shimmerBuffer;
  shimmer.loop = true;
  shimmerFilter.type = "bandpass";
  shimmerFilter.frequency.value = 760;
  shimmerFilter.Q.value = 0.55;
  shimmerGain.gain.value = 0.026;
  shimmer.connect(shimmerFilter);
  shimmerFilter.connect(shimmerGain);
  shimmerGain.connect(master);
  shimmerGain.connect(reverbSend);
  shimmer.start(0);
  shimmer.stop(loopDuration);

  function playGlassTone(startAt = 0) {
    if (startAt >= loopDuration) {
      return;
    }
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const filter = context.createBiquadFilter();
    const frequencyChoices = [220, 261.63, 293.66, 329.63, 392];
    const baseFrequency = frequencyChoices[Math.floor(random() * frequencyChoices.length)];

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(baseFrequency, startAt);
    oscillator.frequency.exponentialRampToValueAtTime(baseFrequency * 1.007, Math.min(loopDuration, startAt + 4.8));
    filter.type = "highpass";
    filter.frequency.value = 280;

    gain.gain.setValueAtTime(0, startAt);
    gain.gain.linearRampToValueAtTime(0.052, Math.min(loopDuration, startAt + 0.55));
    gain.gain.exponentialRampToValueAtTime(0.001, Math.min(loopDuration, startAt + 6.2));

    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    gain.connect(reverbSend);
    oscillator.start(startAt);
    oscillator.stop(Math.min(loopDuration, startAt + 6.6));
  }

  playGlassTone(1.6);
  for (let moment = 10.4; moment < loopDuration; moment += 11.6) {
    playGlassTone(moment);
  }

  master.gain.setTargetAtTime(initialVolume, 0, 1.1);
}

export async function renderAuroraAmbientTrack({ durationSeconds = 27.5, volume = 0.92 } = {}) {
  const OfflineAudioContextClass = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (!OfflineAudioContextClass) {
    throw new Error("OfflineAudioContext is not available in this browser.");
  }

  const sampleRate = 44_100;
  const frameCount = Math.ceil(sampleRate * durationSeconds);
  const context = new OfflineAudioContextClass(2, frameCount, sampleRate);

  scheduleAuroraGraph(context, context.destination, volume, durationSeconds);
  const renderedBuffer = await context.startRendering();
  return URL.createObjectURL(audioBufferToWavBlob(renderedBuffer));
}
