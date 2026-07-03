#!/usr/bin/env python3
"""
scene_stills.py — render ONE still per scene so the producing agent can visually
QA its own work (catch overlaps, off-canvas text, touching boxes, low contrast)
BEFORE sending the video. Reads remotion/src/story-props.json for per-scene
durationInFrames, renders the mid-frame of each scene to output/stills/<slug>/.

Usage: scene_stills.py <slug>
Prints the absolute path of each still (read them all with your vision).
"""
import json, os, subprocess, sys

ROOT = os.path.expanduser("~/claude/content-engine")
PROPS = os.path.join(ROOT, "remotion/src/story-props.json")


def main():
    if len(sys.argv) < 2:
        print("usage: scene_stills.py <slug>", file=sys.stderr)
        sys.exit(2)
    slug = sys.argv[1]
    p = json.load(open(PROPS))
    scenes = p["scenes"] if isinstance(p, dict) else p
    fps = (p.get("fps") if isinstance(p, dict) else None) or 30

    outdir = os.path.join(ROOT, "output/stills", slug)
    os.makedirs(outdir, exist_ok=True)

    acc, paths = 0, []
    for i, s in enumerate(scenes):
        df = int(s.get("durationInFrames", fps * 2))
        mid = acc + max(1, df // 2)
        acc += df
        out = os.path.join(outdir, f"scene_{i:02d}_{s.get('type','?')}.png")
        cmd = [
            "node_modules/.bin/remotion", "still", "src/index.ts",
            "TechExplainer", out, f"--frame={mid}",
        ]
        r = subprocess.run(cmd, cwd=os.path.join(ROOT, "remotion"),
                           capture_output=True, text=True)
        if r.returncode == 0 and os.path.exists(out):
            paths.append(out)
            print(out)
        else:
            print(f"FAILED scene {i}: {r.stderr.strip().splitlines()[-1:]}", file=sys.stderr)

    print(f"\n{len(paths)} stills in {outdir}", file=sys.stderr)


if __name__ == "__main__":
    main()
