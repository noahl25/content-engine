#!/usr/bin/env python3
"""
telegram.py — tiny Telegram helper for review/approval of generated videos.
Token + chat id are resolved via ceconfig (config.json telegram.token / telegram.chat_id, each a
~/path or env:VAR; or env CE_TELEGRAM_TOKEN / CE_TELEGRAM_CHAT). Secrets are never echoed.

CLI:
    python telegram.py whoami                 # show bot + chat id
    python telegram.py msg "text"             # send a message
    python telegram.py video /path.mp4 "cap"  # send a video
    python telegram.py capture-chat           # read latest update, save chat id
"""
import json, os, subprocess, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ceconfig  # noqa: E402

HOME = os.path.expanduser("~")


def token():
    t = ceconfig.telegram_token()
    if not t:
        raise RuntimeError("no Telegram token — set telegram.token in config.json or CE_TELEGRAM_TOKEN")
    return t


def chat_id():
    return ceconfig.telegram_chat()


def _curl(method, args, timeout=120):
    cmd = ["curl", "-s", f"https://api.telegram.org/bot{token()}/{method}"] + args
    out = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
    try:
        return json.loads(out.stdout)
    except Exception:
        return {"ok": False, "raw": out.stdout[:300]}


def send_message(text):
    return _curl("sendMessage", ["-d", f"chat_id={chat_id()}", "--data-urlencode", f"text={text}"])


def send_video(path, caption=""):
    return _curl("sendVideo", ["-F", f"chat_id={chat_id()}", "-F", f"video=@{path}",
                               "--form-string", f"caption={caption[:1000]}"], timeout=300)


def get_updates(offset=0, timeout=0):
    # timeout>0 = long-poll: the request blocks up to `timeout`s until a message arrives.
    return _curl("getUpdates", ["-d", f"offset={offset}", "-d", f"timeout={timeout}"],
                 timeout=timeout + 20)


def capture_chat():
    u = get_updates()
    if not u.get("ok") or not u.get("result"):
        return None
    cid = u["result"][-1]["message"]["chat"]["id"]
    ref = ceconfig.telegram_chat_ref()
    if ref and not ref.startswith("env:"):
        path = os.path.expanduser(ref)
        open(path, "w").write(str(cid))
        os.chmod(path, 0o600)
    else:
        print(f"(chat id is {cid} — set env CE_TELEGRAM_CHAT to it; can't write to an env ref)", file=sys.stderr)
    return cid


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "whoami"
    if cmd == "whoami":
        me = _curl("getMe", [])
        print("bot:", me.get("result", {}).get("username"), "| chat_id:", chat_id())
    elif cmd == "msg":
        print(send_message(sys.argv[2]))
    elif cmd == "video":
        cap = sys.argv[3] if len(sys.argv) > 3 else ""
        print(send_video(sys.argv[2], cap))
    elif cmd == "capture-chat":
        print("chat_id:", capture_chat() or "(no messages yet — message the bot first)")
