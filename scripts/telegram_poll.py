#!/usr/bin/env python3
"""
telegram_poll.py — checks for your Telegram replies and acts on the pending video.
Run on a short cron (e.g. every 2 min). Idempotent via a saved update offset.

Reply handling (applies to the most recent PENDING video in queue.json):
  • "yes" / "post" / "y" / 👍   → publish via post_reel.py
  • "no" / "skip" / "n" / 👎/❌ → discard (mark skipped)
  • anything else                → treat as EDIT NOTES: regenerate that topic with the notes,
                                   which re-sends a new version for review
"""
import json, os, subprocess, sys

ROOT = os.path.expanduser("~/claude/content-engine")
sys.path.insert(0, f"{ROOT}/scripts")
import telegram

Q = f"{ROOT}/memory/queue.json"
OFFSET = f"{ROOT}/memory/telegram_offset.txt"
PY = sys.executable
YES = {"yes", "y", "post", "post it", "publish", "👍", "✅", "yep", "yeah", "go", "send it"}
NO = {"no", "n", "skip", "nope", "👎", "❌", "discard"}


def load_offset():
    try:
        return int(open(OFFSET).read().strip())
    except Exception:
        return 0


def save_offset(o):
    open(OFFSET, "w").write(str(o))


def queue():
    return json.load(open(Q)) if os.path.exists(Q) else []


def latest_pending():
    p = [e for e in queue() if e.get("status") == "pending"]
    return p[-1] if p else None


def set_status(slug, status):
    items = queue()
    for e in items:
        if e.get("slug") == slug:
            e["status"] = status
    json.dump(items, open(Q, "w"), indent=2)


def poll_once(long=0):
    if not telegram.chat_id():
        return
    offset = load_offset()
    upd = telegram.get_updates(offset + 1 if offset else 0, timeout=long)
    if not upd.get("ok"):
        return
    results = upd.get("result", [])
    for u in results:
        save_offset(u["update_id"])
        msg = (u.get("message") or {})
        text = (msg.get("text") or "").strip()
        if not text:
            continue
        low = text.lower().strip(" .!")
        pend = latest_pending()
        if not pend:
            telegram.send_message("No video is waiting for review right now.")
            continue

        if low in YES:
            telegram.send_message(f"Posting “{pend['topic']}” …")
            r = subprocess.run([PY, f"{ROOT}/scripts/post_reel.py", "--slug", pend["slug"]],
                               capture_output=True, text=True, timeout=900)
            ok = "[post] result: {'ok': True" in r.stdout or "logged ->" in r.stdout
            telegram.send_message("✅ Posted." if ok
                                  else f"⚠️ Post failed:\n{(r.stdout + r.stderr)[-400:]}")
        elif low in NO:
            set_status(pend["slug"], "skipped")
            telegram.send_message(f"🗑️ Skipped “{pend['topic']}”. Won't post it.")
        else:
            telegram.send_message(f"✏️ Got it — regenerating “{pend['topic']}” with your notes. "
                                  f"I'll send a new version shortly.")
            set_status(pend["slug"], "revising")
            subprocess.run([PY, f"{ROOT}/scripts/ideate.py",
                            "--topic", pend.get("source_topic", pend["topic"]),
                            "--notes", text, "--render"],
                           capture_output=True, text=True, timeout=2400)
            # ideate.py --render also re-runs queue_video (via generate path? no) — handle send here:
            # ideate.py --render does NOT auto-queue; queue+send the regenerated video now.
            slug = subprocess.run("ls -t %s/output/*.mp4 | head -1 | xargs basename | sed 's/.mp4$//'" % ROOT,
                                  shell=True, capture_output=True, text=True).stdout.strip()
            if slug:
                subprocess.run([PY, f"{ROOT}/scripts/queue_video.py", "--slug", slug, "--slot", pend.get("slot", "revision")],
                               capture_output=True, text=True, timeout=300)


def main():
    if "--loop" in sys.argv:
        import time
        print("[telegram] listener started (long-poll)", flush=True)
        while True:
            try:
                poll_once(long=25)  # blocks until a message or 25s → near-instant reaction
            except Exception as e:
                print(f"[telegram] poll error: {e}", flush=True)
                time.sleep(5)
    else:
        poll_once()  # single-shot (manual / fallback)


if __name__ == "__main__":
    main()
