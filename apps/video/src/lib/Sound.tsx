import { Audio } from "@remotion/media";
import { interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { BAR } from "./grid";

type SfxProps = {
  /** A Blip sound (@jaatster/blip-sound's names), or a pitched copy: "step@5" is five semitones up. */
  readonly name: string;
  readonly at: number;
  readonly volume?: number;
};

/** One of Blip's own sounds, on the frame its thing happens. scripts/sounds.mjs makes the files. */
export const Sfx = ({ name, at, volume = 0.75 }: SfxProps) => {
  const { fps } = useVideoConfig();
  return <Audio name={`Sfx ${name}`} src={staticFile(`sfx/${name}.wav`)} from={at} volume={volume} premountFor={fps} />;
};

type MusicProps = {
  /** The bar of the theme this piece of the video starts at. */
  readonly bar: number;
  /** How many bars it plays. */
  readonly bars: number;
  /** Frames to fade out over at the end (0: a clean cut on the bar line). */
  readonly fadeOut?: number;
};

/** The theme from bar `bar`, for a scene shown on its own (the whole video plays it once, from the top). */
export const Music = ({ bar, bars, fadeOut = 0 }: MusicProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const length = bars * BAR;
  return (
    <Audio
      name="Theme"
      src={staticFile("music/theme.wav")}
      trimBefore={bar * BAR}
      durationInFrames={length}
      premountFor={fps}
      volume={0.6 * (fadeOut ? interpolate(frame, [length - fadeOut, length], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1)}
    />
  );
};
