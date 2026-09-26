"""Synthesise the five ambient loops and encode them for the sound switch.

CONVENTIONS.md §3, audio: mono, 44.1 kHz, loops of 8 to 20 seconds, each under
524,288 bytes, made here (source ``made:<date>``, licence ``cc0`` because the
file is this repository's own work). Standard library only for the synthesis;
the encoder is ``ffmpeg`` when it is on the PATH, else macOS ``afconvert`` to
``.m4a`` (which changes the extension §3 and the audio port's map expect, and
is recorded as a hand-back when it happens).

Each loop is seamless: its last 200 ms are crossfaded into its first 200 ms and
dropped, so the bed runs gaplessly. ``lapping`` and ``squeak`` are played once
per event by the runtime and are shaped as events rather than beds.

Usage: ``uv run --frozen python scripts/make_audio.py [--out src/lib/assets/audio]``
writes the WAVs under ``ai_tmp/audio/`` and the encoded files under ``--out``.
"""

from __future__ import annotations

import argparse
import math
import random
import shutil
import struct
import subprocess
import sys
import wave
from pathlib import Path

RATE = 44_100
CROSSFADE_SECONDS = 0.2
SEED = 20260926
BUDGET = 524_288


def seconds(n: float) -> int:
    return int(n * RATE)


# ------------------------------------------------------------------ dsp ---


def white(rng: random.Random, n: int) -> list[float]:
    return [rng.uniform(-1.0, 1.0) for _ in range(n)]


def lowpass(signal: list[float], cutoff_hz: float) -> list[float]:
    """One-pole low-pass, the simplest filter that rounds noise off."""
    alpha = 1.0 - math.exp(-2.0 * math.pi * cutoff_hz / RATE)
    out = []
    state = 0.0
    for sample in signal:
        state += alpha * (sample - state)
        out.append(state)
    return out


def highpass(signal: list[float], cutoff_hz: float) -> list[float]:
    low = lowpass(signal, cutoff_hz)
    return [s - lo for s, lo in zip(signal, low, strict=True)]


def bandpass(signal: list[float], low_hz: float, high_hz: float) -> list[float]:
    return highpass(lowpass(signal, high_hz), low_hz)


def scale(signal: list[float], gain: float) -> list[float]:
    return [s * gain for s in signal]


def mix(*signals: list[float]) -> list[float]:
    n = max(len(s) for s in signals)
    out = [0.0] * n
    for signal in signals:
        for i, sample in enumerate(signal):
            out[i] += sample
    return out


def normalise(signal: list[float], peak: float = 0.8) -> list[float]:
    top = max(abs(s) for s in signal) or 1.0
    return [s * peak / top for s in signal]


def envelope(n: int, attack: float, decay: float) -> list[float]:
    """A fast rise then an exponential fall, in seconds, over n samples."""
    out = []
    a = max(1, seconds(attack))
    for i in range(n):
        rise = min(1.0, i / a)
        fall = math.exp(-(i / RATE) / decay)
        out.append(rise * fall)
    return out


def loop(signal: list[float]) -> list[float]:
    """Crossfade the tail into the head and drop it, so the loop has no seam."""
    n = seconds(CROSSFADE_SECONDS)
    body = signal[:-n]
    tail = signal[-n:]
    for i in range(n):
        t = i / n
        body[i] = body[i] * t + tail[i] * (1.0 - t)
    return body


# ---------------------------------------------------------------- loops ---


def fire(rng: random.Random) -> list[float]:
    n = seconds(12)
    bed = scale(lowpass(white(rng, n), 400), 2.5)
    crackle = [0.0] * n
    at = 0
    while at < n:
        length = seconds(rng.uniform(0.01, 0.05))
        burst = highpass(white(rng, length), 1500)
        env = envelope(length, 0.001, 0.008)
        gain = rng.uniform(0.3, 1.0)
        for i in range(length):
            if at + i < n:
                crackle[at + i] += burst[i] * env[i] * gain
        at += seconds(rng.uniform(0.05, 0.4))
    return normalise(loop(mix(bed, scale(crackle, 0.6))))


def rain(rng: random.Random) -> list[float]:
    n = seconds(10)
    hiss = bandpass(white(rng, n), 800, 6000)
    # A slow swell so the sheet of rain breathes rather than hums.
    swell = [0.85 + 0.15 * math.sin(2 * math.pi * 0.17 * i / RATE) for i in range(n)]
    drops = [0.0] * n
    at = 0
    while at < n:
        length = seconds(0.004)
        env = envelope(length, 0.0005, 0.002)
        gain = rng.uniform(0.2, 0.7)
        for i in range(length):
            if at + i < n:
                drops[at + i] += rng.uniform(-1, 1) * env[i] * gain
        at += seconds(rng.uniform(0.005, 0.03))
    return normalise(loop([h * s + d * 0.5 for h, s, d in zip(hiss, swell, drops, strict=True)]))


def wind(rng: random.Random) -> list[float]:
    n = seconds(16)
    low = lowpass(white(rng, n), 250)
    gust = []
    for i in range(n):
        t = i / RATE
        slow = 0.5 + 0.5 * math.sin(2 * math.pi * 0.08 * t)
        slower = 0.5 + 0.5 * math.sin(2 * math.pi * 0.031 * t + 1.3)
        gust.append(0.25 + 0.75 * slow * slower)
    return normalise(loop([s * g * 4.0 for s, g in zip(low, gust, strict=True)]))


def lapping(rng: random.Random) -> list[float]:
    n = seconds(8 + CROSSFADE_SECONDS)
    out = [0.0] * n
    at = seconds(0.1)
    while at < n - seconds(0.3):
        length = seconds(0.12)
        burst = bandpass(white(rng, length), 900, 2500)
        env = envelope(length, 0.004, 0.03)
        gain = rng.uniform(0.6, 1.0)
        for i in range(length):
            out[at + i] += burst[i] * env[i] * gain
        at += seconds(0.34 + rng.uniform(-0.04, 0.04))
    return normalise(loop(out), 0.7)


def squeak(rng: random.Random) -> list[float]:
    n = seconds(8 + CROSSFADE_SECONDS)
    out = [0.0] * n
    # Squeaks come in the shakes: a few close together, a pause, again.
    starts = [0.05, 0.32, 0.55, 1.6, 1.85, 3.4, 3.62, 3.9, 5.7, 6.0, 7.2]
    for start in starts:
        length = seconds(0.18)
        base = rng.uniform(1900, 2600)
        env = envelope(length, 0.006, 0.06)
        phase = 0.0
        begin = seconds(start)
        for i in range(length):
            t = i / RATE
            hz = base * (1.0 + 0.08 * math.sin(2 * math.pi * 9.0 * t)) * (1.0 - 0.15 * t / 0.18)
            phase += 2 * math.pi * hz / RATE
            out[begin + i] += math.sin(phase) * env[i]
    return normalise(loop(out), 0.7)


LOOPS = {"fire": fire, "rain": rain, "wind": wind, "lapping": lapping, "squeak": squeak}


# ------------------------------------------------------------------- io ---


def write_wav(path: Path, signal: list[float]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as out:
        out.setnchannels(1)
        out.setsampwidth(2)
        out.setframerate(RATE)
        frames = struct.pack(
            f"<{len(signal)}h", *(int(max(-1.0, min(1.0, s)) * 32767) for s in signal)
        )
        out.writeframes(frames)


def encode(wav: Path, out_dir: Path) -> Path:
    """mp3 through ffmpeg when it is on the PATH; else AAC in .m4a through afconvert."""
    out_dir.mkdir(parents=True, exist_ok=True)
    if shutil.which("ffmpeg"):
        target = out_dir / f"{wav.stem}.mp3"
        subprocess.run(
            [
                "ffmpeg",
                "-y",
                "-loglevel",
                "error",
                "-i",
                str(wav),
                "-codec:a",
                "libmp3lame",
                "-q:a",
                "6",
                str(target),
            ],
            check=True,
        )
        return target
    if shutil.which("afconvert"):
        target = out_dir / f"{wav.stem}.m4a"
        subprocess.run(["afconvert", "-f", "mp4f", "-d", "aac", str(wav), str(target)], check=True)
        return target
    raise SystemExit("No encoder: neither ffmpeg nor afconvert is on the PATH")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", type=Path, default=Path("src/lib/assets/audio"))
    parser.add_argument("--wav-dir", type=Path, default=Path("ai_tmp/audio"))
    parser.add_argument("--wav-only", action="store_true", help="synthesise without encoding")
    args = parser.parse_args()

    rng = random.Random(SEED)  # noqa: S311 - a seed for reproducible noise, not secrecy
    over = []
    for name, make in LOOPS.items():
        signal = make(rng)
        wav = args.wav_dir / f"{name}.wav"
        write_wav(wav, signal)
        line = f"{name}: {len(signal) / RATE:.2f} s"
        if not args.wav_only:
            encoded = encode(wav, args.out)
            size = encoded.stat().st_size
            line += f" -> {encoded} {size} bytes"
            if size > BUDGET:
                over.append(encoded)
        print(line)
    if over:
        print(f"over budget ({BUDGET} bytes): {', '.join(str(p) for p in over)}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
