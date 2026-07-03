#!/usr/bin/env python3
"""
voice.py — narration + word timings. ElevenLabs first; if EL is out of credits (or
otherwise fails), fall back to Google **Gemini TTS**. (Piper still available explicitly.)

ElevenLabs path uses the /with-timestamps endpoint: returns the audio AND character-level
alignment → exact word timings (no Whisper). Gemini TTS returns audio only, so we align it
with faster-whisper to recover word timings (same approach as the Piper fallback).
"""
import os, re, base64, json, subprocess, shlex, sys, urllib.request, urllib.error

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ceconfig  # noqa: E402

HOME = os.path.expanduser("~")
# Default ElevenLabs voice comes from config (channel.voice_id); fall back to George.
DEFAULT_VOICE = ceconfig.voice_id() or "JBFqnCBsd6RMkjVDRZzb"
MODEL = "eleven_multilingual_v2"
PIPER = f"{HOME}/claude/content-engine/.venv/bin/piper"
PIPER_VOICE = f"{HOME}/claude/content-engine/tts/voices/en_US-ryan-high.onnx"
# Gemini TTS fallback (key resolved via ceconfig -> config.json keys.gemini). Default voice Charon;
# alternatives: Sulafat (warm), Algieba (smooth), Orus (firm), Puck (upbeat), Kore, Iapetus (clear).
GEMINI_MODEL = os.environ.get("GEMINI_TTS_MODEL", "gemini-2.5-flash-preview-tts")
GEMINI_VOICE = os.environ.get("GEMINI_TTS_VOICE", "Charon")


def _key():
    k = ceconfig.key("elevenlabs")
    if not k:
        raise RuntimeError("no ElevenLabs key — set keys.elevenlabs in config.json or CE_ELEVENLABS_KEY")
    return k


def audio_duration(path):
    out = subprocess.check_output(
        f'ffprobe -v error -show_entries format=duration -of default=nw=1:nokey=1 {shlex.quote(path)}',
        shell=True).decode().strip()
    return round(float(out), 3)


def _chars_to_words(chars, starts, ends):
    words, cur, cs, ce = [], "", None, None
    for ch, s, e in zip(chars, starts, ends):
        if ch.isspace():
            if cur:
                words.append({"word": cur, "start": round(cs, 3), "end": round(ce, 3)})
                cur = ""
            continue
        if not cur:
            cs = s
        cur += ch
        ce = e
    if cur:
        words.append({"word": cur, "start": round(cs, 3), "end": round(ce, 3)})
    return words


def _whisper_words(audio_path):
    """Recover word-level timings from a finished audio file via faster-whisper."""
    from faster_whisper import WhisperModel
    m = WhisperModel("base", device="cpu", compute_type="int8")
    segs, _ = m.transcribe(audio_path, word_timestamps=True, vad_filter=False)
    # cast to plain float — faster-whisper returns numpy float64, which json.dump can't serialize.
    return [{"word": w.word.strip(), "start": round(float(w.start), 3), "end": round(float(w.end), 3)}
            for s in segs for w in (s.words or [])]


def elevenlabs(text, out_mp3, voice=DEFAULT_VOICE, model=MODEL):
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice}/with-timestamps"
    body = json.dumps({"text": text, "model_id": model}).encode()
    req = urllib.request.Request(url, data=body, headers={
        "xi-api-key": _key(), "Content-Type": "application/json", "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=180) as r:
        data = json.loads(r.read().decode())
    os.makedirs(os.path.dirname(out_mp3), exist_ok=True)
    open(out_mp3, "wb").write(base64.b64decode(data["audio_base64"]))
    al = data.get("alignment") or data.get("normalized_alignment")
    words = _chars_to_words(al["characters"],
                            al["character_start_times_seconds"],
                            al["character_end_times_seconds"])
    return words, audio_duration(out_mp3)


def gemini(text, out_mp3, voice=GEMINI_VOICE, model=GEMINI_MODEL):
    """Fallback TTS via Google Gemini. Returns audio (no native timings) → align with whisper."""
    key = ceconfig.key("gemini", required=True)
    url = (f"https://generativelanguage.googleapis.com/v1beta/models/"
           f"{model}:generateContent?key={key}")
    body = json.dumps({
        "contents": [{"parts": [{"text": text}]}],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voice}}},
        },
    }).encode()
    req = urllib.request.Request(url, data=body, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=240) as r:
        data = json.loads(r.read().decode())
    part = data["candidates"][0]["content"]["parts"][0]["inlineData"]
    pcm = base64.b64decode(part["data"])           # raw 16-bit PCM, mono
    mime = part.get("mimeType", "audio/L16;rate=24000")
    rate = int((re.search(r"rate=(\d+)", mime) or [None, "24000"])[1])
    os.makedirs(os.path.dirname(out_mp3), exist_ok=True)
    # raw s16le mono PCM -> mp3 via ffmpeg (stdin)
    subprocess.run(
        f'ffmpeg -y -f s16le -ar {rate} -ac 1 -i pipe:0 {shlex.quote(out_mp3)}',
        input=pcm, shell=True, check=True,
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return _whisper_words(out_mp3), audio_duration(out_mp3)


def piper(text, out_wav):
    """Fallback: Piper synth + faster-whisper word alignment."""
    cmd = f'{shlex.quote(PIPER)} -m {shlex.quote(PIPER_VOICE)} -c {shlex.quote(PIPER_VOICE + ".json")} -f {shlex.quote(out_wav)}'
    subprocess.run(cmd, input=text.encode(), shell=True, check=True)
    return _whisper_words(out_wav), audio_duration(out_wav)


def _el_failure_reason(e):
    """Human-readable reason for an ElevenLabs failure (esp. out-of-credits/quota)."""
    if isinstance(e, urllib.error.HTTPError):
        try:
            body = e.read().decode()
        except Exception:
            body = ""
        if e.code in (401, 402, 429) or "quota" in body.lower() or "credit" in body.lower():
            return "out of credits / quota exceeded"
        return f"HTTP {e.code}: {body[:160]}"
    return f"{type(e).__name__}: {e}"


def synth(text, out_path, backend="elevenlabs", voice=DEFAULT_VOICE):
    # Explicit backends:
    if backend == "piper":
        return piper(text, out_path)
    if backend == "gemini":
        return gemini(text, out_path)
    # Default: ElevenLabs, with automatic fallback to Gemini TTS if EL is out of credits
    # (or otherwise fails). If neither is available, raise so the run fails loudly.
    try:
        return elevenlabs(text, out_path, voice=voice)
    except Exception as e:
        reason = _el_failure_reason(e)
        if not ceconfig.key("gemini"):
            raise RuntimeError(
                f"ElevenLabs failed ({reason}) and no Gemini fallback key (keys.gemini in config.json "
                f"or CE_GEMINI_KEY). Add one to enable fallback, or top up ElevenLabs.") from e
        print(f"[voice] ElevenLabs failed ({reason}) — falling back to Gemini TTS "
              f"(model={GEMINI_MODEL}, voice={GEMINI_VOICE})", flush=True)
        return gemini(text, out_path)
