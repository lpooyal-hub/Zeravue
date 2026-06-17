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

function createSeededRandom(seed = 211) {
  let value = seed >>> 0;
  return () => {
    value = (1664525 * value + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}

function scheduleLagoonGraph(context, destination, initialVolume = 0.74, loopDuration = 28.2) {
  const random = createSeededRandom(211);
  const master = context.createGain();
  const waterBedGain = context.createGain();
  const shimmerGain = context.createGain();
  const bubbleGain = context.createGain();
  const pulseGain = context.createGain();
  const delay = context.createDelay(4);
  const feedback = context.createGain();
  const compressor = context.createDynamicsCompressor();

  master.gain.value = 0;
  waterBedGain.gain.value = 0.24;
  shimmerGain.gain.value = 0.06;
  bubbleGain.gain.value = 0.08;
  pulseGain.gain.value = 0.035;
  delay.delayTime.value = 1.6;
  feedback.gain.value = 0.18;
  compressor.threshold.value = -23;
  compressor.knee.value = 18;
  compressor.ratio.value = 3.2;
  compressor.attack.value = 0.03;
  compressor.release.value = 0.44;

  delay.connect(feedback);
  feedback.connect(delay);
  waterBedGain.connect(master);
  shimmerGain.connect(master);
  bubbleGain.connect(master);
  pulseGain.connect(master);
  shimmerGain.connect(delay);
  pulseGain.connect(delay);
  master.connect(compressor);
  compressor.connect(destination);

  const noiseBuffer = context.createBuffer(1, context.sampleRate * loopDuration, context.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  let previous = 0;
  for (let index = 0; index < noiseData.length; index += 1) {
    const white = random() * 2 - 1;
    previous = previous * 0.992 + white * 0.052;
    noiseData[index] = previous;
  }

  const waterNoise = context.createBufferSource();
  waterNoise.buffer = noiseBuffer;
  waterNoise.loop = true;
  const lowpass = context.createBiquadFilter();
  const bandpass = context.createBiquadFilter();
  const swellLfo = context.createOscillator();
  const swellGain = context.createGain();

  lowpass.type = "lowpass";
  lowpass.frequency.value = 540;
  bandpass.type = "bandpass";
  bandpass.frequency.value = 180;
  bandpass.Q.value = 0.38;
  swellLfo.type = "sine";
  swellLfo.frequency.value = 0.032;
  swellGain.gain.value = 48;

  waterNoise.connect(lowpass);
  lowpass.connect(bandpass);
  bandpass.connect(waterBedGain);
  swellLfo.connect(swellGain);
  swellGain.connect(bandpass.frequency);

  waterNoise.start(0);
  waterNoise.stop(loopDuration);
  swellLfo.start(0);
  swellLfo.stop(loopDuration);

  const shimmerNoise = context.createBufferSource();
  shimmerNoise.buffer = noiseBuffer;
  shimmerNoise.loop = true;
  const shimmerFilter = context.createBiquadFilter();
  const shimmerLfo = context.createOscillator();
  const shimmerDepth = context.createGain();

  shimmerFilter.type = "bandpass";
  shimmerFilter.frequency.value = 940;
  shimmerFilter.Q.value = 0.62;
  shimmerLfo.type = "sine";
  shimmerLfo.frequency.value = 0.058;
  shimmerDepth.gain.value = 130;

  shimmerNoise.connect(shimmerFilter);
  shimmerFilter.connect(shimmerGain);
  shimmerLfo.connect(shimmerDepth);
  shimmerDepth.connect(shimmerFilter.frequency);

  shimmerNoise.start(0);
  shimmerNoise.stop(loopDuration);
  shimmerLfo.start(0);
  shimmerLfo.stop(loopDuration);

  function playBubble(startAt) {
    if (startAt >= loopDuration) {
      return;
    }
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const filter = context.createBiquadFilter();
    const startFrequency = 180 + random() * 120;
    const endFrequency = 420 + random() * 240;

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(startFrequency, startAt);
    oscillator.frequency.exponentialRampToValueAtTime(endFrequency, Math.min(loopDuration, startAt + 0.38));
    filter.type = "lowpass";
    filter.frequency.value = 1200;

    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.linearRampToValueAtTime(0.075, Math.min(loopDuration, startAt + 0.05));
    gain.gain.exponentialRampToValueAtTime(0.0001, Math.min(loopDuration, startAt + 0.52));

    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(bubbleGain);
    oscillator.start(startAt);
    oscillator.stop(Math.min(loopDuration, startAt + 0.55));
  }

  function playPulse(startAt) {
    if (startAt >= loopDuration) {
      return;
    }
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const filter = context.createBiquadFilter();
    const baseFrequency = 72 + random() * 26;

    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(baseFrequency, startAt);
    oscillator.frequency.exponentialRampToValueAtTime(baseFrequency * 0.94, Math.min(loopDuration, startAt + 3.6));

    filter.type = "lowpass";
    filter.frequency.value = 220;
    filter.Q.value = 0.4;

    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.linearRampToValueAtTime(0.042, Math.min(loopDuration, startAt + 0.7));
    gain.gain.exponentialRampToValueAtTime(0.0001, Math.min(loopDuration, startAt + 4.8));

    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(pulseGain);
    oscillator.start(startAt);
    oscillator.stop(Math.min(loopDuration, startAt + 5));
  }

  for (let moment = 0.6; moment < loopDuration; moment += 1.3 + random() * 2.6) {
    playBubble(moment);
  }

  for (let moment = 2.8; moment < loopDuration; moment += 8.8 + random() * 3.6) {
    playPulse(moment);
  }

  master.gain.setTargetAtTime(initialVolume, 0, 0.9);
}

export async function renderLagoonAmbientTrack({ durationSeconds = 28.2, volume = 0.74 } = {}) {
  const OfflineAudioContextClass = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (!OfflineAudioContextClass) {
    throw new Error("OfflineAudioContext is not available in this browser.");
  }

  const sampleRate = 44_100;
  const frameCount = Math.ceil(sampleRate * durationSeconds);
  const context = new OfflineAudioContextClass(2, frameCount, sampleRate);

  scheduleLagoonGraph(context, context.destination, volume, durationSeconds);
  const renderedBuffer = await context.startRendering();
  return URL.createObjectURL(audioBufferToWavBlob(renderedBuffer));
}
