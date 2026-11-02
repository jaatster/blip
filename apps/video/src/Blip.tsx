import { Series, useVideoConfig } from "remotion";
import { BAR } from "./lib/grid";
import { BUILT_RIGHT, BuiltRight } from "./scenes/BuiltRight";
import { COLOURS, Colours } from "./scenes/Colours";
import { COMPONENTS, Components } from "./scenes/Components";
import { MAKE_A_GAME, MakeAGame } from "./scenes/MakeAGame";
import { ONE_PIXEL, OnePixel } from "./scenes/OnePixel";
import { OUTRO, Outro } from "./scenes/Outro";
import { PRESS_START, PressStart } from "./scenes/PressStart";
import { REAL_SCREENS, RealScreens } from "./scenes/RealScreens";

/** The scenes in the order of the song, each as many bars as its part of the theme. */
export const SCENES = [
  { name: "Press start", bars: PRESS_START.bars, Scene: PressStart },
  { name: "One pixel", bars: ONE_PIXEL.bars, Scene: OnePixel },
  { name: "88 components", bars: COMPONENTS.bars, Scene: Components },
  { name: "Your colours", bars: COLOURS.bars, Scene: Colours },
  { name: "Real screens", bars: REAL_SCREENS.bars, Scene: RealScreens },
  { name: "Make a game", bars: MAKE_A_GAME.bars, Scene: MakeAGame },
  { name: "Built right", bars: BUILT_RIGHT.bars, Scene: BuiltRight },
  { name: "Outro", bars: OUTRO.bars, Scene: Outro },
];
export const BLIP_BARS = SCENES.reduce((n, s) => n + s.bars, 0);

/** Blip's announcement video: the whole song, scene after scene. */
export const Blip = () => {
  const { fps } = useVideoConfig();
  return (
    <Series>
      {SCENES.map(({ name, bars, Scene }) => (
        <Series.Sequence key={name} name={name} durationInFrames={bars * BAR} premountFor={fps}>
          <Scene />
        </Series.Sequence>
      ))}
    </Series>
  );
};
