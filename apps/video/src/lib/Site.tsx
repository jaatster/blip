import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { IFrame, continueRender, delayRender, staticFile } from "remotion";

type Props = {
  /** A page of the docs site's own build, under public/site (scripts/assets.mjs copies it). */
  readonly page: string;
  /** The page's size in CSS pixels; it is drawn `zoom` times bigger, whole, so its pixels stay square. */
  readonly width: number;
  readonly height: number;
  readonly zoom?: number;
  /** How far down it is scrolled, in CSS pixels (kept to whole Blip pixels of the page). */
  readonly scroll?: number;
  readonly scheme?: "day" | "sunset" | "night";
  /** Runs on the page once it has loaded, and again whenever `state` changes: to set a template's screen. */
  readonly apply?: (doc: Document) => void;
  readonly state?: unknown;
  /** Elements to find on the page once it has settled (the first match of each selector), for `overlay`. */
  readonly measure?: readonly string[];
  /** Drawn over the page, given where each `measure` selector's element is, in CSS pixels of the drawn page. */
  readonly overlay?: (rects: Readonly<Record<string, Rect>>) => ReactNode;
};

export type Rect = { readonly x: number; readonly y: number; readonly width: number; readonly height: number };

/**
 * A real page of the docs site, live: the templates as they ship. Its motion is turned off (reduced motion, and
 * Blip's own motion switch), so a frame is the same however it is reached; frames wait for the page and its fonts.
 */
export const Site = ({ page, width, height, zoom = 2, scroll = 0, scheme = "night", apply, state, measure = [], overlay }: Props) => {
  const ref = useRef<HTMLIFrameElement>(null);
  const [handle] = useState(() => delayRender(`page ${page}`));
  const [ready, setReady] = useState(false);
  const [rects, setRects] = useState<Record<string, Rect>>({});
  const onLoad = useCallback(async () => {
    const doc = ref.current?.contentDocument;
    if (!doc) return;
    doc.documentElement.dataset.blipMotion = "reduce";
    doc.documentElement.dataset.blipScheme = scheme;
    const style = doc.createElement("style");
    // Toasts come and go on the page's own clock, so they stay out of the picture.
    style.textContent = "*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;transition:none!important;scroll-behavior:auto!important}html{scrollbar-width:none}.blip-toasts,.blip-toast{display:none!important}";
    doc.head.append(style);
    await doc.fonts.ready;
    // Whatever fills in once seen (a chart, a counter) is seen once, top to bottom, and given time to finish, so every
    // frame finds the page the same however long it has been open.
    const win = ref.current!.contentWindow!;
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    for (let y = 0; y < doc.documentElement.scrollHeight; y += height / 2) {
      win.scrollTo(0, y);
      await wait(60);
    }
    win.scrollTo(0, 0);
    await wait(1500);
    // Where the parts are, now that nothing moves: scaled to the page as drawn.
    const found: Record<string, Rect> = {};
    for (const sel of measure) {
      const r = doc.querySelector(sel)?.getBoundingClientRect();
      if (r && r.width > 0) found[sel] = { x: r.x * zoom, y: r.y * zoom, width: r.width * zoom, height: r.height * zoom };
    }
    setRects(found);
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handle, scheme, height, zoom]);
  // Frames wait until the page has settled and the overlay knows where everything is.
  useEffect(() => {
    if (ready) continueRender(handle);
  }, [ready, handle]);
  useEffect(() => {
    const doc = ref.current?.contentDocument;
    if (ready && doc && apply) apply(doc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, state]);
  useEffect(() => {
    const win = ref.current?.contentWindow;
    if (ready && win) win.scrollTo(0, Math.round(scroll / 2) * 2);
  }, [ready, scroll]);
  return (
    <div style={{ position: "relative", inlineSize: width * zoom, blockSize: height * zoom, overflow: "hidden" }}>
      <IFrame
        ref={ref}
        src={staticFile(`site/${page}`)}
        onLoad={onLoad}
        style={{ inlineSize: width, blockSize: height, border: 0, transform: `scale(${zoom})`, transformOrigin: "0 0", imageRendering: "pixelated" }}
      />
      {ready && overlay?.(rects)}
    </div>
  );
};
