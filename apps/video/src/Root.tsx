import { Composition, Folder } from "remotion";
import { Test } from "./Test";
import { Components } from "./scenes/Components";
import { PressStart } from "./scenes/PressStart";
import { Modular } from "./scenes/Modular";
import { Mobile } from "./scenes/Mobile";
import { Everywhere } from "./scenes/Everywhere";
import { Responsive } from "./scenes/Responsive";
import { Colours } from "./scenes/Colours";
import { RealScreens } from "./scenes/RealScreens";
import { MakeAGame } from "./scenes/MakeAGame";
import { BuiltRight } from "./scenes/BuiltRight";
import { Outro } from "./scenes/Outro";
import { BLIP_BARS, Blip } from "./Blip";
import { BAR } from "./lib/grid";

export const RemotionRoot = () => {
  return (
    <>
      <Composition id="Blip" component={Blip} durationInFrames={BLIP_BARS * BAR} fps={50} width={1920} height={1080} />
      <Composition id="Test" component={Test} durationInFrames={1040} fps={50} width={1920} height={1080} />
      <Folder name="Scenes">
        <Composition id="Responsive" component={Responsive} durationInFrames={320} fps={50} width={1920} height={1080} defaultProps={{ music: true }} />
        <Composition id="Mobile" component={Mobile} durationInFrames={320} fps={50} width={1920} height={1080} defaultProps={{ music: true }} />
        <Composition id="Everywhere" component={Everywhere} durationInFrames={320} fps={50} width={1920} height={1080} defaultProps={{ music: true }} />
        <Composition id="BuiltRight" component={BuiltRight} durationInFrames={320} fps={50} width={1920} height={1080} defaultProps={{ music: true }} />
        <Composition id="Outro" component={Outro} durationInFrames={320} fps={50} width={1920} height={1080} defaultProps={{ music: true }} />
        <Composition id="MakeAGame" component={MakeAGame} durationInFrames={480} fps={50} width={1920} height={1080} defaultProps={{ music: true }} />
        <Composition id="RealScreens" component={RealScreens} durationInFrames={480} fps={50} width={1920} height={1080} defaultProps={{ music: true }} />
        <Composition id="Colours" component={Colours} durationInFrames={320} fps={50} width={1920} height={1080} defaultProps={{ music: true }} />
        <Composition id="Modular" component={Modular} durationInFrames={320} fps={50} width={1920} height={1080} defaultProps={{ music: true }} />
        <Composition id="PressStart" component={PressStart} durationInFrames={400} fps={50} width={1920} height={1080} defaultProps={{ music: true }} />
        <Composition id="Components" component={Components} durationInFrames={640} fps={50} width={1920} height={1080} defaultProps={{ music: true }} />
      </Folder>
    </>
  );
};
