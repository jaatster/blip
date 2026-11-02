import { Composition, Folder } from "remotion";
import { Test } from "./Test";
import { Components } from "./scenes/Components";
import { PressStart } from "./scenes/PressStart";

export const RemotionRoot = () => {
  return (
    <>
      <Composition id="Test" component={Test} durationInFrames={1040} fps={50} width={1920} height={1080} />
      <Folder name="Scenes">
        <Composition id="PressStart" component={PressStart} durationInFrames={400} fps={50} width={1920} height={1080} defaultProps={{ music: true }} />
        <Composition id="Components" component={Components} durationInFrames={640} fps={50} width={1920} height={1080} defaultProps={{ music: true }} />
      </Folder>
    </>
  );
};
