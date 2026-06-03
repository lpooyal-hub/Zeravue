from __future__ import annotations

import argparse
import math
import random
import wave
from pathlib import Path


SAMPLE_RATE = 44_100
DURATION_SECONDS = 32.0
FRAME_COUNT = int(SAMPLE_RATE * DURATION_SECONDS)
PROJECT_ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = PROJECT_ROOT / "public" / "audio"

VARIANTS = {
    "default": {
        "output": "aurora-wind-loop.wav",
        "seed": 61,
        "low_gain": 0.72,
        "mid_gain": 0.38,
        "hiss_gain": 0.08,
        "sparkle_gain": 0.05,
        "master_drive": 1.35,
        "master_gain": 0.88,
        "delay_feedback": 0.22,
        "delay_mix": 0.18,
    },
    "rough": {
        "output": "aurora-wind-rough.wav",
        "seed": 79,
        "low_gain": 0.78,
        "mid_gain": 0.46,
        "hiss_gain": 0.12,
        "sparkle_gain": 0.03,
        "master_drive": 1.48,
        "master_gain": 0.92,
        "delay_feedback": 0.18,
        "delay_mix": 0.12,
    },
    "distant": {
        "output": "aurora-wind-distant.wav",
        "seed": 47,
        "low_gain": 0.56,
        "mid_gain": 0.24,
        "hiss_gain": 0.035,
        "sparkle_gain": 0.02,
        "master_drive": 1.18,
        "master_gain": 0.74,
        "delay_feedback": 0.28,
        "delay_mix": 0.24,
    },
    "cold": {
        "output": "aurora-wind-cold.wav",
        "seed": 103,
        "low_gain": 0.62,
        "mid_gain": 0.32,
        "hiss_gain": 0.14,
        "sparkle_gain": 0.08,
        "master_drive": 1.32,
        "master_gain": 0.84,
        "delay_feedback": 0.24,
        "delay_mix": 0.18,
    },
}


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


def gust_shape(time_seconds: float, offset: float, rate: float) -> float:
    return 0.5 + 0.5 * math.sin(2.0 * math.pi * rate * time_seconds + offset)


def render_variant(variant: str) -> Path:
    settings = VARIANTS[variant]
    output_path = OUTPUT_DIR / settings["output"]
    output_path.parent.mkdir(parents=True, exist_ok=True)

    random.seed(settings["seed"])
    low_wind_hp = BiquadFilter("highpass", 70.0, 0.707, SAMPLE_RATE)
    low_wind_lp = BiquadFilter("lowpass", 540.0, 0.62, SAMPLE_RATE)
    mid_wind_hp = BiquadFilter("highpass", 180.0, 0.707, SAMPLE_RATE)
    mid_wind_lp = BiquadFilter("lowpass", 1400.0, 0.65, SAMPLE_RATE)
    hiss_band = BiquadFilter("bandpass", 2300.0, 0.58, SAMPLE_RATE)
    sparkle_band = BiquadFilter("bandpass", 4200.0, 0.74, SAMPLE_RATE)

    delay_seconds = 1.7
    delay_samples = int(SAMPLE_RATE * delay_seconds)
    delay_left = [0.0] * delay_samples
    delay_right = [0.0] * delay_samples
    delay_cursor = 0

    slow_phase = random.random() * math.pi * 2.0
    mid_phase = random.random() * math.pi * 2.0
    fast_phase = random.random() * math.pi * 2.0

    noise_memory = 0.0
    sparkle_memory = 0.0
    frames = bytearray()

    for index in range(FRAME_COUNT):
        time_seconds = index / SAMPLE_RATE

        white = random.random() * 2.0 - 1.0
        noise_memory = noise_memory * 0.992 + white * 0.12
        pinkish = noise_memory

        sparkle_input = (random.random() * 2.0 - 1.0) * 0.24
        sparkle_memory = sparkle_memory * 0.94 + sparkle_input * 0.08

        low_gust = 0.4 + gust_shape(time_seconds, slow_phase, 0.028) * 0.45
        mid_gust = 0.32 + gust_shape(time_seconds, mid_phase, 0.053) * 0.36
        fast_gust = 0.18 + gust_shape(time_seconds, fast_phase, 0.11) * 0.14

        low_layer = low_wind_lp.process(low_wind_hp.process(pinkish)) * low_gust
        mid_layer = mid_wind_lp.process(mid_wind_hp.process(pinkish)) * mid_gust
        hiss_layer = hiss_band.process(pinkish) * fast_gust
        sparkle_layer = sparkle_band.process(sparkle_memory) * (0.04 + gust_shape(time_seconds, fast_phase * 0.7, 0.16) * 0.025)

        bed = (
            low_layer * settings["low_gain"]
            + mid_layer * settings["mid_gain"]
            + hiss_layer * settings["hiss_gain"]
            + sparkle_layer * settings["sparkle_gain"]
        )

        left_pan = -0.16 + math.sin(2.0 * math.pi * 0.021 * time_seconds) * 0.09
        right_pan = 0.16 + math.sin(2.0 * math.pi * 0.019 * time_seconds + 1.4) * 0.09
        left = bed * (1.0 - left_pan)
        right = bed * (1.0 + right_pan)

        delay_feedback_left = delay_left[delay_cursor]
        delay_feedback_right = delay_right[delay_cursor]
        delay_left[delay_cursor] = left + delay_feedback_left * settings["delay_feedback"]
        delay_right[delay_cursor] = right + delay_feedback_right * settings["delay_feedback"]
        delay_cursor = (delay_cursor + 1) % delay_samples

        left += delay_feedback_left * settings["delay_mix"]
        right += delay_feedback_right * settings["delay_mix"]

        fade_in = clamp(time_seconds / 2.0, 0.0, 1.0)
        fade_out = clamp((DURATION_SECONDS - time_seconds) / 2.2, 0.0, 1.0)
        master_gain = settings["master_gain"] * min(fade_in, fade_out)

        left = math.tanh(left * settings["master_drive"]) * master_gain
        right = math.tanh(right * settings["master_drive"]) * master_gain

        frames.extend(int(clamp(left, -0.98, 0.98) * 32767).to_bytes(2, "little", signed=True))
        frames.extend(int(clamp(right, -0.98, 0.98) * 32767).to_bytes(2, "little", signed=True))

    with wave.open(str(output_path), "wb") as wav_file:
        wav_file.setnchannels(2)
        wav_file.setsampwidth(2)
        wav_file.setframerate(SAMPLE_RATE)
        wav_file.writeframes(frames)

    return output_path


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate aurora wind loop variants.")
    parser.add_argument(
        "--variant",
        choices=[*VARIANTS.keys(), "all"],
        default="all",
        help="Variant to generate. Defaults to all."
    )
    args = parser.parse_args()

    targets = list(VARIANTS.keys()) if args.variant == "all" else [args.variant]
    for variant in targets:
      output_path = render_variant(variant)
      print(f"Wrote {variant} aurora wind loop to {output_path}")


if __name__ == "__main__":
    main()
