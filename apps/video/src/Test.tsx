import { Series, useVideoConfig } from "remotion";
import { BAR } from "./lib/grid";
import { Components } from "./scenes/Components";
import { PressStart } from "./scenes/PressStart";

/** The two test scenes back to back, each with its own bars of the theme: the opening, then the components. */
export const Test = () => {
  const { fps } = useVideoConfig();
  return (
    <Series>
      <Series.Sequence name="Press start" durationInFrames={4 * BAR} premountFor={fps}>
        <PressStart />
      </Series.Sequence>
      <Series.Sequence name="88 components" durationInFrames={8 * BAR} premountFor={fps}>
        <Components />
      </Series.Sequence>
    </Series>
  );
};
