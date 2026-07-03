#!/usr/bin/env python3
"""
ideate.py — the ideation reasoner. Picks a topic, asks the headless `claude` CLI to
write a storyboard, validates/coerces it against the scene schema + real Lucide icons,
and writes storyboards/<slug>.json. Optionally chains build + render.

    python scripts/ideate.py                      # next pending topic from topics.json
    python scripts/ideate.py --topic "How DNS works"
    python scripts/ideate.py --render             # also build narration + render the mp4

Run with the trading venv if you use --render (build_storyboard needs faster-whisper for
the Piper fallback); plain python3 is fine for ideation only.
"""
import argparse, json, os, re, subprocess, sys

ROOT = os.path.expanduser("~/claude/content-engine")
ICONS = set(json.load(open(f"{ROOT}/scripts/lucide_icons.json")))
VALID_TYPES = {"title", "compare", "layers", "nodes", "stat", "statement", "canvas", "outro"}


def slugify(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:48]


def pick_topic(arg):
    tj = json.load(open(f"{ROOT}/topics.json"))
    if arg:
        return arg, tj
    if not tj["pending"]:
        sys.exit("No pending topics in topics.json.")
    return tj["pending"][0], tj


def run_reasoner(topic, recent, notes=""):
    prompt = open(f"{ROOT}/prompts/ideate.md").read()
    prompt = prompt.replace("__TOPIC__", topic).replace("__RECENT__", ", ".join(recent) or "(none)")
    if notes:
        prompt += (f"\n\n## REVISION NOTES (highest priority)\nThe user reviewed a previous version of "
                   f"this video and asked for these changes — apply them:\n{notes}\n")
    out = subprocess.run(
        ["claude", "-p", prompt, "--output-format", "text", "--dangerously-skip-permissions"],
        capture_output=True, text=True, timeout=600,
    )
    if out.returncode != 0:
        sys.exit(f"claude -p failed: {out.stderr[-500:]}")
    return out.stdout


def extract_json(text):
    text = text.strip()
    text = re.sub(r"^```(json)?|```$", "", text, flags=re.M).strip()
    start = text.find("{")
    if start < 0:
        raise ValueError("no JSON object in reasoner output")
    depth = 0
    for i in range(start, len(text)):
        if text[i] == "{":
            depth += 1
        elif text[i] == "}":
            depth -= 1
            if depth == 0:
                return json.loads(text[start:i + 1])
    raise ValueError("unbalanced JSON in reasoner output")


def icon(name, default=None):
    return name if name in ICONS else default


def s(v, n=40):
    return str(v).strip()[:n]


def coerce_scene(sc):
    t = sc.get("type")
    if t not in VALID_TYPES:
        return None
    narr = s(sc.get("narration", ""), 240)
    p = sc.get("props", {}) or {}
    out = {}
    if t == "title":
        out = {"title": s(p.get("title", "")), "subtitle": s(p.get("subtitle", ""), 60), "icon": icon(p.get("icon"), "Cpu")}
    elif t == "compare":
        def col(c, tone):
            c = c or {}
            blocks = [s(b, 18) for b in (c.get("blocks") or [])][:5] or ["A", "B", "App"]
            return {"title": s(c.get("title", ""), 16), "icon": icon(c.get("icon"), "Box"), "tone": tone, "blocks": blocks}
        out = {"left": col(p.get("left"), "heavy"), "right": col(p.get("right"), "light")}
    elif t == "layers":
        layers = [{"label": s(L.get("label", ""), 18), "icon": icon(L.get("icon"), "Layers")} for L in (p.get("layers") or [])][:5]
        if len(layers) < 2:
            return None
        out = {"title": s(p.get("title", ""), 30), "layers": layers}
    elif t == "nodes":
        hub = p.get("hub") or {}
        nodes = [{"label": s(N.get("label", ""), 16), "icon": icon(N.get("icon"), "Box")} for N in (p.get("nodes") or [])][:4]
        if len(nodes) < 2:
            return None
        out = {"hub": {"label": s(hub.get("label", "Hub"), 16), "icon": icon(hub.get("icon"), "Cog")}, "nodes": nodes}
    elif t == "stat":
        out = {"value": s(p.get("value", "?"), 10), "label": s(p.get("label", ""), 40)}
    elif t == "statement":
        out = {"text": s(p.get("text", ""), 160), "highlight": s(p.get("highlight", ""), 60)}
    elif t == "canvas":
        def num(v, d=50.0):
            try:
                return max(0.0, min(100.0, float(v)))
            except Exception:
                return d
        els = []
        for e in (p.get("elements") or [])[:14]:
            k = e.get("kind")
            if k == "node":
                els.append({"kind": "node", "x": num(e.get("x")), "y": num(e.get("y")), "w": num(e.get("w", 22)),
                            "label": s(e.get("label", ""), 18), "icon": icon(e.get("icon")), "accent": bool(e.get("accent"))})
            elif k == "icon":
                els.append({"kind": "icon", "x": num(e.get("x")), "y": num(e.get("y")),
                            "name": icon(e.get("name"), "Box"), "size": int(e.get("size", 72) or 72), "accent": bool(e.get("accent"))})
            elif k == "label":
                sz = e.get("size") if e.get("size") in ("s", "m", "l", "xl") else "m"
                els.append({"kind": "label", "x": num(e.get("x")), "y": num(e.get("y")), "text": s(e.get("text", ""), 60), "size": sz, "accent": bool(e.get("accent"))})
            elif k == "edge":
                els.append({"kind": "edge", "x1": num(e.get("x1")), "y1": num(e.get("y1")), "x2": num(e.get("x2")), "y2": num(e.get("y2")), "accent": bool(e.get("accent")), "flow": bool(e.get("flow"))})
            elif k == "circle":
                els.append({"kind": "circle", "x": num(e.get("x")), "y": num(e.get("y")), "r": num(e.get("r", 12)), "accent": bool(e.get("accent"))})
        if len(els) < 2:
            return None
        out = {"elements": els}
    elif t == "outro":
        out = {"cta": s(p.get("cta", "Follow for more"), 24), "handle": s(p.get("handle", "@yourhandle"), 30), "icon": icon(p.get("icon"), "Plus")}
    return {"type": t, "narration": narr, "props": out}


def validate(doc):
    scenes = [coerce_scene(x) for x in (doc.get("scenes") or [])]
    scenes = [x for x in scenes if x]
    if not (4 <= len(scenes) <= 8):
        raise ValueError(f"need 4-8 valid scenes, got {len(scenes)}")
    if scenes[0]["type"] != "title":
        raise ValueError("first scene must be 'title'")
    if scenes[-1]["type"] != "outro":
        # append a default outro if missing
        scenes.append({"type": "outro", "narration": "Follow for one tech concept a day.",
                       "props": {"cta": "Follow for more", "handle": "@yourhandle", "icon": "Plus"}})
    tags = doc.get("hashtags") or []
    tags = [re.sub(r"[^A-Za-z0-9]", "", str(h)) for h in tags if str(h).strip()][:8]
    return {
        "topic": s(doc.get("topic", "TECH"), 14).upper(),
        "icon": icon(doc.get("icon"), "Cpu"),
        "scenes": scenes,
        "caption": s(doc.get("caption", ""), 2000),
        "hashtags": tags,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--topic")
    ap.add_argument("--render", action="store_true")
    ap.add_argument("--backend", default="elevenlabs")
    ap.add_argument("--speed", type=float, default=1.25)
    ap.add_argument("--no-review", action="store_true", help="skip the impeccable visual review pass")
    ap.add_argument("--notes", default="", help="revision notes from the user to apply (regeneration)")
    a = ap.parse_args()

    topic, tj = pick_topic(a.topic)
    recent = tj.get("done", [])[-8:]
    print(f"[ideate] topic: {topic}" + (f" (with revision notes)" if a.notes else ""))
    raw = run_reasoner(topic, recent, a.notes)
    doc = validate(extract_json(raw))
    doc["source_topic"] = topic
    slug = slugify(topic)
    sb_path = f"{ROOT}/storyboards/{slug}.json"
    json.dump(doc, open(sb_path, "w"), indent=2)
    print(f"[ideate] storyboard -> {sb_path}  ({len(doc['scenes'])} scenes)")
    for sc in doc["scenes"]:
        print(f"   - {sc['type']:8} {sc['narration'][:70]}")
    if doc.get("caption"):
        print(f"[ideate] caption: {doc['caption'][:90]}...")
        print(f"[ideate] hashtags: {' '.join('#' + h for h in doc.get('hashtags', []))}")

    # mark done (only when from backlog, not ad-hoc)
    if not a.topic and topic in tj["pending"]:
        tj["pending"].remove(topic)
        tj["done"].append(topic)
        json.dump(tj, open(f"{ROOT}/topics.json", "w"), indent=2)

    if a.render:
        print("[ideate] building narration + props...")
        subprocess.run([sys.executable, f"{ROOT}/scripts/build_storyboard.py",
                        "--storyboard", sb_path, "--backend", a.backend], check=True)
        if not a.no_review:
            print("[ideate] impeccable visual review pass...")
            subprocess.run([sys.executable, f"{ROOT}/scripts/review_scenes.py"], check=False)
        print("[ideate] rendering...")
        full = f"{ROOT}/output/{slug}.full.mp4"
        subprocess.run(["node_modules/.bin/remotion", "render", "src/index.ts",
                        "TechExplainer", full], cwd=f"{ROOT}/remotion", check=True)
        print(f"[ideate] speeding up {a.speed}x...")
        final = f"{ROOT}/output/{slug}.mp4"
        subprocess.run(["bash", f"{ROOT}/scripts/speedup.sh", full, final, str(a.speed)], check=True)
        os.remove(full)
        print(f"[ideate] done -> output/{slug}.mp4")
    else:
        print(f"[ideate] to render: build_storyboard.py --storyboard {sb_path} then remotion render")


if __name__ == "__main__":
    main()
