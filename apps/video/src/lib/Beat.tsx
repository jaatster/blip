import { useLayoutEffect, useRef, type ReactNode } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

type Props = {
  /** The frame its animations start from (the frame something happened). */
  readonly at: number;
  /** Shown from this frame (`at` by default) until `until`. */
  readonly from?: number;
  readonly until?: number;
  readonly children: ReactNode;
};

/**
 * Blip's motion is CSS animation: a page plays it on the clock, a video frame must show it at one moment. A Beat
 * shows its children from `from` and holds every CSS animation inside them (pseudo-elements too) paused at the time
 * since `at`, so any frame renders the same, alone or in order. A Beat inside a Beat keeps its own animations.
 */
export const Beat = ({ at, from = at, until = Infinity, children }: Props) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ref = useRef<HTMLDivElement>(null);
  const shown = frame >= from && frame < until;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ms = Math.max(0, ((frame - at) / fps) * 1000);
    for (const a of el.getAnimations({ subtree: true })) {
      // Scroll-driven animations (Blip's scroll cues) follow a scroller, not the clock.
      if (a.timeline !== document.timeline) continue;
      const target = (a.effect as KeyframeEffect | null)?.target;
      if (target && target.closest("[data-beat]") !== el) continue;
      a.pause();
      a.currentTime = ms;
    }
  });

  return shown ? (
    <div data-beat="" ref={ref} style={{ display: "contents" }}>
      {children}
    </div>
  ) : null;
};
