#!/usr/bin/env python3
"""
review_scenes.py — the IMPECCABLE visual review pass. Renders a still of each scene,
has a vision agent critique them against the impeccable design system, and patches the
scene props in story-props.json to make the scenes more visually appealing — BEFORE the
final full render. Narration / timing / scene order are never touched.

    python scripts/review_scenes.py                 # reviews remotion/src/story-props.json
"""
import argparse, json, os, re, subprocess, sys

ROOT = os.path.expanduser("~/claude/content-engine")
sys.path.insert(0, f"{ROOT}/scripts")
import ideate  # reuse coerce_scene + icon validation

REMOTION = f"{ROOT}/remotion"


def render_stills(props, outdir):
    os.makedirs(outdir, exist_ok=True)
    paths, acc = [], 0
    for i, sc in enumerate(props["scenes"]):
        dur = max(1, sc.get("durationInFrames", 60))
        mid = acc + dur // 2
        p = f"{outdir}/scene_{i}_{sc['type']}.png"
        subprocess.run(["node_modules/.bin/remotion", "still", "src/index.ts", "TechExplainer", p, f"--frame={mid}"],
                       cwd=REMOTION, check=True, capture_output=True)
        paths.append(p)
        acc += dur
    return paths


def parse_array(text):
    text = re.sub(r"^```(json)?|```$", "", text.strip(), flags=re.M).strip()
    st = text.find("[")
    if st < 0:
        raise ValueError("no JSON array in review output")
    depth = 0
    for i in range(st, len(text)):
        if text[i] == "[":
            depth += 1
        elif text[i] == "]":
            depth -= 1
            if depth == 0:
                return json.loads(text[st:i + 1])
    raise ValueError("unbalanced JSON array")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--props", default=f"{ROOT}/remotion/src/story-props.json")
    a = ap.parse_args()

    props = json.load(open(a.props))
    print(f"[review] rendering {len(props['scenes'])} scene stills for impeccable review...")
    stills = render_stills(props, "/tmp/review")

    scenes_lite = [{"type": s["type"], "props": s["props"]} for s in props["scenes"]]
    prompt = open(f"{ROOT}/prompts/review.md").read()
    prompt += "\n\nSTORYBOARD SCENES:\n" + json.dumps(scenes_lite, indent=2)
    prompt += "\n\nRENDERED STILLS (Read each image, in order):\n" + "\n".join(
        f"scene {i} ({props['scenes'][i]['type']}): {p}" for i, p in enumerate(stills))

    print("[review] running impeccable visual critique (vision)...")
    out = subprocess.run(["claude", "-p", prompt, "--output-format", "text", "--dangerously-skip-permissions"],
                         capture_output=True, text=True, timeout=900)
    if out.returncode != 0:
        print(f"[review] critique failed, skipping: {out.stderr[-300:]}", file=sys.stderr)
        return

    try:
        arr = parse_array(out.stdout)
    except Exception as e:
        print(f"[review] couldn't parse review ({e}); leaving scenes unchanged", file=sys.stderr)
        return
    if len(arr) != len(props["scenes"]):
        print(f"[review] got {len(arr)} scenes, expected {len(props['scenes'])}; skipping patch", file=sys.stderr)
        return

    changed = 0
    for orig, rev in zip(props["scenes"], arr):
        if rev.get("type") != orig["type"]:
            continue
        c = ideate.coerce_scene({"type": orig["type"], "narration": "", "props": rev.get("props", {})})
        if c and c["props"] != orig["props"]:
            orig["props"] = c["props"]
            changed += 1
    json.dump(props, open(a.props, "w"), indent=2)
    print(f"[review] impeccable pass patched {changed}/{len(props['scenes'])} scenes -> {a.props}")


if __name__ == "__main__":
    main()
