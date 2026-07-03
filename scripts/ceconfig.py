#!/usr/bin/env python3
"""
ceconfig.py — the ONE place account/channel settings + secret locations live, so the engine is
NOT tied to a single account. Every script reads its handle, niche, voice, API keys, cookies, and
Telegram creds from here (backed by config.json), instead of hardcoding "byte.sized.2" or "~/x.txt".

Resolution order for any secret:
  1. an environment variable (CE_<NAME>_KEY, CE_TELEGRAM_TOKEN, …) — best for CI / other machines;
  2. the reference in config.json, which is either
        "env:SOME_VAR"   -> read that env var, or
        "~/path/to.txt"  -> read the file's contents (the local default).
Secrets themselves are NEVER stored in config.json — only a path or an env-var name. So config.json
(and config.example.json) are safe to share; the actual keys/cookies stay outside the repo.

To use your OWN account: copy config.example.json -> config.json, set channel.handle / niche /
voice_id, and point keys/cookies/telegram at your own key files (or env vars). Nothing else to change.
"""
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _load():
    for name in ("config.json", "config.example.json"):
        p = os.path.join(ROOT, name)
        if os.path.exists(p):
            try:
                return json.load(open(p))
            except Exception:
                pass
    return {}


CFG = _load()


def cfg():
    return CFG


def _resolve(ref):
    """ref -> secret string. 'env:VAR' reads $VAR; a path reads the file; else None."""
    if not ref or not isinstance(ref, str):
        return None
    if ref.startswith("env:"):
        v = os.environ.get(ref[4:], "").strip()
        return v or None
    p = os.path.expanduser(ref)
    if os.path.exists(p):
        return open(p).read().strip()
    return None


# ── channel identity ──────────────────────────────────────────────────────────
def channel():
    return CFG.get("channel", {})


def handle():
    return channel().get("handle", "your_channel")


def niche():
    return channel().get("niche", "explainers")


def voice_id():
    return channel().get("voice_id") or os.environ.get("CE_VOICE_ID")


# ── API keys (elevenlabs / gemini / pexels / pixabay / …) ──────────────────────
def key(name, required=False):
    env = os.environ.get(f"CE_{name.upper()}_KEY")
    if env:
        return env.strip()
    v = _resolve((CFG.get("keys") or {}).get(name))
    if required and not v:
        raise RuntimeError(
            f"no '{name}' key — set keys.{name} in config.json (a ~/path or env:VAR) "
            f"or export CE_{name.upper()}_KEY")
    return v


def key_ref(name):
    """The configured reference (path/env) for a key, without reading it — for messages."""
    return os.environ.get(f"CE_{name.upper()}_KEY") and f"env:CE_{name.upper()}_KEY" \
        or (CFG.get("keys") or {}).get(name)


# ── per-account IG cookies (posting / trends) ──────────────────────────────────
def cookies(account="posting"):
    ref = ((CFG.get("accounts") or {}).get(account) or {}).get("cookies")
    return os.path.expanduser(ref) if ref else None


def account_handle(account="posting"):
    return ((CFG.get("accounts") or {}).get(account) or {}).get("handle", handle())


# ── Telegram (review/approval) ─────────────────────────────────────────────────
def telegram_token():
    return os.environ.get("CE_TELEGRAM_TOKEN") \
        or _resolve((CFG.get("telegram") or {}).get("token", "~/telegram.txt"))


def telegram_chat():
    return os.environ.get("CE_TELEGRAM_CHAT") \
        or _resolve((CFG.get("telegram") or {}).get("chat_id", "~/telegram_chat.txt"))


def telegram_chat_ref():
    return (CFG.get("telegram") or {}).get("chat_id", "~/telegram_chat.txt")


if __name__ == "__main__":
    # quick, secret-free sanity dump
    print("handle :", handle())
    print("niche  :", niche())
    print("voice  :", voice_id())
    for k in ("elevenlabs", "gemini", "pexels", "pixabay"):
        print(f"key[{k}]:", "set" if key(k) else "MISSING", f"({(CFG.get('keys') or {}).get(k)})")
    print("cookies(posting):", cookies("posting"))
    print("cookies(trends) :", cookies("trends"))
    print("telegram token  :", "set" if telegram_token() else "MISSING")
    print("telegram chat   :", "set" if telegram_chat() else "MISSING")
