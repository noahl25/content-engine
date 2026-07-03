#!/usr/bin/env python3
"""Fetch brand logos + photos for a storyboard into remotion/public/assets/.

Two asset kinds (declared in a storyboard's top-level "assets" array, or via CLI):
  - logo:  monochrome brand SVG from simple-icons (jsdelivr). Saved as a single-path
           SVG so the renderer can recolor it to any B&W theme tone via CSS mask.
           -> remotion/public/assets/logos/<slug>.svg   (referenced as assets/logos/<slug>.svg)
  - photo: a real photo from Pexels (portrait), rendered DESATURATED to fit the B&W look.
           -> remotion/public/assets/img/<id>.jpg       (referenced as assets/img/<id>.jpg)
  - image: an AI-GENERATED illustration (Gemini 2.5 Flash Image, monochrome, text-free) for a
           bespoke concept no logo/photo can supply. Same output path as a photo, so the
           renderer uses it via the SAME <Photo id="<id>"/> component.
           -> remotion/public/assets/img/<id>.jpg       (referenced as assets/img/<id>.jpg)

Storyboard manifest example:
  "assets": [
    {"type": "logo",  "slug": "kubernetes"},
    {"type": "logo",  "slug": "docker"},
    {"type": "photo", "id": "datacenter", "query": "server room dark"},
    {"type": "image", "id": "embeddings", "prompt": "words as glowing points in a 3-D meaning-space"}
  ]

Usage:
  python scripts/fetch_assets.py --storyboard storyboards/<slug>.json
  python scripts/fetch_assets.py --logo kubernetes --logo docker
  python scripts/fetch_assets.py --photo "server room dark:datacenter"
  python scripts/fetch_assets.py --image "words as points in a meaning-space:embeddings"

Logos are the workhorse (free, monochrome, recolorable). Photos are optional accents.
Find a logo slug at https://simpleicons.org (slug = lowercase, no spaces; e.g. "amazonaws",
"openai", "pytorch", "nvidia"). Missing slugs are reported, not fatal — the scene falls
back to a lucide icon.
"""
import argparse, json, os, re, sys
import requests

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ceconfig  # noqa: E402

HOME = os.path.expanduser("~")
ROOT = ceconfig.ROOT
PUB = os.path.join(ROOT, "remotion", "public", "assets")
LOGO_DIR = os.path.join(PUB, "logos")
IMG_DIR = os.path.join(PUB, "img")

# simple-icons via jsdelivr (single-path monochrome SVG, recolorable as a CSS mask)
SI_URL = "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/{slug}.svg"
# fallback that serves a colored variant + always 200 for valid slugs
SI_CDN = "https://cdn.simpleicons.org/{slug}/ededee"


def slugify(s):
    return re.sub(r"[^a-z0-9]", "", s.lower())


def read_key(path):
    try:
        return open(path).read().strip()
    except Exception:
        return None


def fetch_logo(slug):
    slug = slugify(slug)
    os.makedirs(LOGO_DIR, exist_ok=True)
    out = os.path.join(LOGO_DIR, f"{slug}.svg")
    if os.path.exists(out) and os.path.getsize(out) > 0:
        print(f"  logo {slug}: cached")
        return ("logo", slug, True)
    for url in (SI_URL.format(slug=slug), SI_CDN.format(slug=slug)):
        try:
            r = requests.get(url, timeout=20)
            if r.status_code == 200 and "<svg" in r.text:
                # normalize: force a single fill so CSS-mask recolor is clean
                svg = r.text
                open(out, "w").write(svg)
                print(f"  logo {slug}: ok ({len(svg)}b)")
                return ("logo", slug, True)
        except Exception as e:
            print(f"  logo {slug}: {url} error {e}", file=sys.stderr)
    print(f"  logo {slug}: NOT FOUND (scene should fall back to a lucide icon)", file=sys.stderr)
    return ("logo", slug, False)


def fetch_photo(query, ident):
    ident = slugify(ident or query)
    os.makedirs(IMG_DIR, exist_ok=True)
    out = os.path.join(IMG_DIR, f"{ident}.jpg")
    if os.path.exists(out) and os.path.getsize(out) > 0:
        print(f"  photo {ident}: cached")
        return ("photo", ident, True)
    key = ceconfig.key("pexels")
    if not key:
        print("  photo: no Pexels key (keys.pexels in config.json or CE_PEXELS_KEY)", file=sys.stderr)
        return ("photo", ident, False)
    try:
        r = requests.get(
            "https://api.pexels.com/v1/search",
            params={"query": query, "per_page": 1, "orientation": "portrait"},
            headers={"Authorization": key}, timeout=25,
        )
        photos = r.json().get("photos", [])
        if not photos:
            print(f"  photo {ident}: no result for '{query}'", file=sys.stderr)
            return ("photo", ident, False)
        src = photos[0]["src"].get("large2x") or photos[0]["src"]["large"]
        img = requests.get(src, timeout=30).content
        open(out, "wb").write(img)
        print(f"  photo {ident}: ok ({len(img)//1024}kb) <- {query}")
        return ("photo", ident, True)
    except Exception as e:
        print(f"  photo {ident}: error {e}", file=sys.stderr)
        return ("photo", ident, False)


def fetch_image(prompt, ident, style="bw", extra=None):
    """AI-generate an illustration via Gemini (gen_image.py). style: bw|color|duotone|<custom>."""
    ident = slugify(ident or prompt)
    out = os.path.join(IMG_DIR, f"{ident}.jpg")
    if os.path.exists(out) and os.path.getsize(out) > 0:
        print(f"  image {ident}: cached")
        return ("image", ident, True)
    if not prompt:
        print(f"  image {ident}: no prompt", file=sys.stderr)
        return ("image", ident, False)
    try:
        import gen_image
        gen_image.generate(prompt, out, style=style, extra=extra)
        print(f"  image {ident}: ok ({style}) <- {prompt[:56]}")
        return ("image", ident, True)
    except Exception as e:
        print(f"  image {ident}: FAILED {e} (scene should fall back to an icon/canvas)", file=sys.stderr)
        return ("image", ident, False)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--storyboard")
    ap.add_argument("--logo", action="append", default=[])
    ap.add_argument("--photo", action="append", default=[],
                    help='"query:id" — e.g. "server room dark:datacenter"')
    ap.add_argument("--image", action="append", default=[],
                    help='"prompt:id" — AI-generate an illustration')
    ap.add_argument("--style", default="bw", help="default image style: bw|color|duotone|<custom>")
    ap.add_argument("--art-note", default=None, help="consistent per-video art-style directive")
    a = ap.parse_args()

    # photo-mode videos set a top-level `art_style` (bw|color|duotone|custom) applied to every image,
    # and optionally `art_note` (a consistency directive) so all images in one video share a look.
    default_style, art_note = a.style, a.art_note
    assets = []
    if a.storyboard:
        sb = json.load(open(a.storyboard))
        assets += sb.get("assets", [])
        default_style = sb.get("art_style", default_style)
        art_note = sb.get("art_note", art_note)
    for s in a.logo:
        assets.append({"type": "logo", "slug": s})
    for p in a.photo:
        q, _, i = p.partition(":")
        assets.append({"type": "photo", "query": q, "id": i})
    for m in a.image:
        pr, _, i = m.partition(":")
        assets.append({"type": "image", "prompt": pr, "id": i})

    if not assets:
        print("no assets to fetch")
        return

    print(f"fetching {len(assets)} asset(s) -> {PUB}  (image style: {default_style})")
    results = []
    for asset in assets:
        t = asset.get("type")
        if t == "logo":
            results.append(fetch_logo(asset["slug"]))
        elif t == "photo":
            results.append(fetch_photo(asset.get("query", ""), asset.get("id")))
        elif t == "image":
            results.append(fetch_image(asset.get("prompt", ""), asset.get("id"),
                                        asset.get("style", default_style), extra=art_note))
        else:
            print(f"  skip unknown asset type: {t}", file=sys.stderr)

    ok = sum(1 for _, _, good in results if good)
    print(f"done: {ok}/{len(results)} fetched")


if __name__ == "__main__":
    main()
