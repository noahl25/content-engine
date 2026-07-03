import React from "react";
import { AbsoluteFill, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { color, display, serif, expo } from "../theme";
import { BrandLogo, Photo } from "../ui";

/**
 * Overlay — the upload-a-video mode's ONE agent-authored component.
 *
 * The producing agent OVERWRITES this whole file per video (see prompts/overlay.md). It is a
 * normal Remotion component you build from scratch: draw the uploaded clip with <OffthreadVideo>
 * and composite your own TIMED graphics on top (or put the video in a region and graphics beside
 * it). You have the full theme + ui kit + can import anything. Two layout ideas:
 *
 *   • OVERLAY: <OffthreadVideo> fills the frame; graphics sit on top (callouts, logos, images).
 *   • SPLIT:   video in a bottom region; brand background + graphics/generated images ABOVE it.
 *
 * Timing: wrap each graphic in <Sequence from={sec*30} durationInFrames={dur*30}> so it appears
 * only during its window. Keep content in the IG safe zone (y ~22–72%). The uploaded clip keeps
 * its OWN audio — do NOT add an <Audio>. Render at speed 1.0 so the video isn't tempo-shifted.
 *
 * This stub just plays the uploaded clip full-bleed (a safe default before the agent designs it).
 */
export const Overlay: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: color.bg, fontFamily: display }}>
      <AbsoluteFill>
        <OffthreadVideo src={staticFile("upload.mp4")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>
      {/* agent adds timed graphics here, e.g.:
      <Sequence from={2 * 30} durationInFrames={4 * 30}>
        <Callout text="the key idea" x={50} y={30} />
      </Sequence> */}
    </AbsoluteFill>
  );
};

// keep these imports referenced so the stub typechecks even before the agent uses them
void [serif, expo, interpolate, useCurrentFrame, useVideoConfig, BrandLogo, Photo, Sequence];
