#!/usr/bin/env python3
"""
queue_video.py --slug X --slot morning|evening
Mark a freshly-rendered video as PENDING APPROVAL in memory/queue.json and notify the user.
Posting only happens after the user approves (then post_reel.py runs).
"""
import argparse, json, os, sys, datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ceconfig  # noqa: E402
import telegram
ROOT = ceconfig.ROOT
Q = f"{ROOT}/memory/queue.json"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--slug", required=True)
    ap.add_argument("--slot", default="slot")
    a = ap.parse_args()

    sb = f"{ROOT}/storyboards/{a.slug}.json"
    doc = json.load(open(sb)) if os.path.exists(sb) else {}
    topic = doc.get("topic", a.slug)

    items = json.load(open(Q)) if os.path.exists(Q) else []
    items = [e for e in items if e.get("slug") != a.slug]
    items.append({
        "slug": a.slug, "slot": a.slot, "topic": topic,
        "source_topic": doc.get("source_topic", topic),
        "video": f"{ROOT}/output/{a.slug}.mp4",
        "status": "pending",
        "generated_at": datetime.datetime.utcnow().isoformat() + "Z",
        "caption": doc.get("caption", "")[:140],
    })
    json.dump(items, open(Q, "w"), indent=2)
    print(f"[queue] PENDING APPROVAL: {a.slug} ({a.slot}, {topic}) -> {Q}")

    # send the video to Telegram for review (reply yes / no / edits)
    video = f"{ROOT}/output/{a.slug}.mp4"
    cap = (f"🎬 {ceconfig.handle()} — {a.slot} video ready for review\n\n"
           f"Topic: {topic}\n\n"
           f"Reply:\n• YES / post → publish it\n• NO / skip → discard\n• anything else → I'll treat it as edits and regenerate")
    try:
        r = telegram.send_video(video, cap)
        print(f"[queue] sent to Telegram: ok={r.get('ok')}")
    except Exception as e:
        print(f"[queue] telegram send failed: {e}")


if __name__ == "__main__":
    main()
