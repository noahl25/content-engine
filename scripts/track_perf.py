#!/usr/bin/env python3
"""
track_perf.py — the self-improvement loop. Gets the channel's own analytics + per-reel performance,
joins to what we posted (memory/post_log.csv), writes memory/performance.csv + memory/analytics.csv,
and distills memory/LEARNINGS.md (which the ideation reasoner reads to favor what works).

Data source: python requests against Instagram's web API FIRST (cheap), and if that is blocked /
empty / login-walled, transparently FALLS BACK to the stealth browser (reads the profile + reels via
the logged-in session — block-proof). Force a path with --source requests|browser|auto (default auto).

    python scripts/track_perf.py
"""
import argparse, csv, json, os, re, subprocess, sys, datetime
import http.cookiejar, urllib.request, urllib.parse
from collections import defaultdict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ceconfig  # noqa: E402

ROOT = ceconfig.ROOT
# The CHANNEL's own posting-account session — its analytics + per-reel performance (the posting
# account, NOT the trends account which is used only for outward trend analysis / downloads).
COOKIES = os.environ.get("IG_COOKIES") or ceconfig.cookies("posting")
APP_ID = "936619743392459"
UA = ("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) "
      "Chrome/126.0.0.0 Safari/537.36")


class Blocked(Exception):
    pass


def handle():
    return ceconfig.handle()


def _jar():
    cj = http.cookiejar.MozillaCookieJar()
    cj.load(COOKIES, ignore_discard=True, ignore_expires=True)
    return {c.name: c.value for c in cj}


# ── path 1: python requests (IG web API) ─────────────────────────────────────
def fetch_requests(user):
    if not os.path.exists(COOKIES):
        raise Blocked(f"no cookie file {COOKIES}")
    j = _jar()
    if "sessionid" not in j:
        raise Blocked("cookie file has no sessionid")
    url = f"https://www.instagram.com/api/v1/users/web_profile_info/?username={urllib.parse.quote(user)}"
    req = urllib.request.Request(url, headers={
        "User-Agent": UA, "X-IG-App-ID": APP_ID, "X-Requested-With": "XMLHttpRequest",
        "Referer": f"https://www.instagram.com/{user}/",
        "Cookie": "; ".join(f"{k}={v}" for k, v in j.items()),
        "X-CSRFToken": j.get("csrftoken", ""),
    })
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            data = json.loads(r.read().decode())
    except Exception as e:
        raise Blocked(f"request failed: {e}")
    u = (data.get("data") or {}).get("user")
    if not u:
        raise Blocked("no user object (login-walled or changed endpoint)")
    followers = (u.get("edge_followed_by") or {}).get("count")
    metrics = {}
    for e in ((u.get("edge_owner_to_timeline_media") or {}).get("edges") or []):
        n = e.get("node", {})
        code = n.get("shortcode")
        if not code:
            continue
        metrics[code] = {
            "views": n.get("video_view_count") or 0,
            "likes": (n.get("edge_liked_by") or {}).get("count", 0),
            "comments": (n.get("edge_media_to_comment") or {}).get("count", 0),
        }
    if not metrics:
        raise Blocked("empty media list")
    return metrics, {"followers": followers, "reach": None}


# ── path 2: stealth browser fallback (reasoner-driven, block-proof) ───────────
def fetch_browser(user):
    prompt = open(f"{ROOT}/prompts/track_browser.md").read().replace("__HANDLE__", user)
    out = subprocess.run(
        ["claude", "-p", prompt, "--output-format", "text", "--dangerously-skip-permissions"],
        capture_output=True, text=True, timeout=900,
    )
    m = re.search(r"\{.*\}", out.stdout, re.S)
    if not m:
        raise Blocked("browser fallback returned no JSON")
    res = json.loads(m.group(0))
    if not res.get("ok"):
        raise Blocked(f"browser: {res.get('error')}")
    metrics = {}
    for p in res.get("posts", []):
        code = p.get("shortcode")
        if code:
            metrics[code] = {"views": p.get("views") or 0, "likes": p.get("likes") or 0,
                             "comments": p.get("comments") or 0}
    return metrics, {"followers": res.get("followers"), "reach": res.get("reach")}


def get_metrics(user, source):
    if source == "browser":
        print("[perf] source: stealth browser (forced)")
        return fetch_browser(user)
    try:
        m, a = fetch_requests(user)
        print(f"[perf] source: requests ({len(m)} reels)")
        return m, a
    except Blocked as e:
        if source == "requests":
            raise
        print(f"[perf] requests blocked ({e}) → stealth browser fallback")
        return fetch_browser(user)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", choices=["auto", "requests", "browser"], default="auto")
    a = ap.parse_args()

    user = handle()
    # always record general analytics (followers/reach) for growth tracking
    try:
        metrics, analytics = get_metrics(user, a.source)
    except Blocked as e:
        sys.exit(f"[perf] could not fetch analytics: {e}")

    acsv = f"{ROOT}/memory/analytics.csv"
    new = not os.path.exists(acsv)
    with open(acsv, "a", newline="") as f:
        w = csv.writer(f)
        if new:
            w.writerow(["date", "followers", "reach"])
        w.writerow([datetime.date.today().isoformat(), analytics.get("followers"), analytics.get("reach")])
    print(f"[perf] analytics: followers={analytics.get('followers')} -> {acsv}")

    # per-video performance (needs posts we've logged)
    log = f"{ROOT}/memory/post_log.csv"
    if not os.path.exists(log):
        print("[perf] no post_log.csv yet — analytics recorded, skipping per-video.")
        return
    posts = [r for r in csv.DictReader(open(log)) if r.get("shortcode")]
    if not posts:
        print("[perf] no posts with shortcodes yet.")
        return

    rows = []
    for p in posts:
        m = metrics.get(p["shortcode"], {})
        v = m.get("views", 0) or 0
        likes = m.get("likes", 0) or 0
        comments = m.get("comments", 0) or 0
        eng = round((likes + comments) / v * 100, 2) if v else 0
        rows.append({**p, "views": v, "likes": likes, "comments": comments, "eng_rate_pct": eng})

    perf = f"{ROOT}/memory/performance.csv"
    with open(perf, "w", newline="") as f:
        cols = ["posted_date", "slug", "topic", "shortcode", "scene_types", "hook_scene",
                "views", "likes", "comments", "eng_rate_pct"]
        w = csv.DictWriter(f, fieldnames=cols, extrasaction="ignore")
        w.writeheader()
        for r in rows:
            w.writerow(r)
    print(f"[perf] wrote {len(rows)} rows -> {perf}")
    write_learnings(rows, analytics)


def write_learnings(rows, analytics):
    scored = [r for r in rows if r["views"]]
    out = [f"# {handle()} — LEARNINGS (auto-generated from performance.csv)",
           "_The ideation reasoner reads this to favor what works. Newest data wins._", ""]
    out.append(f"Followers: {analytics.get('followers')}"
               + (f" · reach: {analytics.get('reach')}" if analytics.get("reach") else ""))
    out.append("")
    if not scored:
        out.append("Not enough per-video data yet (no views recorded). Keep posting.")
    else:
        scored.sort(key=lambda r: r["eng_rate_pct"], reverse=True)
        out.append("## Top posts by engagement rate")
        for r in scored[:5]:
            out.append(f"- **{r['topic']}** — {r['eng_rate_pct']}% eng ({r['views']} views, "
                       f"{r['likes']}♥ {r['comments']}💬) | scenes: {r['scene_types']}")
        byseq = defaultdict(list)
        for r in scored:
            byseq[r["scene_types"]].append(r["eng_rate_pct"])
        out.append("\n## Scene-format signal (avg eng% by scene sequence)")
        for k, avg, n in sorted(((k, sum(v) / len(v), len(v)) for k, v in byseq.items()),
                                key=lambda x: x[1], reverse=True)[:6]:
            out.append(f"- {round(avg, 2)}% (n={n}): {k}")
        out.append("\n## Apply next time")
        out.append(f"- Lean into hooks/angles like the top performer: \"{scored[0]['hook_scene']}\"")
        out.append("- Reuse the scene shapes from the top posts; drop the lowest performers.")
    open(f"{ROOT}/memory/LEARNINGS.md", "w").write("\n".join(out) + "\n")
    print(f"[perf] wrote -> {ROOT}/memory/LEARNINGS.md")


if __name__ == "__main__":
    main()
