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

function createSeededRandom(seed = 17) {
  let value = seed >>> 0;
  return () => {
    value = (1664525 * value + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}

function scheduleAmbientGraph(context, destination, initialVolume = 0.9, loopDuration = 24.8) {
  const random = createSeededRandom(17);
  const master = context.createGain();
  const delay = context.createDelay(5);
  const feedback = context.createGain();
  const wash = context.createGain();
  const compressor = context.createDynamicsCompressor();

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
  compressor.connect(destination);

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

    oscillator.start(0);
    oscillator.stop(loopDuration);
    lfo.start(0);
    lfo.stop(loopDuration);
  });

  const shimmerBuffer = context.createBuffer(1, context.sampleRate * 3, context.sampleRate);
  const shimmerData = shimmerBuffer.getChannelData(0);
  for (let index = 0; index < shimmerData.length; index += 1) {
    shimmerData[index] = (random() * 2 - 1) * 0.035;
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
  shimmer.start(0);
  shimmer.stop(loopDuration);

  function playChime(delaySeconds = 0) {
    const startAt = delaySeconds;
    if (startAt >= loopDuration) {
      return;
    }

    const oscillator = context.createOscillator();
    const chimeGain = context.createGain();
    const filter = context.createBiquadFilter();
    const frequencies = [329.63, 392, 493.88, 659.25];
    const frequency = frequencies[Math.floor(random() * frequencies.length)];

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, startAt);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.01, Math.min(loopDuration, startAt + 2.4));
    filter.type = "highpass";
    filter.frequency.value = 420;
    chimeGain.gain.setValueAtTime(0, startAt);
    chimeGain.gain.linearRampToValueAtTime(0.065, Math.min(loopDuration, startAt + 0.18));
    chimeGain.gain.exponentialRampToValueAtTime(0.001, Math.min(loopDuration, startAt + 3.4));

    oscillator.connect(filter);
    filter.connect(chimeGain);
    chimeGain.connect(master);
    chimeGain.connect(delay);
    oscillator.start(startAt);
    oscillator.stop(Math.min(loopDuration, startAt + 3.6));
  }

  playChime(0.18);
  playChime(1.1);
  for (let moment = 6.2; moment < loopDuration; moment += 6.2) {
    playChime(moment);
  }

  master.gain.setTargetAtTime(initialVolume, 0, 0.9);
}

export async function renderNightSkyAmbientTrack({ durationSeconds = 24.8, volume = 0.9 } = {}) {
  const OfflineAudioContextClass = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (!OfflineAudioContextClass) {
    throw new Error("OfflineAudioContext is not available in this browser.");
  }

  const sampleRate = 44_100;
  const frameCount = Math.ceil(sampleRate * durationSeconds);
  const context = new OfflineAudioContextClass(2, frameCount, sampleRate);

  scheduleAmbientGraph(context, context.destination, volume, durationSeconds);
  const renderedBuffer = await context.startRendering();
  return URL.createObjectURL(audioBufferToWavBlob(renderedBuffer));
}
