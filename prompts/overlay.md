# Overlay mode — add graphics to a user-uploaded video

You take a video the user already has and enhance it with **the channel's B&W motion-graphics style**:
callouts, labels, real brand logos, AI-generated illustrations, stats, lower-thirds, a split layout —
composited **on top of** the video, or with the video in a **region** and graphics beside/above it.

This mode is **agent-writes-code**: there is NO build script and NO rigid template. You write ONE
Remotion component (`remotion/src/overlay/Overlay.tsx`) from scratch for this specific video, exactly
like you write `custom` scenes for the daily explainer. Everything else is you running `ffmpeg` and the
`remotion` CLI directly.

Inputs you need (ask the user if missing): the **path to their video**, and a short **brief** — what
they want the graphics to say / emphasize (the angle, key terms, brands, moments to annotate).

## 1. Bring the video in
Normalize it to a Remotion-friendly mp4 at the public path (h264 + yuv420p + aac). One command:
```
cd ~/claude/content-engine
ffmpeg -y -i "<their video>" -c:v libx264 -pix_fmt yuv420p -preset veryfast -crf 20 \
  -c:a aac -b:a 160k -movflags +faststart remotion/public/upload.mp4
```
The `Overlay` composition reads this file's duration automatically at render time (via
`@remotion/media-utils` in Root.tsx) — you do NOT need to write a props or meta file. If you want the
duration for planning your graphic timings: `ffprobe -v error -show_entries format=duration -of default=nw=1:nokey=1 remotion/public/upload.mp4`.

## 2. Understand the video so your graphics are TIMED to it
You must know what happens when, or the overlays won't land. Do both:
- **Sample frames** to see it: `mkdir -p /tmp/ov && ffmpeg -y -i remotion/public/upload.mp4 -vf fps=1 /tmp/ov/f%03d.jpg` then **Read the frames with your vision** (every ~1s). Note what's on screen and roughly when.
- If it has speech and you want on-screen captions or need the transcript for timing, get word-level
  timings (faster-whisper, no extra script):
  ```
  ~/claude/trading/.venv/bin/python -c "import sys; sys.path.insert(0,'scripts'); import voice, json; print(json.dumps(voice._whisper_words('remotion/public/upload.mp4')))"
  ```
  Use those `{word,start,end}` times to place callouts on the exact beats.

## 3. Grab any real assets you'll use (same asset system as the explainer)
Declare-and-fetch logos / photos / **AI-generated illustrations** with `fetch_assets.py`:
```
python scripts/fetch_assets.py --logo nvidia --logo pytorch
python scripts/fetch_assets.py --image "a lens bending parallel light rays to a focal point:lens"
```
They land in `remotion/public/assets/` and render via `BrandLogo` (logos) or `Photo` (photos & AI
images, id = the filename). AI images are strictly monochrome (see ideate.md "AI-generated
illustrations"). Real logos are a strong interest lever here too — use them where the topic has brands.

## 4. WRITE `remotion/src/overlay/Overlay.tsx` — your bespoke component
Overwrite the stub. It's a normal Remotion component; you have full freedom. Contract:
- Draw the clip with `<OffthreadVideo src={staticFile("upload.mp4")} style={{width:"100%",height:"100%",objectFit:"cover"}}/>`.
- **Do NOT add an `<Audio>`** — the clip keeps its own audio.
- Composite **timed** graphics by wrapping each in `<Sequence from={Math.round(sec*30)} durationInFrames={Math.round(dur*30)}>` so it's only on screen during its window. 30fps.
- Pick a **layout** that fits the brief:
  - **overlay** — video full-bleed; graphics on top (callouts, a logo lockup, a lower-third, a stat
    that pops on a beat). Add a subtle top/bottom scrim for legibility if text sits on busy footage.
  - **split** — video in a region (e.g. `top:"42%",bottom:0`), the brand background + a headline /
    generated image / diagram in the space above it. Good for "react to / explain this" formats.
- **Stay on brand:** import `{ color, display, serif, expo }` from `"../theme"` and
  `{ BrandLogo, Photo }` (and anything else) from `"../ui"`. Strict black & white; the ONE blue-grey
  accent (`color.accent`) used sparingly. Animate ease-out (`expo`), no bounce. Opaque card fills.
- **IG safe zone:** keep graphics between ~22% and ~72% of height (below our zone, above IG's caption
  strip); lower-thirds no lower than ~26% from the bottom. Don't cover the whole video with chrome.
- Give it real richness (see ideate.md's anti-wireframe bar) — substantial cards, real logos, depth —
  not a couple of thin outlined boxes.

## 5. Typecheck, then render (background — never foreground; it can exceed the 600s tool cap)
```
bash scripts/check_custom.sh          # regenerates the custom registry + tsc --noEmit (whole src)
bash scripts/render_and_speedup.sh <slug> 1.0 Overlay   # run with run_in_background: true
```
`1.0` = **no speedup** (don't tempo/pitch-shift the user's video). `Overlay` = the composition id.
Poll for the marker with a BOUNDED loop (never `watch`/`tail -f`):
```
for i in $(seq 1 40); do [ -f output/<slug>.done ] && break; [ -f output/<slug>.failed ] && break; sleep 30; done
```

## 6. QA your own work (vision), then deliver
Render a few stills at representative timestamps and **Read them**:
```
cd remotion && node_modules/.bin/remotion still src/index.ts Overlay ../output/ov_<slug>_1.png --frame=90
```
Check: graphics timed to the right moments, legible over the footage, inside the safe zone, on-brand,
no overlaps, logos actually showing. Fix `Overlay.tsx` and re-render until clean. Then send the final
`output/<slug>.mp4` to the user (Telegram via `python scripts/queue_video.py --slug <slug>` or hand
them the path). If they ask for changes, edit `Overlay.tsx` and re-render (step 5).

## Notes
- One video at a time: `public/upload.mp4` and `Overlay.tsx` are the single active slot (overwrite per
  job), mirroring how the daily explainer reuses one storyboard. The stub `Overlay.tsx` just plays the
  clip full-bleed, so the project always compiles between jobs.
- This is on-demand (not the daily cron) — nothing here touches the paused daily pipeline.
