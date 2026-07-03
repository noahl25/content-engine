#!/usr/bin/env python3
"""
gen_image.py — generate an image with Google **Gemini 2.5 Flash Image** (aka "Nano Banana"),
reusing the same key as voice.py (config keys.gemini).

Supports several art-direction STYLES so it works for both explainer formats:
  - bw       (default, on-brand): monochrome editorial illustration, desaturated on save.
  - color    (NotebookLM look): cohesive full-color illustration, saved in color.
  - duotone  : near-black + one restrained accent tint.
  - <custom> : any other string is used verbatim as the art-direction preamble.
You can also pass an `extra` directive (a per-video "consistent art style" note) that's appended so
every image in a photo-mode video shares one look. Output is a portrait JPG under
remotion/public/assets/img/<id>.jpg, rendered by the existing <Photo id="<id>"/> component.

API: POST .../models/gemini-2.5-flash-image:generateContent?key=...
     body { contents:[{parts:[{text: PROMPT}]}], generationConfig:{ responseModalities:["IMAGE"] } }
     -> candidates[0].content.parts[].inlineData.data  (base64 image)

Usage:
    python scripts/gen_image.py --id embeddings --prompt "words as points in a meaning-space"
    python scripts/gen_image.py --id gpu --prompt "..." --style color
    python scripts/gen_image.py --id x --prompt "..." --style bw --extra "flat cut-paper collage"
"""
import argparse, base64, json, os, subprocess, sys, urllib.request, urllib.error

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ceconfig  # noqa: E402

ROOT = ceconfig.ROOT
IMG_DIR = os.path.join(ROOT, "remotion", "public", "assets", "img")
MODEL = os.environ.get("GEMINI_IMAGE_MODEL",
                       (ceconfig.cfg().get("visuals", {}) or {}).get("ai_image_model", "gemini-2.5-flash-image"))

_NO_TEXT = "NO text, NO letters, NO watermark, NO logos, NO UI. Vertical 9:16, subject centered with breathing room. "

# name -> (art-direction preamble, desaturate_on_save)
STYLES = {
    "bw": (
        "A minimalist, editorial BLACK-AND-WHITE monochrome illustration. "
        "Near-black background (#0a0b0d), crisp light-grey and white linework and forms, high "
        "contrast, lots of negative space, clean and premium, subtle grain. Flat — NO gradients, "
        "NO glow, NO color at all. " + _NO_TEXT,
        True,
    ),
    "color": (
        "A cohesive, modern FULL-COLOR editorial illustration in a clean, warm, slightly painterly "
        "flat-vector style (think a tasteful explainer-video illustration): a limited, harmonious "
        "palette, soft depth, confident shapes, premium and uncluttered. " + _NO_TEXT,
        False,
    ),
    "duotone": (
        "A refined DUOTONE illustration: a near-black base (#0a0b0d) plus ONE restrained blue-grey "
        "accent tint (#9bb1cf) and off-white — no other colors. Editorial, high-contrast, lots of "
        "negative space, subtle grain, flat (no gradients/glow). " + _NO_TEXT,
        False,
    ),
}


def _resolve_style(style):
    """Return (preamble, desaturate). Known name -> preset; anything else -> custom preamble."""
    if not style:
        style = "bw"
    if style in STYLES:
        return STYLES[style]
    # custom art-direction string: use verbatim, keep color (don't desaturate).
    return (style.rstrip() + ". " + _NO_TEXT, False)


def generate(prompt, out_jpg, style="bw", extra=None, monochrome=None):
    # back-compat: old callers pass monochrome=True/False
    if monochrome is not None and style == "bw":
        style = "bw" if monochrome else "color"
    key = ceconfig.key("gemini")
    if not key:
        raise RuntimeError("no Gemini key (keys.gemini in config.json or CE_GEMINI_KEY) — cannot generate images")
    preamble, desaturate = _resolve_style(style)
    full = preamble + prompt.strip()
    if extra:
        full += f"  Consistent art style: {extra.strip()}."
    url = (f"https://generativelanguage.googleapis.com/v1beta/models/"
           f"{MODEL}:generateContent?key={key}")
    body = json.dumps({
        "contents": [{"parts": [{"text": full}]}],
        "generationConfig": {"responseModalities": ["IMAGE"]},
    }).encode()
    req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            data = json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"Gemini image API HTTP {e.code}: {e.read().decode()[:300]}") from e

    parts = (data.get("candidates") or [{}])[0].get("content", {}).get("parts", [])
    raw = None
    for p in parts:
        inl = p.get("inlineData") or p.get("inline_data")
        if inl and inl.get("data"):
            raw = base64.b64decode(inl["data"])
            break
    if raw is None:
        raise RuntimeError(f"no image in Gemini response: {json.dumps(data)[:300]}")

    os.makedirs(os.path.dirname(out_jpg), exist_ok=True)
    # decode whatever came back (png/webp/jpg) -> portrait 1080x1920 jpg via ffmpeg; desaturate for bw.
    vf = ("format=gray," if desaturate else "") + \
        "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920"
    subprocess.run(
        f'ffmpeg -y -i pipe:0 -vf "{vf}" -q:v 3 {json.dumps(out_jpg)}',
        input=raw, shell=True, check=True,
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return out_jpg


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--id", required=True, help="asset id -> assets/img/<id>.jpg (used as <Photo id=...>)")
    ap.add_argument("--prompt", required=True)
    ap.add_argument("--style", default="bw", help="bw | color | duotone | <custom art-direction string>")
    ap.add_argument("--extra", help="a consistent per-video art-style directive appended to the prompt")
    ap.add_argument("--color", action="store_true", help="alias for --style color")
    ap.add_argument("--out")
    a = ap.parse_args()
    out = a.out or os.path.join(IMG_DIR, f"{a.id}.jpg")
    style = "color" if a.color else a.style
    try:
        generate(a.prompt, out, style=style, extra=a.extra)
        print(f"  image {a.id}: ok ({style}) -> {out}")
    except Exception as e:
        print(f"  image {a.id}: FAILED {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
