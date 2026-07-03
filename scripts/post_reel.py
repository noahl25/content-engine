#!/usr/bin/env python3
"""
post_reel.py — auto-post a finished reel to Instagram via the stealth-browser MCP (reasoner-driven).

    python scripts/post_reel.py --slug what-a-cpu-cache-...     # posts output/<slug>.mp4
    python scripts/post_reel.py --slug <slug> --dry-run         # build the agent prompt, don't post

Reads the caption + hashtags from storyboards/<slug>.json, hands the video + caption to a headless
`claude -p` agent running prompts/post.md (which uses the stealth-browser MCP), and appends the
result to memory/post_log.csv. Requires being logged into the channel account in the stealth profile.
"""
import argparse, csv, json, os, re, subprocess, sys, datetime

ROOT = os.path.expanduser("~/claude/content-engine")
LOG = f"{ROOT}/memory/post_log.csv"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--slug", required=True)
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()

    video = f"{ROOT}/output/{a.slug}.mp4"
    sb = f"{ROOT}/storyboards/{a.slug}.json"
    if not os.path.exists(video):
        sys.exit(f"No video at {video}")
    doc = json.load(open(sb)) if os.path.exists(sb) else {}
    caption = doc.get("caption", "")
    hashtags = doc.get("hashtags", [])

    prompt = open(f"{ROOT}/prompts/post.md").read()
    prompt += f"\n\n--- INPUTS ---\nVIDEO: {video}\nCAPTION:\n{caption}\nHASHTAGS: {' '.join('#' + h for h in hashtags)}\n"

    if a.dry_run:
        print(prompt)
        print("\n[post] --dry-run: not posting.")
        return

    print(f"[post] posting {a.slug} via stealth browser...")
    out = subprocess.run(
        ["claude", "-p", prompt, "--output-format", "text", "--dangerously-skip-permissions"],
        capture_output=True, text=True, timeout=900,
    )
    res = {"ok": False, "error": "no result"}
    m = re.search(r"\{.*\}", out.stdout, re.S)
    if m:
        try:
            res = json.loads(m.group(0))
        except Exception:
            res = {"ok": False, "error": "unparseable agent output", "raw": out.stdout[-200:]}
    print(f"[post] result: {res}")

    # log
    os.makedirs(os.path.dirname(LOG), exist_ok=True)
    new = not os.path.exists(LOG)
    with open(LOG, "a", newline="") as f:
        w = csv.writer(f)
        if new:
            w.writerow(["posted_date", "slug", "topic", "shortcode", "url", "ok",
                        "scene_types", "hook_scene", "caption"])
        scene_types = "|".join(s.get("type", "") for s in doc.get("scenes", []))
        hook = next((s.get("narration", "")[:80] for s in doc.get("scenes", []) if s.get("type") == "title"), "")
        w.writerow([datetime.date.today().isoformat(), a.slug, doc.get("topic", ""),
                    res.get("shortcode", ""), res.get("url", ""), res.get("ok", False),
                    scene_types, hook, caption[:200]])
    print(f"[post] logged -> {LOG}")

    if res.get("ok"):
        # human-readable link store (easy reference; tracker uses post_log.csv shortcodes)
        with open(f"{ROOT}/memory/posted.md", "a") as f:
            f.write(f"- {datetime.date.today().isoformat()} — {doc.get('topic','')} — "
                    f"{res.get('url') or '(url n/a)'} (`{a.slug}`, shortcode `{res.get('shortcode','')}`)\n")
        # mark the queue entry posted
        q = f"{ROOT}/memory/queue.json"
        if os.path.exists(q):
            items = json.load(open(q))
            for e in items:
                if e.get("slug") == a.slug:
                    e["status"] = "posted"
                    e["url"] = res.get("url", "")
                    e["shortcode"] = res.get("shortcode", "")
            json.dump(items, open(q, "w"), indent=2)
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()
