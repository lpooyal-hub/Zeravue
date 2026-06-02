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

function createSeededRandom(seed = 101) {
  let value = seed >>> 0;
  return () => {
    value = (1664525 * value + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}

function scheduleRainGraph(context, destination, initialVolume = 0.82, loopDuration = 26.4) {
  const random = createSeededRandom(101);
  const master = context.createGain();
  const rainBedGain = context.createGain();
  const roofGain = context.createGain();
  const dripGain = context.createGain();
  const forestBedGain = context.createGain();
  const windBedGain = context.createGain();
  const lifeBedGain = context.createGain();
  const delay = context.createDelay(2.2);
  const feedback = context.createGain();
  const compressor = context.createDynamicsCompressor();

  master.gain.value = 0;
  rainBedGain.gain.value = 0.5;
  roofGain.gain.value = 0.22;
  dripGain.gain.value = 0.12;
  forestBedGain.gain.value = 0.055;
  windBedGain.gain.value = 0.035;
  lifeBedGain.gain.value = 0.018;
  delay.delayTime.value = 0.22;
  feedback.gain.value = 0.16;
  compressor.threshold.value = -20;
  compressor.knee.value = 14;
  compressor.ratio.value = 3.6;
  compressor.attack.value = 0.01;
  compressor.release.value = 0.3;

  delay.connect(feedback);
  feedback.connect(delay);
  rainBedGain.connect(master);
  roofGain.connect(master);
  dripGain.connect(master);
  forestBedGain.connect(master);
  windBedGain.connect(master);
  lifeBedGain.connect(master);
  dripGain.connect(delay);
  delay.connect(master);
  master.connect(compressor);
  compressor.connect(destination);

  const noiseBuffer = context.createBuffer(1, context.sampleRate * loopDuration, context.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  let previous = 0;
  for (let index = 0; index < noiseData.length; index += 1) {
    const white = random() * 2 - 1;
    previous = previous * 0.985 + white * 0.19;
    noiseData[index] = previous;
  }

  const rainNoise = context.createBufferSource();
  rainNoise.buffer = noiseBuffer;
  rainNoise.loop = true;
  const rainFilter = context.createBiquadFilter();
  rainFilter.type = "highpass";
  rainFilter.frequency.value = 680;
  const rainTone = context.createBiquadFilter();
  rainTone.type = "lowpass";
  rainTone.frequency.value = 5200;
  rainNoise.connect(rainFilter);
  rainFilter.connect(rainTone);
  rainTone.connect(rainBedGain);
  rainNoise.start(0);
  rainNoise.stop(loopDuration);

  const roofNoise = context.createBufferSource();
  roofNoise.buffer = noiseBuffer;
  roofNoise.loop = true;
  const roofBand = context.createBiquadFilter();
  roofBand.type = "bandpass";
  roofBand.frequency.value = 1800;
  roofBand.Q.value = 0.6;
  roofNoise.connect(roofBand);
  roofBand.connect(roofGain);
  roofNoise.start(0);
  roofNoise.stop(loopDuration);

  const forestNoise = context.createBufferSource();
  forestNoise.buffer = noiseBuffer;
  forestNoise.loop = true;
  const forestLowpass = context.createBiquadFilter();
  const forestHighpass = context.createBiquadFilter();
  forestLowpass.type = "lowpass";
  forestLowpass.frequency.value = 1200;
  forestHighpass.type = "highpass";
  forestHighpass.frequency.value = 180;
  forestNoise.connect(forestLowpass);
  forestLowpass.connect(forestHighpass);
  forestHighpass.connect(forestBedGain);
  forestNoise.start(0);
  forestNoise.stop(loopDuration);

  const windNoise = context.createBufferSource();
  windNoise.buffer = noiseBuffer;
  windNoise.loop = true;
  const windFilter = context.createBiquadFilter();
  const windLfo = context.createOscillator();
  const windLfoGain = context.createGain();
  windFilter.type = "bandpass";
  windFilter.frequency.value = 420;
  windFilter.Q.value = 0.45;
  windLfo.type = "sine";
  windLfo.frequency.value = 0.045;
  windLfoGain.gain.value = 110;
  windLfo.connect(windLfoGain);
  windLfoGain.connect(windFilter.frequency);
  windNoise.connect(windFilter);
  windFilter.connect(windBedGain);
  windNoise.start(0);
  windNoise.stop(loopDuration);
  windLfo.start(0);
  windLfo.stop(loopDuration);

  function playLifePulse(startAt) {
    if (startAt >= loopDuration) {
      return;
    }

    const oscillator = context.createOscillator();
    const tremolo = context.createOscillator();
    const tremoloGain = context.createGain();
    const gain = context.createGain();
    const filter = context.createBiquadFilter();
    const baseFrequency = 980 + random() * 860;
    const sustain = 0.18 + random() * 0.26;

    oscillator.type = random() > 0.5 ? "triangle" : "sine";
    oscillator.frequency.setValueAtTime(baseFrequency, startAt);
    oscillator.frequency.exponentialRampToValueAtTime(baseFrequency * (0.92 + random() * 0.1), Math.min(loopDuration, startAt + sustain));

    tremolo.type = "sine";
    tremolo.frequency.value = 7 + random() * 5;
    tremoloGain.gain.value = 0.012 + random() * 0.01;

    filter.type = "bandpass";
    filter.frequency.value = baseFrequency;
    filter.Q.value = 3.5;

    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.linearRampToValueAtTime(0.06 + random() * 0.03, Math.min(loopDuration, startAt + 0.03));
    gain.gain.exponentialRampToValueAtTime(0.0001, Math.min(loopDuration, startAt + sustain));

    tremolo.connect(tremoloGain);
    tremoloGain.connect(gain.gain);

    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(lifeBedGain);

    oscillator.start(startAt);
    oscillator.stop(Math.min(loopDuration, startAt + sustain + 0.04));
    tremolo.start(startAt);
    tremolo.stop(Math.min(loopDuration, startAt + sustain + 0.04));
  }

  function playDrip(startAt) {
    if (startAt >= loopDuration) {
      return;
    }
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const filter = context.createBiquadFilter();
    const frequency = 620 + random() * 520;

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, startAt);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.42, Math.min(loopDuration, startAt + 0.28));
    filter.type = "lowpass";
    filter.frequency.value = 1700;

    gain.gain.setValueAtTime(0, startAt);
    gain.gain.linearRampToValueAtTime(0.12, Math.min(loopDuration, startAt + 0.018));
    gain.gain.exponentialRampToValueAtTime(0.0008, Math.min(loopDuration, startAt + 0.44));

    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(dripGain);
    oscillator.start(startAt);
    oscillator.stop(Math.min(loopDuration, startAt + 0.46));
  }

  for (let moment = 0.8; moment < loopDuration; moment += 0.9 + random() * 1.6) {
    playDrip(moment);
  }

  for (let moment = 2.2; moment < loopDuration; moment += 5.4 + random() * 6.8) {
    if (random() > 0.32) {
      playLifePulse(moment);
    }
  }

  master.gain.setTargetAtTime(initialVolume, 0, 0.8);
}

export async function renderRainAmbientTrack({ durationSeconds = 26.4, volume = 0.82 } = {}) {
  const OfflineAudioContextClass = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (!OfflineAudioContextClass) {
    throw new Error("OfflineAudioContext is not available in this browser.");
  }

  const sampleRate = 44_100;
  const frameCount = Math.ceil(sampleRate * durationSeconds);
  const context = new OfflineAudioContextClass(2, frameCount, sampleRate);

  scheduleRainGraph(context, context.destination, volume, durationSeconds);
  const renderedBuffer = await context.startRendering();
  return URL.createObjectURL(audioBufferToWavBlob(renderedBuffer));
}
