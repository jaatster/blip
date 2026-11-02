import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import { Beat } from "./Beat";
import { ticks } from "./grid";
import { MOSAIC, MosaicFilters } from "./Transitions";

type Props = {
  readonly scheme?: "day" | "sunset" | "night";
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly children?: ReactNode;
  /** The scene comes in out of the mosaic (its blocks shrinking to sharp from its first frame). */
  readonly mosaicIn?: boolean;
  /** The scene leaves through the mosaic, its blocks growing from this frame. */
  readonly mosaicOut?: number;
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

export const Stage = ({ scheme = "day", className, style, children, mosaicIn, mosaicOut }: Props) => {
  const frame = useCurrentFrame();
  const [handle] = useState(() => delayRender("Blip's fonts"));
  // The effects kit's mosaic over the whole scene: 12, 8, 6, 4, 3, 2 pixels in; 2 up to 12 out, a Blip frame each.
  const kin = ticks(frame, 0), kout = mosaicOut === undefined ? -1 : ticks(frame, mosaicOut);
  const block = kout >= 0 ? MOSAIC[Math.min(kout, MOSAIC.length - 1)] : mosaicIn && kin < MOSAIC.length ? MOSAIC[MOSAIC.length - 1 - kin] : undefined;
  useEffect(() => {
    loadFaces().then(() => continueRender(handle));
  }, [handle]);
  return (
    <AbsoluteFill className={`v-stage ${className ?? ""}`} data-blip-pixel="4" data-blip-scheme={scheme} style={style}>
      <MosaicFilters />
      <AbsoluteFill style={{ filter: block ? `url(#v-mosaic-${block})` : undefined }}>
        <Beat at={0}>{children}</Beat>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
