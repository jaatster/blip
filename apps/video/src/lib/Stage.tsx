import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { AbsoluteFill, continueRender, delayRender, staticFile } from "remotion";
import { Beat } from "./Beat";

type Props = {
  readonly scheme?: "day" | "sunset" | "night";
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly children?: ReactNode;
};

/**
 * A scene's screen: Blip at four pixels to a Blip pixel (480 x 270 of them at 1080p, 960 x 540 device pixels each
 * way at 4K), in a scheme. Frames wait for both faces to load. The stage is a Beat from the scene's first frame, so
 * an animation outside any other Beat (the CRT's flicker) is stepped to the frame too.
 */
/** Blip's two faces, Latin only (all the video writes), added once. */
let faces: Promise<unknown> | undefined;
const loadFaces = () =>
  (faces ??= Promise.all(
    [
      new FontFace("Pixel Bop", `url("${staticFile("fonts/pixel-bop.woff2")}")`, { weight: "400" }),
      new FontFace("Pixelify Sans", `url("${staticFile("fonts/pixelify-sans.woff2")}")`, { weight: "400 700" }),
    ].map(async (face) => document.fonts.add(await face.load())),
  ));

export const Stage = ({ scheme = "day", className, style, children }: Props) => {
  const [handle] = useState(() => delayRender("Blip's fonts"));
  useEffect(() => {
    loadFaces().then(() => continueRender(handle));
  }, [handle]);
  return (
    <AbsoluteFill className={`v-stage ${className ?? ""}`} data-blip-pixel="4" data-blip-scheme={scheme} style={style}>
      <Beat at={0}>{children}</Beat>
    </AbsoluteFill>
  );
};
