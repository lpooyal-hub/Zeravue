from __future__ import annotations

import math
import random
import wave
from pathlib import Path


SAMPLE_RATE = 44_100
DELAY_SECONDS = 1.9
CHIME_INTERVAL_SECONDS = 6.2
LOOP_COUNT = 8
DURATION_SECONDS = CHIME_INTERVAL_SECONDS * LOOP_COUNT
FRAME_COUNT = int(SAMPLE_RATE * DURATION_SECONDS)
DELAY_SAMPLES = int(SAMPLE_RATE * DELAY_SECONDS)
OUTPUT_PATH = Path("/home/ubuntu/Planetarium/public/audio/night-sky-loop.wav")


def clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


class BiquadFilter:
    def __init__(self, filter_type: str, frequency: float, q: float, sample_rate: int) -> None:
        omega = 2.0 * math.pi * frequency / sample_rate
        alpha = math.sin(omega) / (2.0 * q)
        cos_omega = math.cos(omega)

        if filter_type == "lowpass":
            b0 = (1.0 - cos_omega) / 2.0
            b1 = 1.0 - cos_omega
            b2 = (1.0 - cos_omega) / 2.0
            a0 = 1.0 + alpha
            a1 = -2.0 * cos_omega
            a2 = 1.0 - alpha
        elif filter_type == "bandpass":
            b0 = alpha
            b1 = 0.0
            b2 = -alpha
            a0 = 1.0 + alpha
            a1 = -2.0 * cos_omega
            a2 = 1.0 - alpha
        elif filter_type == "highpass":
            b0 = (1.0 + cos_omega) / 2.0
            b1 = -(1.0 + cos_omega)
            b2 = (1.0 + cos_omega) / 2.0
            a0 = 1.0 + alpha
            a1 = -2.0 * cos_omega
            a2 = 1.0 - alpha
        else:
            raise ValueError(f"Unsupported filter type: {filter_type}")

        self.b0 = b0 / a0
        self.b1 = b1 / a0
        self.b2 = b2 / a0
        self.a1 = a1 / a0
        self.a2 = a2 / a0
        self.x1 = 0.0
        self.x2 = 0.0
        self.y1 = 0.0
        self.y2 = 0.0

    def process(self, sample: float) -> float:
        output = self.b0 * sample + self.b1 * self.x1 + self.b2 * self.x2 - self.a1 * self.y1 - self.a2 * self.y2
        self.x2 = self.x1
        self.x1 = sample
        self.y2 = self.y1
        self.y1 = output
        return output


def oscillator_sample(shape: str, frequency: float, time_seconds: float) -> float:
    phase = (time_seconds * frequency) % 1.0
    if shape == "triangle":
        return 4.0 * abs(phase - 0.5) - 1.0
    return math.sin(2.0 * math.pi * phase)


def shimmer_loop() -> list[float]:
    length = SAMPLE_RATE * 3
    random.seed(17)
    bandpass = BiquadFilter("bandpass", 1280.0, 0.65, SAMPLE_RATE)
    result = []
    for _ in range(length):
        noise = (random.random() * 2.0 - 1.0) * 0.035
        result.append(bandpass.process(noise) * 0.052)
    return result


def chime_events() -> list[tuple[float, float]]:
    random.seed(23)
    frequencies = [329.63, 392.0, 493.88, 659.25]
    events = [(0.18, frequencies[0]), (1.1, frequencies[2])]
    moment = CHIME_INTERVAL_SECONDS
    while moment < DURATION_SECONDS:
        events.append((moment, random.choice(frequencies)))
        moment += CHIME_INTERVAL_SECONDS
    return events


def main() -> None:
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    shimmer = shimmer_loop()
    events = chime_events()
    event_index = 0

    voice_specs = [
        {"frequency": 55.0, "gain": 0.088, "lfo": 0.026, "shape": "sine", "filter": BiquadFilter("lowpass", 540.0, 0.55, SAMPLE_RATE)},
        {"frequency": 82.41, "gain": 0.062, "lfo": 0.021, "shape": "triangle", "filter": BiquadFilter("lowpass", 720.0, 0.55, SAMPLE_RATE)},
        {"frequency": 110.0, "gain": 0.042, "lfo": 0.017, "shape": "triangle", "filter": BiquadFilter("lowpass", 900.0, 0.55, SAMPLE_RATE)},
        {"frequency": 146.83, "gain": 0.028, "lfo": 0.013, "shape": "triangle", "filter": BiquadFilter("lowpass", 1080.0, 0.55, SAMPLE_RATE)},
    ]

    active_chimes: list[dict[str, float | BiquadFilter]] = []
    delay_left = [0.0] * DELAY_SAMPLES
    delay_right = [0.0] * DELAY_SAMPLES
    delay_cursor = 0
    frames = bytearray()

    for index in range(FRAME_COUNT):
        time_seconds = index / SAMPLE_RATE

        while event_index < len(events) and time_seconds >= events[event_index][0]:
            _, frequency = events[event_index]
            active_chimes.append(
                {
                    "frequency": frequency,
                    "started_at": time_seconds,
                    "detune_end": frequency * 1.01,
                    "filter": BiquadFilter("highpass", 420.0, 0.707, SAMPLE_RATE),
                }
            )
            event_index += 1

        wash_sample = 0.0
        for voice in voice_specs:
            lfo_value = math.sin(2.0 * math.pi * voice["lfo"] * time_seconds)
            gain = voice["gain"] + (voice["gain"] * 0.45 * lfo_value)
            raw = oscillator_sample(voice["shape"], voice["frequency"], time_seconds)
            filtered = voice["filter"].process(raw)
            wash_sample += filtered * gain

        wash_sample *= 0.52

        shimmer_sample = shimmer[index % len(shimmer)]
        chime_direct = 0.0
        chime_delay_send = 0.0
        still_active: list[dict[str, float | BiquadFilter]] = []

        for chime in active_chimes:
            local_time = time_seconds - float(chime["started_at"])
            if local_time > 3.6:
                continue

            attack = clamp(local_time / 0.18, 0.0, 1.0)
            release = math.exp(-4.4 * max(0.0, local_time - 0.18) / 3.22)
            gain = 0.065 * attack * release
            current_frequency = float(chime["frequency"]) * ((float(chime["detune_end"]) / float(chime["frequency"])) ** (local_time / 2.4 if local_time < 2.4 else 1.0))
            raw = math.sin(2.0 * math.pi * current_frequency * time_seconds)
            filtered = chime["filter"].process(raw) * gain
            chime_direct += filtered
            chime_delay_send += filtered
            still_active.append(chime)

        active_chimes = still_active

        feedback_left = delay_left[delay_cursor]
        feedback_right = delay_right[delay_cursor]

        delay_input_left = wash_sample + chime_delay_send + feedback_left * 0.26
        delay_input_right = wash_sample + chime_delay_send + feedback_right * 0.26
        delay_left[delay_cursor] = delay_input_left
        delay_right[delay_cursor] = delay_input_right
        delay_cursor = (delay_cursor + 1) % DELAY_SAMPLES

        left = wash_sample + shimmer_sample + chime_direct + feedback_left
        right = wash_sample + shimmer_sample + chime_direct + feedback_right

        fade_in = clamp(time_seconds / 1.6, 0.0, 1.0)
        fade_out = clamp((DURATION_SECONDS - time_seconds) / 1.6, 0.0, 1.0)
        master_gain = 0.9 * min(fade_in, fade_out)

        left = math.tanh(left * 1.18) * master_gain
        right = math.tanh(right * 1.18) * master_gain

        frames.extend(int(clamp(left, -0.98, 0.98) * 32767).to_bytes(2, "little", signed=True))
        frames.extend(int(clamp(right, -0.98, 0.98) * 32767).to_bytes(2, "little", signed=True))

    with wave.open(str(OUTPUT_PATH), "wb") as wav_file:
        wav_file.setnchannels(2)
        wav_file.setsampwidth(2)
        wav_file.setframerate(SAMPLE_RATE)
        wav_file.writeframes(frames)

    print(f"Wrote ambient loop to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
