import React from "react";
import { AbsoluteFill, Series, Audio, staticFile } from "remotion";
import { color, display } from "./theme";
import { BackgroundField, TopBar, SceneRouter, Scene } from "./scenes";
import { Captions, Word } from "./Captions";

export type StoryProps = {
  topic: string;
  icon?: string;
  audioDurationSec: number;
  words: Word[];
  scenes: Scene[];
  audioFile?: string;
  topBar?: boolean;    // show the top bar (icon + topic + progress). default true.
  progress?: boolean;  // show the progress line within the top bar. default true.
};

export const TechExplainer: React.FC<StoryProps> = ({ topic, icon, words, scenes, audioFile, topBar = true, progress = true }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: color.bg, fontFamily: display }}>
      <BackgroundField />

      <Series>
        {scenes.map((s, i) => (
          <Series.Sequence key={i} durationInFrames={Math.max(1, s.durationInFrames)}>
            <SceneRouter scene={s} />
          </Series.Sequence>
        ))}
      </Series>

      {topBar !== false && <TopBar topic={topic} icon={icon} showProgress={progress !== false} />}
      {/* subtitles: pinned inside the IG safe zone (~22% up, above IG's caption + action buttons) */}
      <Captions words={words} fontSize={58} bottom="22%" />

      <Audio src={staticFile(audioFile || "narration.mp3")} />
    </AbsoluteFill>
  );
};
