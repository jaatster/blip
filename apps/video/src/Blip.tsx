import { Series, useVideoConfig } from "remotion";
import { BAR } from "./lib/grid";
import { BUILT_RIGHT, BuiltRight } from "./scenes/BuiltRight";
import { COLOURS, Colours } from "./scenes/Colours";
import { COMPONENTS, Components } from "./scenes/Components";
import { MAKE_A_GAME, MakeAGame } from "./scenes/MakeAGame";
import { EVERYWHERE, Everywhere } from "./scenes/Everywhere";
import { GAME_KIT, GameKit } from "./scenes/GameKit";
import { MOBILE, Mobile } from "./scenes/Mobile";
import { MODULAR, Modular } from "./scenes/Modular";
import { OUTRO, Outro } from "./scenes/Outro";
import { Poster } from "./scenes/Poster";
import { PRESS_START, PressStart } from "./scenes/PressStart";
import { REAL_SCREENS, RealScreens } from "./scenes/RealScreens";
import { RESPONSIVE, Responsive } from "./scenes/Responsive";

/** The scenes in the order of the song, each as many bars as its part of the theme. */
export const SCENES = [
  { name: "Press start", bars: PRESS_START.bars, Scene: PressStart },
  { name: "Modular", bars: MODULAR.bars, Scene: Modular },
  { name: "Use it everywhere", bars: EVERYWHERE.bars, Scene: Everywhere },
  { name: "88 components", bars: COMPONENTS.bars, Scene: Components },
  { name: "Your colours", bars: COLOURS.bars, Scene: Colours },
  { name: "Make anything", bars: REAL_SCREENS.bars, Scene: RealScreens },
  { name: "Responsive", bars: RESPONSIVE.bars, Scene: Responsive },
  { name: "Ready for mobile", bars: MOBILE.bars, Scene: Mobile },
  { name: "Game kit", bars: GAME_KIT.bars, Scene: GameKit },
  { name: "Puddle Path", bars: MAKE_A_GAME.bars, Scene: MakeAGame },
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

/** The social cut opens on the banner for 1.6 s (the frame a feed shows before play), then the TV switches off and on. */
export const SOCIAL_HOLD = 80;

/** Blip's announcement video for feeds: the banner first, then the whole video. */
export const BlipSocial = () => (
  <Series>
    <Series.Sequence name="Banner" durationInFrames={SOCIAL_HOLD}>
      <Poster hold={SOCIAL_HOLD} />
    </Series.Sequence>
    <Series.Sequence name="Video" durationInFrames={BLIP_BARS * BAR}>
      <Blip />
    </Series.Sequence>
  </Series>
);
