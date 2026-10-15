#!/usr/bin/env python3
"""Render 'First Light at Riverside', an original ProjectQuest instrumental.

Requires Python 3, numpy and ffmpeg. No samples, downloaded instruments or
third-party compositions are used. Run from any working directory.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path
import subprocess
import tempfile
import wave

import numpy as np

BPM = 78
RATE = 44100
BEAT = 60 / BPM
BARS = 32
FRAMES = round(BARS * 4 * BEAT * RATE)
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public" / "audio"
SEED = 20261015

# Bass note / close, voice-led upper voicing. The ninths and major sevenths give
# the score its open, hopeful colour without a triumphal game-fanfare feeling.
CHORDS = {
    "D": (38, (57, 61, 64, 66)),
    "Bm": (35, (57, 61, 62, 66)),
    "G": (43, (57, 59, 62, 66)),
    "Em": (40, (55, 59, 62, 66)),
    "A": (33, (55, 59, 61, 66)),
    "F#m": (42, (57, 61, 64, 68)),
    "D/F#": (42, (57, 61, 64, 66)),
    "Asus": (33, (55, 59, 62, 64)),
}
HARMONY = (
    "D D Bm Bm G G Em A "
    "D F#m Bm Bm G D/F# Em A "
    "G A F#m Bm Em A D D "
    "G A F#m Bm Em A D Asus"
).split()

# Beat, MIDI pitch, duration in beats. Space is part of the melody: short ideas
# answer one another over the harmony rather than filling every subdivision.
MELODY = {
    2: [(2.5, 73, .65), (3.5, 74, .45)],
    3: [(0, 78, 1.8), (2.5, 76, .9)],
    4: [(0, 74, 1.2), (1.5, 78, .65), (2.5, 76, .8)],
    5: [(.5, 74, .75), (1.75, 71, 1.8)],
    6: [(.5, 69, 1), (2, 71, .65), (3, 73, .6)],
    7: [(0, 71, 1.4), (2.5, 69, .75)],
    8: [(0, 66, 1.2), (1.5, 69, .65), (2.5, 73, .8)],
    9: [(.5, 73, 1.1), (2, 71, .7), (3, 69, .6)],
    10: [(0, 66, 1.5), (2.25, 73, .7), (3.25, 74, .55)],
    11: [(0, 78, 2), (2.75, 76, .85)],
    12: [(0, 74, 1.2), (1.5, 78, .8), (2.75, 76, .7)],
    13: [(.5, 73, 1.1), (2.25, 69, 1.1)],
    14: [(0, 71, 1.1), (1.5, 74, .7), (2.75, 73, .85)],
    15: [(.5, 71, .8), (2, 69, 1.2)],
    16: [(0, 78, 1.6), (2, 81, 1.2)],
    17: [(0, 80, 1.35), (1.75, 76, .7), (3, 73, .7)],
    18: [(0, 76, 1.2), (1.5, 73, .8), (2.75, 69, .7)],
    19: [(.5, 74, 1.3), (2.5, 73, .9)],
    20: [(0, 71, 1.1), (1.5, 74, .8), (2.75, 78, .8)],
    21: [(0, 76, 1.2), (1.5, 73, .8), (2.75, 71, .8)],
    22: [(0, 69, 1.5), (2, 66, 1.5)],
    23: [(1, 64, 2)],
    24: [(0, 74, 1.2), (1.5, 78, .65), (2.5, 76, .8)],
    25: [(.5, 73, 1.2), (2.25, 71, .9)],
    26: [(0, 69, 1.1), (1.5, 73, .8), (2.75, 76, .75)],
    27: [(.5, 74, 1.8), (3, 73, .6)],
    28: [(0, 71, 1.2), (1.75, 69, .8), (3, 66, .65)],
    29: [(0, 64, 1.4), (2, 61, 1.1)],
    30: [(0, 62, 2.8)],
    31: [(2.5, 64, .7), (3.5, 61, .4)],
}


def hz(midi: int) -> float:
    return 440 * 2 ** ((midi - 69) / 12)


def envelope(t: np.ndarray, attack: float, sustain: float, release: float) -> np.ndarray:
    return np.minimum(t / attack, 1) * np.minimum(np.maximum((sustain + release - t) / release, 0), 1)


def piano(midi: int, duration: float, velocity: float, rng: np.random.Generator) -> np.ndarray:
    """Felt electric/acoustic hybrid: detuned, stretched decaying strings.

    A restrained tine transient and low hammer noise avoid sine-wave beeps,
    with a gentle release after the key is lifted.
    """
    t = np.arange(round((duration + 1.1) * RATE)) / RATE
    f = hz(midi)
    tone = np.zeros_like(t)
    for partial, strength, decay in [(1, 1, 3.0), (2, .30, 1.6), (3, .11, .85), (4, .055, .48), (5, .022, .30)]:
        pf = f * partial * math.sqrt(1 + .000035 * partial * partial)
        phase = rng.uniform(-.04, .04)
        pair = np.sin(2 * np.pi * pf * t + phase)
        pair += .23 * np.sin(2 * np.pi * pf * 1.0008 * t + phase)
        tone += strength * pair * np.exp(-t / (decay * (1.15 if midi < 65 else .85)))
    tine = np.sin(2 * np.pi * f * t + .55 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t / .18))
    tone += .13 * tine * np.exp(-t / .85)
    noise = rng.normal(0, 1, len(t))
    hammer = np.convolve(noise, np.ones(13) / 13, mode="same") * np.exp(-t / .011)
    tone += hammer * .13
    release = np.exp(-np.maximum(t - duration, 0) / .23)
    return tone * np.minimum(t / .005, 1) * release * velocity * .145


def pad(midi: int, duration: float, phase: float) -> np.ndarray:
    t = np.arange(round((duration + 2.4) * RATE)) / RATE
    f = hz(midi)
    tone = np.zeros_like(t)
    for detune in [-.0018, .0011]:
        for harmonic, level in [(1, .78), (2, .16), (3, .065), (4, .025)]:
            tone += level * np.sin(2 * np.pi * f * harmonic * (1 + detune) * t + phase)
    drift = .92 + .08 * np.sin(2 * np.pi * .17 * t + phase)
    return tone * envelope(t, .85, duration, 2.4) * drift * .029


def bass(midi: int, duration: float) -> np.ndarray:
    t = np.arange(round((duration + .22) * RATE)) / RATE
    f = hz(midi)
    tone = np.sin(2 * np.pi * f * t) + .24 * np.sin(2 * np.pi * f * 2 * t)
    tone += .07 * np.sin(2 * np.pi * f * 3 * t) * np.exp(-t / .3)
    return tone * envelope(t, .018, duration, .22) * np.exp(-t / 2.9) * .13


def drum(kind: str, velocity: float, rng: np.random.Generator) -> np.ndarray:
    duration = .34 if kind == "kick" else .16
    t = np.arange(round(duration * RATE)) / RATE
    noise = rng.normal(0, 1, len(t))
    if kind == "kick":
        # Soft mallet against a muted drum, kept below the piano.
        tone = np.sin(2 * np.pi * (47 * t + 2.7 * (1 - np.exp(-t / .035))))
        return tone * np.exp(-t / .065) * np.minimum(t / .004, 1) * velocity * .16
    if kind == "brush":
        grain = noise - np.convolve(noise, np.ones(27) / 27, mode="same")
        body = np.sin(2 * np.pi * 185 * t) * np.exp(-t / .024)
        return (grain * .26 + body * .30) * np.exp(-t / .034) * np.minimum(t / .002, 1) * velocity * .085
    grain = noise - np.convolve(noise, np.ones(8) / 8, mode="same")
    return grain * np.exp(-t / .018) * np.minimum(t / .0015, 1) * velocity * .027


def add(bus: np.ndarray, voice: np.ndarray, seconds: float, pan: float, gain: float = 1) -> None:
    start = round(seconds * RATE) % FRAMES
    # Constant-power panning; wrap every tail into the next repetition.
    stereo = voice[:, None] * np.array([math.cos((pan + 1) * math.pi / 4), math.sin((pan + 1) * math.pi / 4)]) * gain
    first = min(len(stereo), FRAMES - start)
    bus[start:start + first] += stereo[:first]
    if first < len(stereo):
        bus[:len(stereo) - first] += stereo[first:]


def room(bus: np.ndarray, rng: np.random.Generator) -> np.ndarray:
    """A deterministic, diffuse stereo room, circularly convolved for a true loop."""
    ir_frames = round(2.8 * RATE)
    result = np.zeros_like(bus)
    t = np.arange(ir_frames) / RATE
    for channel in range(2):
        impulse = rng.normal(0, 1, ir_frames) * np.exp(-t / .68)
        impulse = np.convolve(impulse, np.ones(11) / 11, mode="same")
        impulse[:round(.025 * RATE)] = 0
        impulse *= .012
        for delay, level in [(.041, .19), (.073, .13), (.109, .09), (.157, .055)]:
            impulse[round((delay + channel * .007) * RATE)] += level
        padded = np.zeros(FRAMES)
        padded[:ir_frames] = impulse
        result[:, channel] = np.fft.irfft(np.fft.rfft(bus[:, channel]) * np.fft.rfft(padded), n=FRAMES)
    return result


def render() -> np.ndarray:
    rng = np.random.default_rng(SEED)
    dry = np.zeros((FRAMES, 2), dtype=np.float32)
    wet = np.zeros_like(dry)
    for bar, chord_name in enumerate(HARMONY):
        root, notes = CHORDS[chord_name]
        beat = bar * 4
        # The middle eight lift; the closing eight strip back into the opening.
        intensity = .84 if bar < 4 else (1.04 if 16 <= bar < 24 else .94)
        for index, note in enumerate(notes):
            p = -.63 + index * .42
            start = (beat + index * .025) * BEAT
            add(wet, pad(note, 4 * BEAT, index * .7 + bar * .31), start, p, .78 * intensity)
        # Voicings are gently rolled; varied anticipations answer the melody.
        comp = [(0, .65), (1.5, .25), (2.75, .39)]
        if bar % 4 == 3:
            comp = [(0, .58), (2, .34), (3.5, .23)]
        if bar in [0, 1, 23, 30, 31]:
            comp = [(0, .61), (2.5, .25)]
        for offset, vel in comp:
            voicing = notes if offset == 0 else notes[1:]
            for index, note in enumerate(voicing):
                start = (beat + offset) * BEAT + index * .017 + rng.uniform(-.008, .008)
                sound = piano(note, (1.55 if offset == 0 else .85) * BEAT, vel * intensity * rng.uniform(.93, 1.05), rng)
                add(wet, sound, start, -.20 + index * .13)
        add(dry, bass(root, 1.9 * BEAT), beat * BEAT + .009, -.04, .88 * intensity)
        # A fifth, octave or passing pickup gives the bass a phrase, not a drone.
        if bar not in [0, 1, 23, 30]:
            pickup = root + (7 if bar % 2 == 0 else 12)
            add(dry, bass(pickup, .82 * BEAT), (beat + 2.5) * BEAT, .04, .48)
        for offset, note, length in MELODY.get(bar, []):
            sound = piano(note, length * BEAT, .75 * rng.uniform(.93, 1.05), rng)
            add(wet, sound, (beat + offset) * BEAT + rng.uniform(-.010, .010), .14, .95)
        # No full beat until bar 8; brushes become sparser again in the coda.
        if 4 <= bar < 30:
            full = 8 <= bar < 24
            for offset in ([0, 2] if full else [0]):
                add(dry, drum("kick", .76 if full else .50, rng), (beat + offset) * BEAT, -.06)
            for offset in ([1, 3] if full else [3]):
                add(wet, drum("brush", .74 if full else .52, rng), (beat + offset) * BEAT + .012, .13)
            for step in range(8):
                if not full and step % 2 == 0:
                    continue
                swing = .045 if step % 2 else 0
                add(dry, drum("shaker", .64 if step % 2 else .40, rng), (beat + step / 2 + swing) * BEAT, -.43 if step % 2 else .42)
    mixed = dry + wet * .86 + room(wet, rng) * .28
    # Very gentle saturation catches only coincident attacks; retain headroom
    # for the UI sounds and the browser's final safety compressor.
    mixed = np.tanh(mixed * 1.35) / 1.35
    mixed -= np.mean(mixed, axis=0)
    peak = float(np.max(np.abs(mixed)))
    mixed *= .76 / peak
    return mixed.astype(np.float32)


def verify(samples: np.ndarray) -> dict[str, float | int]:
    assert len(HARMONY) == BARS
    assert len(samples) == FRAMES and samples.shape[1] == 2
    assert np.isfinite(samples).all()
    peak = float(np.max(np.abs(samples)))
    rms = float(np.sqrt(np.mean(samples * samples)))
    seam = float(np.max(np.abs(samples[0] - samples[-1])))
    max_step = float(np.max(np.abs(np.diff(samples, axis=0))))
    # No clipping, accidental near-silence or exceptional click at the wrap.
    assert .70 < peak < .80, peak
    assert .045 < rms < .23, rms
    assert seam < .015 and seam < max_step, (seam, max_step)
    return {"sampleRate": RATE, "frames": FRAMES, "durationSeconds": FRAMES / RATE, "peak": round(peak, 6), "rms": round(rms, 6), "loopBoundaryStep": round(seam, 6)}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--verify", action="store_true", help="Render and validate without writing the asset")
    args = parser.parse_args()
    samples = render()
    metadata = verify(samples)
    if args.verify:
        print(json.dumps(metadata, indent=2))
        return
    OUT.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="projectquest-score-") as directory:
        wav = Path(directory) / "score.wav"
        with wave.open(str(wav), "wb") as file:
            file.setnchannels(2)
            file.setsampwidth(2)
            file.setframerate(RATE)
            file.writeframes((samples * 32767).astype("<i2").tobytes())
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(wav), "-c:a", "libvorbis", "-q:a", "5", "-map_metadata", "-1", "-metadata", "title=First Light at Riverside", "-metadata", "artist=ProjectQuest original score", "-metadata", "comment=Original procedural composition; source in src/audio/render_score.py", str(OUT / "first-light.ogg")], check=True)
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(wav), "-c:a", "libmp3lame", "-q:a", "4", "-map_metadata", "-1", str(OUT / "first-light.mp3")], check=True)
    metadata.update({"title": "First Light at Riverside", "bpm": BPM, "bars": BARS, "seed": SEED, "sha256": hashlib.sha256((OUT / "first-light.ogg").read_bytes()).hexdigest()})
    (OUT / "score-metadata.json").write_text(json.dumps(metadata, indent=2) + "\n")
    print(json.dumps(metadata, indent=2))


if __name__ == "__main__":
    main()
