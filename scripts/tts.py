#!/usr/bin/env python3
"""
tts.py — narration + word-level timings for Remotion captions.

Run with the venv that has faster-whisper (the trading venv):
    ~/claude/trading/.venv/bin/python scripts/tts.py --text-file script.txt \
        --topic "BLACK HOLES" --hook "Not even light escapes." --icon Orbit

1. Synthesizes speech with Piper (content-engine venv) -> remotion/public/narration.wav
2. Aligns word timestamps with faster-whisper -> writes Remotion props JSON
   (topic, hook, accentIcon, audioDurationSec, words[]) to remotion/src/sample-props.json
"""
import argparse, json, os, shlex, subprocess

HOME = os.path.expanduser("~")
PIPER = f"{HOME}/claude/content-engine/.venv/bin/piper"
VOICE = f"{HOME}/claude/content-engine/tts/voices/en_US-ryan-high.onnx"


def synth(text, out_wav):
    os.makedirs(os.path.dirname(out_wav), exist_ok=True)
    cmd = f'{shlex.quote(PIPER)} -m {shlex.quote(VOICE)} -c {shlex.quote(VOICE + ".json")} -f {shlex.quote(out_wav)}'
    subprocess.run(cmd, input=text.encode(), shell=True, check=True)


def align(wav, model="base"):
    from faster_whisper import WhisperModel
    m = WhisperModel(model, device="cpu", compute_type="int8")
    segs, info = m.transcribe(wav, word_timestamps=True, vad_filter=False)
    words = []
    for s in segs:
        for w in (s.words or []):
            words.append({"word": w.word.strip(), "start": round(w.start, 3), "end": round(w.end, 3)})
    return words, info.duration


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--text")
    ap.add_argument("--text-file")
    ap.add_argument("--out", default=f"{HOME}/claude/content-engine/remotion/public/narration.wav")
    ap.add_argument("--props", default=f"{HOME}/claude/content-engine/remotion/src/sample-props.json")
    ap.add_argument("--topic", default="")
    ap.add_argument("--hook", default="")
    ap.add_argument("--icon", default="Atom")
    ap.add_argument("--model", default="base")
    a = ap.parse_args()

    text = a.text if a.text else open(a.text_file).read().strip()
    synth(text, a.out)
    words, dur = align(a.out, a.model)
    props = {
        "topic": a.topic,
        "hook": a.hook,
        "accentIcon": a.icon,
        "audioDurationSec": round(dur, 3),
        "words": words,
    }
    json.dump(props, open(a.props, "w"), indent=2)
    print(f"synth ok: {dur:.1f}s, {len(words)} words -> {a.out}")
    print(f"props -> {a.props}")


if __name__ == "__main__":
    main()
