from __future__ import annotations

import math
import random
import wave
from pathlib import Path


SAMPLE_RATE = 44_100
DURATION_SECONDS = 48
FRAME_COUNT = SAMPLE_RATE * DURATION_SECONDS
OUTPUT_PATH = Path("/home/ubuntu/Planetarium/public/audio/night-sky-loop.wav")


def clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


def smoothstep(edge0: float, edge1: float, value: float) -> float:
    amount = clamp((value - edge0) / (edge1 - edge0), 0.0, 1.0)
    return amount * amount * (3.0 - 2.0 * amount)


def loop_frequency(target_hz: float) -> float:
    cycles = max(1, round(target_hz * DURATION_SECONDS))
    return cycles / DURATION_SECONDS


def build_chime_offsets() -> list[tuple[float, float]]:
    return [
        (6.0, 329.63),
        (18.0, 392.0),
        (30.0, 493.88),
        (42.0, 659.25),
    ]


def render_sample(index: int, shimmer_bank: list[tuple[float, float, float]]) -> tuple[float, float]:
    t = index / SAMPLE_RATE
    position = t / DURATION_SECONDS

    fade_in = smoothstep(0.0, 0.045, position)
    fade_out = 1.0 - smoothstep(0.955, 1.0, position)
    edge_envelope = fade_in * fade_out

    slow_motion = 0.86 + 0.14 * math.sin(2.0 * math.pi * position)
    pulse = 0.92 + 0.08 * math.sin(2.0 * math.pi * position * 2.0 + 0.6)

    drone = 0.0
    for frequency, amplitude, phase in (
        (loop_frequency(55.0), 0.18, 0.13),
        (loop_frequency(82.41), 0.11, 1.1),
        (loop_frequency(110.0), 0.075, 2.3),
        (loop_frequency(146.83), 0.05, 2.95),
    ):
        drone += amplitude * math.sin(2.0 * math.pi * frequency * t + phase)

    shimmer = 0.0
    for frequency, amplitude, phase in shimmer_bank:
        shimmer += amplitude * math.sin(2.0 * math.pi * frequency * t + phase)

    chime = 0.0
    for onset, frequency in build_chime_offsets():
        local_time = t - onset
        if 0.0 <= local_time <= 3.6:
            attack = smoothstep(0.0, 0.16, local_time)
            release = math.exp(-local_time * 1.8)
            chime += 0.15 * attack * release * math.sin(2.0 * math.pi * frequency * t)

    left = edge_envelope * pulse * slow_motion * (drone + shimmer + chime)
    right = edge_envelope * pulse * (drone * 0.98 + shimmer * 1.04 + chime * 0.92)

    return left, right


def main() -> None:
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    random.seed(7)
    shimmer_bank = []
    for _ in range(18):
        target_frequency = random.uniform(900.0, 2200.0)
        shimmer_bank.append(
            (
                loop_frequency(target_frequency),
                random.uniform(0.002, 0.008),
                random.uniform(0.0, math.tau),
            )
        )

    frames = bytearray()
    for index in range(FRAME_COUNT):
        left, right = render_sample(index, shimmer_bank)
        left = clamp(left, -0.95, 0.95)
        right = clamp(right, -0.95, 0.95)
        frames.extend(int(left * 32767).to_bytes(2, "little", signed=True))
        frames.extend(int(right * 32767).to_bytes(2, "little", signed=True))

    with wave.open(str(OUTPUT_PATH), "wb") as wav_file:
        wav_file.setnchannels(2)
        wav_file.setsampwidth(2)
        wav_file.setframerate(SAMPLE_RATE)
        wav_file.writeframes(frames)

    print(f"Wrote ambient loop to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
