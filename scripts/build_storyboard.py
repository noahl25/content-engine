#!/usr/bin/env python3
"""
build_storyboard.py — turn an authored storyboard into a render-ready Remotion props file.

Input storyboard JSON:
{
  "topic": "DOCKER",
  "icon": "Container",
  "scenes": [
    {"type": "title",   "narration": "Docker, explained in thirty seconds.", "props": {...}},
    {"type": "compare", "narration": "...", "props": {...}},
    ...
  ]
}

Steps: concatenate the per-scene narration → ElevenLabs TTS (+ word timings) →
assign each scene a frame duration from where its words fall on the timeline →
write remotion/src/story-props.json + remotion/public/narration.mp3.

Run with the trading venv (faster-whisper available for the Piper fallback):
    ~/claude/trading/.venv/bin/python scripts/build_storyboard.py --storyboard sb.json
"""
import argparse, json, os, sys, subprocess

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import voice  # noqa
import ceconfig  # noqa

HOME = os.path.expanduser("~")
FPS = 30


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--storyboard", required=True)
    ap.add_argument("--out-audio", default=f"{HOME}/claude/content-engine/remotion/public/narration.mp3")
    ap.add_argument("--out-props", default=f"{HOME}/claude/content-engine/remotion/src/story-props.json")
    ap.add_argument("--backend", default="elevenlabs")
    ap.add_argument("--voice", default=voice.DEFAULT_VOICE)
    a = ap.parse_args()

    sb = json.load(open(a.storyboard))
    scenes = sb["scenes"]
    full_text = " ".join(s["narration"].strip() for s in scenes)

    # fetch any brand logos / photos the storyboard declares (into remotion/public/assets/)
    # so realistic-UI scenes (terminal / cards / panels / BrandLogo) have their assets at render.
    if sb.get("assets"):
        try:
            subprocess.run(
                [sys.executable, os.path.join(os.path.dirname(__file__), "fetch_assets.py"),
                 "--storyboard", a.storyboard], check=False)
        except Exception as e:
            print(f"  (asset fetch skipped: {e})")

    words, dur = voice.synth(full_text, a.out_audio, backend=a.backend, voice=a.voice)
    n_al = len(words)

    # assign aligned words to scenes proportionally to each scene's text word count
    counts = [max(1, len(s["narration"].split())) for s in scenes]
    n_text = sum(counts)
    ratio = n_al / max(1, n_text)

    out_scenes = []
    cum_text = 0
    used_frames = 0
    for i, s in enumerate(scenes):
        cum_text_next = cum_text + counts[i]
        if i == len(scenes) - 1:
            end_time = dur
        else:
            idx = min(max(round(cum_text_next * ratio) - 1, 0), n_al - 1)
            end_time = words[idx]["end"] if n_al else dur
        end_frame = round(end_time * FPS)
        durf = max(FPS // 2, end_frame - used_frames)  # ≥0.5s per scene
        out_scenes.append({"type": s["type"], "props": s.get("props", {}), "durationInFrames": durf})
        used_frames += durf
        cum_text = cum_text_next

    # top bar (icon + topic + progress): per-video `topBar`/`progress` override the config default.
    vis = ceconfig.cfg().get("visuals", {}) or {}
    top_bar = sb.get("topBar", vis.get("top_bar", True))
    progress = sb.get("progress", vis.get("progress_bar", True))

    props = {
        "topic": sb["topic"],
        "icon": sb.get("icon", "Cpu"),
        "audioFile": os.path.basename(a.out_audio),
        "audioDurationSec": dur,
        "words": words,
        "scenes": out_scenes,
        "topBar": bool(top_bar),
        "progress": bool(progress),
    }
    json.dump(props, open(a.out_props, "w"), indent=2)

    # keep the custom-scene registry in sync with whatever .tsx files exist, so any
    # agent-authored "custom" scenes are importable by the renderer.
    try:
        import subprocess
        subprocess.run([sys.executable, os.path.join(os.path.dirname(__file__), "gen_custom_registry.py")], check=False)
    except Exception as e:
        print(f"  (registry regen skipped: {e})")

    total_s = used_frames / FPS
    print(f"ok: audio {dur:.1f}s, {len(scenes)} scenes (timeline {total_s:.1f}s), {n_al} words")
    print(f"  audio -> {a.out_audio}")
    print(f"  props -> {a.out_props}")


if __name__ == "__main__":
    main()
