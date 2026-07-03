import React from "react";
import { Composition, staticFile } from "remotion";
import { getVideoMetadata } from "@remotion/media-utils";
import { FactExplainer } from "./FactExplainer";
import { TechExplainer } from "./TechExplainer";
import { Overlay } from "./overlay/Overlay";
import sample from "./sample-props.json";
import story from "./story-props.json";

const FPS = 30;
const W = 1080;
const H = 1920;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="TechExplainer"
        component={TechExplainer as any}
        durationInFrames={900}
        fps={FPS}
        width={W}
        height={H}
        defaultProps={story as any}
        calculateMetadata={({ props }: any) => {
          const sum = (props.scenes || []).reduce(
            (a: number, s: any) => a + Math.max(1, s.durationInFrames || 0),
            0
          );
          return { durationInFrames: Math.max(sum, 30), fps: FPS };
        }}
      />
      {/* Upload-a-video overlay mode. The agent writes src/overlay/Overlay.tsx from scratch per
          video (a bespoke Remotion component: OffthreadVideo of the uploaded clip + its own timed
          graphics). Duration is read straight from the uploaded file at render time — no build
          script, no props file. The agent drops the (normalized) clip at public/upload.mp4. */}
      <Composition
        id="Overlay"
        component={Overlay as any}
        durationInFrames={300}
        fps={FPS}
        width={W}
        height={H}
        calculateMetadata={async () => {
          try {
            const meta = await getVideoMetadata(staticFile("upload.mp4"));
            return { durationInFrames: Math.max(Math.round(meta.durationInSeconds * FPS), 30), fps: FPS };
          } catch {
            return { durationInFrames: 300, fps: FPS };
          }
        }}
      />
      <Composition
        id="FactExplainer"
        component={FactExplainer as any}
        durationInFrames={600}
        fps={FPS}
        width={W}
        height={H}
        defaultProps={sample as any}
        calculateMetadata={({ props }: any) => {
          const dur = props.audioDurationSec
            ? Math.ceil(props.audioDurationSec * FPS) + Math.round(0.8 * FPS)
            : 600;
          return { durationInFrames: dur, fps: FPS };
        }}
      />
    </>
  );
};
