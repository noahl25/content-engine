#!/usr/bin/env python3
"""
telegram_wait.py — wait for the user's NEW Telegram reply (yes/no/edits) and print it.

TWO MODES (so the producer can poll in a loop without ever blocking past the 600s Bash cap):
  telegram_wait.py --arm        -> drain pending messages + record offset = "now". Call ONCE
                                   right after sending the video. Prints "ARMED".
  telegram_wait.py [seconds]    -> poll for ONE new reply for up to `seconds` (does NOT drain,
                                   so replies that land between loop iterations are NOT missed).
                                   Prints the reply text, or "TIMEOUT" if none arrived in window.

IMPORTANT: a single foreground Bash tool call is killed at 600s. So `seconds` must stay UNDER
that (use ≤540) and the agent must LOOP: arm once, then call the wait repeatedly until it prints
something other than TIMEOUT (or a total budget like 4h elapses). Because wait-mode never drains,
the saved offset only advances past a message once it's actually consumed, so no reply is lost
across iterations.
"""
import os, sys, time

sys.path.insert(0, os.path.expanduser("~/claude/content-engine/scripts"))
import telegram

OFFSET = os.path.expanduser("~/claude/content-engine/memory/telegram_offset.txt")


def load():
    try:
        return int(open(OFFSET).read().strip())
    except Exception:
        return 0


def save(o):
    open(OFFSET, "w").write(str(o))


def drain():
    upd = telegram.get_updates(load() + 1 if load() else 0, timeout=0)
    for u in upd.get("result", []):
        save(u["update_id"])


def ack(text):
    """Immediately confirm receipt so the user knows their reply landed, before the
    agent goes off to post / skip / re-render. Classifies the reply for a useful message."""
    low = text.strip().lower()
    speed_words = ("speed", "faster", "slower", "slow it", "slow down", "too fast", "too slow", "speed up")
    is_speed = any(w in low for w in speed_words) and len(low) <= 60
    if low in ("yes", "y", "post", "post it", "👍", "ship it", "go"):
        msg = "👍 Got it — posting now…"
    elif low in ("no", "n", "skip", "👎", "nope"):
        msg = "🗑️ Got it — skipping this one."
    elif is_speed:
        msg = "⏩ Got it — adjusting the speed (just a few seconds, no re-render) and re-sending."
    else:
        short = text if len(text) <= 140 else text[:137] + "…"
        msg = f'✏️ Got your edit: "{short}"\nApplying it and re-rendering (~15 min) — I\'ll send the new version when it\'s ready.'
    try:
        telegram.send_message(msg)
    except Exception:
        pass  # never let an ack failure swallow the reply


def main():
    # arm mode: drain existing messages so we only react to replies from now on.
    if len(sys.argv) > 1 and sys.argv[1] == "--arm":
        drain()
        print("ARMED")
        return

    # wait mode: poll WITHOUT draining (so a reply between loop iterations isn't skipped).
    max_s = int(sys.argv[1]) if len(sys.argv) > 1 else 540
    max_s = min(max_s, 570)  # stay under the 600s foreground Bash cap
    start = time.time()
    while time.time() - start < max_s:
        upd = telegram.get_updates(load() + 1, timeout=25)
        for u in upd.get("result", []):
            save(u["update_id"])
            text = ((u.get("message") or {}).get("text") or "").strip()
            if text:
                ack(text)
                print(text)
                return
    print("TIMEOUT")


if __name__ == "__main__":
    main()
