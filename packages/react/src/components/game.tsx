/**
 * The game kit's CSS-only parts: Achievement, LevelTile, PauseMenu, Prompt, Stage, the HUD's frame and bars, and the
 * parts that go inside the Dialogue, Choices and Inventory elements. CSS from @jaatster/blip-game (game.css, or one file
 * per component: achievement.css, level.css, pause.css, prompt.css, stage.css, hud.css, dialogue.css, choices.css,
 * inventory.css).
 *
 * Sprites, hearts and counters are elements: wherever the markup has <pp-sprite>, <pp-hearts> or <pp-counter>, use
 * the generated <Sprite>, <Hearts> and <Counter> from this same entry point. Two documented classes sit on those
 * elements rather than on a part of their own: the current tile's arrow is `<Sprite className="pp-level-here"
 * name="arrow" />`, and a dialogue's answers are `<Choices className="pp-dialogue-choices">`.
 */
import { forwardRef } from "react";
import type { CSSProperties, ElementType, ReactNode } from "react";
import type { PolymorphicComponent, PolymorphicProps } from "../internal/polymorphic.js";
import { cx, flag, type NativeProps, type Tone, type Variant } from "../internal/props.js";

/** Something that shows only pictures or numbers needs a name: `aria-label`, or `aria-labelledby`. */
type Named = { "aria-label": string } | { "aria-labelledby": string };

/** What a POP part repeats in `data-pop` (the tint on its letters' lower rows): its children, when they are text. */
const popText = (children: ReactNode): string | undefined =>
  typeof children === "string" || typeof children === "number" ? String(children) : undefined;

/** The user's style plus a component's public custom properties; one left undefined is not written. */
function withVars(
  style: CSSProperties | undefined,
  vars: Record<`--${string}`, number | undefined>,
): CSSProperties | undefined {
  const set = Object.entries(vars).filter(([, value]) => value !== undefined);
  return set.length ? ({ ...style, ...Object.fromEntries(set) } as CSSProperties) : style;
}

/* ---------------------------------------------------------------------------------------------------------------
 * Achievement (achievement.css): a toast for something earned.
 * ------------------------------------------------------------------------------------------------------------- */

/** Props for {@link Achievements}. */
export type AchievementsProps = NativeProps<"div">;

/**
 * Where achievement toasts stack, newest first, and the polite live region they are announced from. Add an
 * {@link Achievement} to show one (it animates in by itself); take it away after five seconds or more, and never
 * put the only copy of something important in one.
 *
 *   <Achievements>{earned.map((a) => <Achievement key={a.id}>…</Achievement>)}</Achievements>
 *
 * Renders `<div class="pp-achievements" role="status">`.
 */
export const Achievements = forwardRef<HTMLDivElement, AchievementsProps>(function Achievements(
  { role = "status", className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("pp-achievements", className)} role={role} {...rest} />;
});

/** Own props of {@link Achievement}. */
export interface AchievementOwnProps {
  /** The toast's colour: slate (default), `neutral` for secrets, any candy for a set. `data-tone`. */
  tone?: Tone;
}
export type AchievementProps = AchievementOwnProps & NativeProps<"div", AchievementOwnProps>;

/**
 * A toast for something earned: a trophy in a dark well, what it is called and what it was for, and an optional
 * reward. It slides in four pixel steps, bumps, and a sparkle flares on the trophy three times; with reduced motion
 * it appears in place. Show it in {@link Achievements}.
 *
 *   <Achievement>
 *     <AchievementIcon><Sprite name="trophy" /></AchievementIcon>
 *     <AchievementLabel>Achievement unlocked</AchievementLabel>
 *     <AchievementTitle>Early bird</AchievementTitle>
 *     <AchievementText>Catch a falling star before sunrise.</AchievementText>
 *     <AchievementReward><Sprite name="coin" />+50</AchievementReward>
 *   </Achievement>
 *
 * Renders `<div class="pp-box pp-achievement">`.
 */
export const Achievement = forwardRef<HTMLDivElement, AchievementProps>(function Achievement(
  { tone, className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("pp-box pp-achievement", className)} data-tone={tone} {...rest} />;
});

/** Props for {@link AchievementIcon}. */
export type AchievementIconProps = NativeProps<"span">;

/**
 * The dark well the trophy (or any sprite) sits in. The two sparkles that flare on it come with it, after your
 * sprite: small, big, small, gone, three times; still with reduced motion.
 *
 *   <AchievementIcon><Sprite name="trophy" /></AchievementIcon>
 *
 * Renders `<span class="pp-box pp-achievement-icon">`, its children, then `<span class="pp-achievement-sparkles">`.
 */
export const AchievementIcon = forwardRef<HTMLSpanElement, AchievementIconProps>(function AchievementIcon(
  { className, children, ...rest },
  ref,
) {
  return (
    <span ref={ref} className={cx("pp-box pp-achievement-icon", className)} {...rest}>
      {children}
      <span className="pp-achievement-sparkles" />
    </span>
  );
});

/** Props for {@link AchievementLabel}. */
export type AchievementLabelProps = NativeProps<"p">;

/**
 * The line above the title, in Pixel Bop capitals: "Achievement unlocked", "Secret found".
 *
 *   <AchievementLabel>Achievement unlocked</AchievementLabel>
 *
 * Renders `<p class="pp-achievement-label">`.
 */
export const AchievementLabel = forwardRef<HTMLParagraphElement, AchievementLabelProps>(function AchievementLabel(
  { className, ...rest },
  ref,
) {
  return <p ref={ref} className={cx("pp-achievement-label", className)} {...rest} />;
});

/** Props for {@link AchievementTitle}. */
export type AchievementTitleProps = NativeProps<"p">;

/**
 * The achievement's name, in bold.
 *
 *   <AchievementTitle>Early bird</AchievementTitle>
 *
 * Renders `<p class="pp-achievement-title">`.
 */
export const AchievementTitle = forwardRef<HTMLParagraphElement, AchievementTitleProps>(function AchievementTitle(
  { className, ...rest },
  ref,
) {
  return <p ref={ref} className={cx("pp-achievement-title", className)} {...rest} />;
});

/** Props for {@link AchievementText}. */
export type AchievementTextProps = NativeProps<"p">;

/**
 * What was done, in one sentence: in the past, or as the goal.
 *
 *   <AchievementText>Catch a falling star before sunrise.</AchievementText>
 *
 * Renders `<p class="pp-achievement-text">`.
 */
export const AchievementText = forwardRef<HTMLParagraphElement, AchievementTextProps>(function AchievementText(
  { className, ...rest },
  ref,
) {
  return <p ref={ref} className={cx("pp-achievement-text", className)} {...rest} />;
});

/** Props for {@link AchievementReward}. */
export type AchievementRewardProps = NativeProps<"p">;

/**
 * An extra line for the reward: a sprite and an amount, in Pixel Bop.
 *
 *   <AchievementReward><Sprite name="coin" />+50</AchievementReward>
 *
 * Renders `<p class="pp-achievement-reward">`.
 */
export const AchievementReward = forwardRef<HTMLParagraphElement, AchievementRewardProps>(function AchievementReward(
  { className, ...rest },
  ref,
) {
  return <p ref={ref} className={cx("pp-achievement-reward", className)} {...rest} />;
});

/* ---------------------------------------------------------------------------------------------------------------
 * Level tile (level.css): one stop on a level map, and the dotted paths between them.
 * ------------------------------------------------------------------------------------------------------------- */

/** Props for {@link LevelMap}. */
export type LevelMapProps = NativeProps<"ol">;

/**
 * A level map: the tiles in order, in a row that wraps, with room above for the arrow. The list's order is the
 * path, and Tab moves along it. Each `<li>` holds a {@link LevelTile} and the {@link LevelPath} out of it. Name it.
 *
 *   <LevelMap aria-label="World 1 levels">
 *     <li><LevelTile aria-label="Level 1, Sprout Steps: 3 of 3 stars">…</LevelTile><LevelPath /></li>
 *     <li><LevelTile current aria-label="Level 2, Clover Hill: you are here">…</LevelTile><LevelPath locked /></li>
 *     <li><LevelTile locked aria-label="Level 3: locked"><Sprite name="padlock" /></LevelTile></li>
 *   </LevelMap>
 *
 * Renders `<ol class="pp-level-map">`.
 */
export const LevelMap = forwardRef<HTMLOListElement, LevelMapProps>(function LevelMap({ className, ...rest }, ref) {
  return <ol ref={ref} className={cx("pp-level-map", className)} {...rest} />;
});

/** Options of {@link LevelTile}. */
export interface LevelTileOptions {
  /** The tile's candy: accent (default), or any tone: a boss in `danger`, a bonus in `purple`. `data-tone`. */
  tone?: Tone;
  /** Where the player is: the tile sits in, bands swapped, under the bobbing arrow. `aria-current="step"`. */
  current?: boolean;
  /** Not open yet: dithered, but still focusable, so its name can say how to unlock it. `aria-disabled="true"`. */
  locked?: boolean;
}
/**
 * Own props of {@link LevelTile}: its options, and a name with everything the tile shows (its number, its name, the
 * stars, why it is locked) in `aria-label` or `aria-labelledby`: the stars and the padlock are pictures.
 */
export type LevelTileOwnProps = LevelTileOptions & Named;
export type LevelTileProps<T extends ElementType = "button"> = PolymorphicProps<T, LevelTileOwnProps>;

/**
 * One stop on a level map: a candy box with the level's number in Pixel Bop and the stars earned, a padlock when it
 * is locked, a sprite for a bonus. A button (`type="button"`) by default; `as="a"` with an href for a link. The
 * current tile carries the arrow first: `<Sprite className="pp-level-here" name="arrow" />`, which bobs over it for
 * five seconds, then rests.
 *
 *   <LevelTile aria-label="Level 2, Clover Hill: 2 of 3 stars">
 *     <LevelNumber>2</LevelNumber>
 *     <LevelStars><Sprite name="star" /><Sprite name="star" /><Sprite name="star-empty" /></LevelStars>
 *   </LevelTile>
 *   <LevelTile current aria-label="Level 3, Puddle Path: you are here">
 *     <Sprite className="pp-level-here" name="arrow" />
 *     <LevelNumber>3</LevelNumber>
 *   </LevelTile>
 *   <LevelTile locked tone="danger" aria-label="Level 5, the boss: locked"><Sprite name="padlock" /></LevelTile>
 *
 * Renders `<button type="button" class="pp-box pp-level">`.
 */
// The public type (the cast below) requires the name; inside, only the options are read.
export const LevelTile = forwardRef(function LevelTile(
  {
    as: Tag = "button",
    type,
    tone,
    current,
    locked,
    className,
    ...rest
  }: PolymorphicProps<ElementType, LevelTileOptions>,
  ref,
) {
  return (
    <Tag
      ref={ref}
      type={type ?? (Tag === "button" ? "button" : undefined)}
      className={cx("pp-box pp-level", className)}
      data-tone={tone}
      aria-current={current ? "step" : undefined}
      aria-disabled={locked ? true : undefined}
      {...rest}
    />
  );
}) as PolymorphicComponent<"button", LevelTileOwnProps>;

/** Props for {@link LevelNumber}. */
export type LevelNumberProps = NativeProps<"span">;

/**
 * The level's number, in Pixel Bop at scale 2 with tabular digits.
 *
 *   <LevelNumber>12</LevelNumber>
 *
 * Renders `<span class="pp-level-number">`.
 */
export const LevelNumber = forwardRef<HTMLSpanElement, LevelNumberProps>(function LevelNumber(
  { className, ...rest },
  ref,
) {
  return <span ref={ref} className={cx("pp-level-number", className)} {...rest} />;
});

/** Props for {@link LevelStars}. */
export type LevelStarsProps = NativeProps<"span">;

/**
 * The stars earned: three star sprites, full or empty, a pixel apart. Say the count in the tile's name.
 *
 *   <LevelStars><Sprite name="star" /><Sprite name="star" /><Sprite name="star-empty" /></LevelStars>
 *
 * Renders `<span class="pp-level-stars">`.
 */
export const LevelStars = forwardRef<HTMLSpanElement, LevelStarsProps>(function LevelStars(
  { className, ...rest },
  ref,
) {
  return <span ref={ref} className={cx("pp-level-stars", className)} {...rest} />;
});

/** Own props of {@link LevelPath}. */
export interface LevelPathOwnProps {
  /** Goes down to the next row instead of across. `data-direction="down"`. */
  direction?: "down";
  /** Not walked yet: the dots in the soft line colour. `data-locked`. */
  locked?: boolean;
  children?: never;
}
export type LevelPathProps = LevelPathOwnProps & NativeProps<"span", LevelPathOwnProps>;

/**
 * The dotted way from a tile to the next: dots two pixels square, two apart, `--pp-level-path` pixels long (10). It
 * is scenery, hidden from assistive technology: the list's order is the path.
 *
 *   <li><LevelTile current aria-label="Level 3, Puddle Path: you are here">…</LevelTile><LevelPath locked /></li>
 *
 * Renders `<span class="pp-level-path" aria-hidden="true">`.
 */
export const LevelPath = forwardRef<HTMLSpanElement, LevelPathProps>(function LevelPath(
  { direction, locked, className, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cx("pp-level-path", className)}
      data-direction={direction}
      data-locked={flag(locked)}
      aria-hidden={true}
      {...rest}
    />
  );
});

/* ---------------------------------------------------------------------------------------------------------------
 * Pause menu (pause.css): a native <dialog> over a dithered scrim.
 * ------------------------------------------------------------------------------------------------------------- */

/** Props for {@link PauseMenu}: a dialog's own, and a name: its title's id in `aria-labelledby` (or `aria-label`). */
export type PauseMenuProps = Named & NativeProps<"dialog">;

/**
 * The pause menu: a cream panel over a dithered ink scrim (its `::backdrop`), the title in POP, a few facts about
 * the run, the menu, and a hint line. A native `<dialog>`: `showModal()` on the ref moves focus to the first choice,
 * keeps Tab inside, makes the game inert and closes on Escape; focus goes back where it was when it closes. Inside a
 * {@link Stage}, `open` shows it in place without the modal (docs, attract screens), over a {@link StageScrim}. Stop
 * the game's clock and sounds while it is open.
 *
 *   <PauseMenu ref={pause} aria-labelledby="pause-title" onClose={resume}>
 *     <PauseTitle id="pause-title">Paused</PauseTitle>
 *     <PauseStats><span><Sprite name="coin" />42 coins</span><span><Sprite name="clock" />12:40</span></PauseStats>
 *     <Choices onChoice={(e) => e.detail.value === "resume" && pause.current?.close()}>
 *       <ChoiceList font="display">
 *         <li><Choice value="resume">Resume</Choice></li>
 *         <li><Choice value="quit">Quit to map</Choice></li>
 *       </ChoiceList>
 *     </Choices>
 *     <PauseHint><PromptKey>Esc</PromptKey> Resume</PauseHint>
 *   </PauseMenu>
 *
 * Renders `<dialog class="pp-box pp-pause">`.
 */
export const PauseMenu = forwardRef<HTMLDialogElement, PauseMenuProps>(function PauseMenu({ className, ...rest }, ref) {
  return <dialog ref={ref} className={cx("pp-box pp-pause", className)} {...rest} />;
});

/** Props for {@link PauseTitle}: a heading's own; `as` picks its level. */
export type PauseTitleProps<T extends ElementType = "h2"> = PolymorphicProps<T, object>;

/**
 * The pause menu's title, in Pixel Bop at scale 3, POP: "Paused", or the game's own word. Give it the id the menu
 * is named by.
 *
 *   <PauseTitle id="pause-title">Paused</PauseTitle>
 *
 * Renders `<h2 class="pp-pause-title pp-display pp-pop" data-scale="3" data-pop="Paused">`; `data-pop` repeats the
 * text (when the children are text).
 */
export const PauseTitle = forwardRef(function PauseTitle(
  { as: Tag = "h2", className, children, ...rest }: PauseTitleProps<ElementType>,
  ref,
) {
  return (
    <Tag
      ref={ref}
      className={cx("pp-pause-title pp-display pp-pop", className)}
      data-scale={3}
      data-pop={popText(children)}
      {...rest}
    >
      {children}
    </Tag>
  );
}) as PolymorphicComponent<"h2", object>;

/** Props for {@link PauseStats}. */
export type PauseStatsProps = NativeProps<"p">;

/**
 * A row of small facts about the run under the title: one `<span>` each, a sprite and its words.
 *
 *   <PauseStats><span><Sprite name="coin" />42 coins</span><span><Sprite name="star" />5 of 18</span></PauseStats>
 *
 * Renders `<p class="pp-pause-stats">`.
 */
export const PauseStats = forwardRef<HTMLParagraphElement, PauseStatsProps>(function PauseStats(
  { className, ...rest },
  ref,
) {
  return <p ref={ref} className={cx("pp-pause-stats", className)} {...rest} />;
});

/** Props for {@link PauseHint}. */
export type PauseHintProps = NativeProps<"p">;

/**
 * The hint line at the foot of the menu: a {@link Prompt} line in the muted ink.
 *
 *   <PauseHint><PromptKey>Esc</PromptKey> Resume</PauseHint>
 *
 * Renders `<p class="pp-pause-hint pp-prompt">`.
 */
export const PauseHint = forwardRef<HTMLParagraphElement, PauseHintProps>(function PauseHint(
  { className, ...rest },
  ref,
) {
  return <p ref={ref} className={cx("pp-pause-hint pp-prompt", className)} {...rest} />;
});

/* ---------------------------------------------------------------------------------------------------------------
 * Prompts (prompt.css): which button does what. Labels, not controls.
 * ------------------------------------------------------------------------------------------------------------- */

/** Props for {@link Prompt}. */
export type PromptProps = NativeProps<"p">;

/**
 * A line saying which button does what, in small bold capitals with the keys and buttons in the flow. Write it to
 * read as a sentence ("Press A to jump"), one action per line, the verb after the glyph. It is a label: if it
 * should do something, use a button.
 *
 *   <Prompt>Press <PromptButton button="a" /> to jump</Prompt>
 *   <Prompt><PromptKey>Esc</PromptKey> Pause</Prompt>
 *
 * Renders `<p class="pp-prompt">`.
 */
export const Prompt = forwardRef<HTMLParagraphElement, PromptProps>(function Prompt({ className, ...rest }, ref) {
  return <p ref={ref} className={cx("pp-prompt", className)} {...rest} />;
});

/** Own props of {@link PromptKey}. */
export interface PromptKeyOwnProps {
  /**
   * What an icon key is called ("Up arrow"), for screen readers: visually hidden text after the icon. Not needed
   * for keys with words or letters, which are read as they are.
   */
  label?: string;
}
export type PromptKeyProps = PromptKeyOwnProps & NativeProps<"kbd", PromptKeyOwnProps>;

/**
 * A keyboard key: a cream keycap with a front face three pixels deep, and a word (`Esc`, `Enter`), a letter or an
 * icon in Pixel Bop capitals. Wide keys take a `min-inline-size`.
 *
 *   <PromptKey>Esc</PromptKey>
 *   <PromptKey label="Up arrow"><Icon name="arrow-up" /></PromptKey>
 *
 * Renders `<kbd class="pp-box pp-prompt-key">`, with `<span class="pp-sr-only">` after its children for a `label`.
 */
export const PromptKey = forwardRef<HTMLElement, PromptKeyProps>(function PromptKey(
  { label, className, children, ...rest },
  ref,
) {
  return (
    <kbd ref={ref} className={cx("pp-box pp-prompt-key", className)} {...rest}>
      {children}
      {label ? <span className="pp-sr-only">{label}</span> : null}
    </kbd>
  );
});

/** Own props of {@link PromptButton}. */
export interface PromptButtonOwnProps {
  /**
   * The face button, in the colour players know: `a` green, `b` red, `x` blue, `y` orange (yellow is kept for
   * focus). Its letter is the label unless you pass children. `data-button`.
   */
  button?: "a" | "b" | "x" | "y";
  /** Any other colour, for another pad's buttons. `data-tone`. */
  tone?: Tone;
}
export type PromptButtonProps = PromptButtonOwnProps & NativeProps<"kbd", PromptButtonOwnProps>;

/**
 * A gamepad face button: a sixteen-pixel circle with its letter centred exactly. The letter always shows, so the
 * colour is never the only clue.
 *
 *   <Prompt>Press <PromptButton button="a" /> to jump</Prompt>
 *   <PromptButton tone="pink">L</PromptButton>
 *
 * Renders `<kbd class="pp-box pp-prompt-button" data-button="a">A</kbd>`.
 */
export const PromptButton = forwardRef<HTMLElement, PromptButtonProps>(function PromptButton(
  { button, tone, className, children, ...rest },
  ref,
) {
  return (
    <kbd ref={ref} className={cx("pp-box pp-prompt-button", className)} data-button={button} data-tone={tone} {...rest}>
      {children ?? button?.toUpperCase()}
    </kbd>
  );
});

/** Own props of {@link PromptShoulder}. */
export interface PromptShoulderOwnProps {
  /**
   * Which one: bumpers `lb`, `rb`, `l`, `r`; triggers `lt`, `rt`, `zl`, `zr` (taller, with rounder corners). Its name
   * in capitals is the label unless you pass children. `data-button`.
   */
  button?: "lb" | "rb" | "l" | "r" | "lt" | "rt" | "zl" | "zr";
}
export type PromptShoulderProps = PromptShoulderOwnProps & NativeProps<"kbd", PromptShoulderOwnProps>;

/**
 * A shoulder button: a slate bumper with white letters; triggers stand taller.
 *
 *   <Prompt>Hold <PromptShoulder button="rb" /> to dash</Prompt>
 *
 * Renders `<kbd class="pp-box pp-prompt-shoulder" data-button="rb">RB</kbd>`.
 */
export const PromptShoulder = forwardRef<HTMLElement, PromptShoulderProps>(function PromptShoulder(
  { button, className, children, ...rest },
  ref,
) {
  return (
    <kbd ref={ref} className={cx("pp-box pp-prompt-shoulder", className)} data-button={button} {...rest}>
      {children ?? button?.toUpperCase()}
    </kbd>
  );
});

/** Own props of {@link PromptDpad}. */
export interface PromptDpadOwnProps {
  /** The arm lit in the accent; left out, the pad at rest. `data-dir`. */
  direction?: "up" | "down" | "left" | "right";
  children?: never;
}
/** Props for {@link PromptDpad}: it is a picture, so it needs a name ("D-pad left"). */
export type PromptDpadProps = PromptDpadOwnProps & Named & NativeProps<"span", PromptDpadOwnProps>;

/**
 * The D-pad: an ink plus with a drop, a slate fill with a dimple, and one arm lit. A picture (`role="img"`), named
 * for what it shows.
 *
 *   <Prompt>
 *     <PromptDpad direction="left" aria-label="D-pad left" />
 *     <PromptDpad direction="right" aria-label="D-pad right" /> Move
 *   </Prompt>
 *   <PromptDpad aria-label="D-pad" />
 *
 * Renders `<span class="pp-prompt-dpad" role="img">`.
 */
export const PromptDpad = forwardRef<HTMLSpanElement, PromptDpadProps>(function PromptDpad(
  { direction, className, ...rest },
  ref,
) {
  return <span ref={ref} className={cx("pp-prompt-dpad", className)} data-dir={direction} role="img" {...rest} />;
});

/** Props for {@link PromptStart}. */
export type PromptStartProps = NativeProps<"p">;

/**
 * The title screen's PRESS START, in POP: it blinks on the beat for five seconds, then stays lit (blinking never runs
 * on); with reduced motion it does not blink.
 *
 *   <PromptStart>Press start</PromptStart>
 *
 * Renders `<p class="pp-prompt-start pp-display pp-pop" data-scale="2" data-pop="Press start">`; `data-pop` repeats
 * the text (when the children are text).
 */
export const PromptStart = forwardRef<HTMLParagraphElement, PromptStartProps>(function PromptStart(
  { className, children, ...rest },
  ref,
) {
  return (
    <p
      ref={ref}
      className={cx("pp-prompt-start pp-display pp-pop", className)}
      data-scale={2}
      data-pop={popText(children)}
      {...rest}
    >
      {children}
    </p>
  );
});

/* ---------------------------------------------------------------------------------------------------------------
 * Stage (stage.css): a game screen with a pastel sky and a ground strip.
 * ------------------------------------------------------------------------------------------------------------- */

/** Own props of {@link Stage}. */
export interface StageOwnProps {
  /** An ink edge and a drop, for a screen set into a page. `data-frame`. */
  frame?: boolean;
  /** Its own time of day, whatever the page's: a night level on a day page. `data-pp-scheme`. */
  scheme?: "day" | "sunset" | "night";
}
export type StageProps<T extends ElementType = "section"> = PolymorphicProps<T, StageOwnProps>;

/**
 * A game screen for a HUD, a menu or a map to sit on: a positioned frame with a pastel sky, six hard bands of the
 * scheme's world palette stepping up from a {@link StageGround}, dithered where they meet. For the full world, with
 * mountains, hills and clouds, pass a `<World>` (from @jaatster/blip-react/effects) as its first child; until it draws,
 * the banded sky shows. Name it if it is a region of the page.
 *
 *   <Stage frame aria-label="Puddle Path">
 *     <World />
 *     <Hud>…</Hud>
 *     <StageGround />
 *   </Stage>
 *
 * Renders `<section class="pp-stage">`; `as="div"` for a small one inside something else (a feature's picture).
 */
export const Stage = forwardRef(function Stage(
  { as: Tag = "section", frame, scheme, className, ...rest }: StageProps<ElementType>,
  ref,
) {
  return (
    <Tag ref={ref} className={cx("pp-stage", className)} data-frame={flag(frame)} data-pp-scheme={scheme} {...rest} />
  );
}) as PolymorphicComponent<"section", StageOwnProps>;

/** Own props of {@link StageGround}. */
export interface StageGroundOwnProps {
  /** The ground's height in pixels; 16 by default. `--pp-stage-ground`. */
  height?: number;
  children?: never;
}
export type StageGroundProps = StageGroundOwnProps & NativeProps<"div", StageGroundOwnProps>;

/**
 * The ground along the bottom of a {@link Stage}: blades of grass, a light top row, grass, a darker lip, then dirt
 * with pebbles and a few flowers. Last in the stage.
 *
 *   <StageGround />
 *   <StageGround height={10} />
 *
 * Renders `<div class="pp-stage-ground">`.
 */
export const StageGround = forwardRef<HTMLDivElement, StageGroundProps>(function StageGround(
  { height, className, style, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cx("pp-stage-ground", className)}
      style={withVars(style, { "--pp-stage-ground": height })}
      {...rest}
    />
  );
});

/** Props for {@link StageScrim}. */
export type StageScrimProps = NativeProps<"div">;

/**
 * A dithered ink layer over everything on a {@link Stage}, for a pause or a menu over the game: a checkerboard,
 * never a translucent wash. (A modal {@link PauseMenu} brings its own as its backdrop.)
 *
 *   <Stage frame aria-label="Puddle Path, paused">
 *     <Hud aria-hidden="true">…</Hud>
 *     <StageGround />
 *     <StageScrim />
 *     <PauseMenu open aria-labelledby="pause-title">…</PauseMenu>
 *   </Stage>
 *
 * Renders `<div class="pp-scrim">`.
 */
export const StageScrim = forwardRef<HTMLDivElement, StageScrimProps>(function StageScrim({ className, ...rest }, ref) {
  return <div ref={ref} className={cx("pp-scrim", className)} {...rest} />;
});

/* ---------------------------------------------------------------------------------------------------------------
 * HUD (hud.css): the heads-up display. Hearts and counters are elements: <Hearts>, <Counter>.
 * ------------------------------------------------------------------------------------------------------------- */

/** Props for {@link Hud}. */
export type HudProps = NativeProps<"div">;

/**
 * The heads-up display over a game: rows of {@link HudGroup}s that wrap, the last kept to the far side even on a
 * row of its own. Numbers are Pixel Bop's tabular digits in POP, so they read on any part of the world and never
 * shift. Keep it to the top edge, out of the play, and pad scores so it never jiggles.
 *
 *   <Hud>
 *     <HudGroup>
 *       <Hearts value={3.5} max={5} label="Health" />
 *       <HudStat>
 *         <HudLabel>MP</HudLabel>
 *         <HudBar value={5} max={8} segments={8} tone="blue" aria-label="Magic" />
 *       </HudStat>
 *     </HudGroup>
 *     <HudGroup>
 *       <Counter value={42} pad={3} label="Coins" sound="coin"><Sprite name="coin" /></Counter>
 *       <Counter value={12450} pad={7} label="Score"><HudLabel>Score</HudLabel></Counter>
 *       <Counter value={165} format="time" low={30} label="Time" quiet><Sprite name="clock" /></Counter>
 *     </HudGroup>
 *   </Hud>
 *
 * Renders `<div class="pp-hud">`.
 */
export const Hud = forwardRef<HTMLDivElement, HudProps>(function Hud({ className, ...rest }, ref) {
  return <div ref={ref} className={cx("pp-hud", className)} {...rest} />;
});

/** Props for {@link HudGroup}. */
export type HudGroupProps = NativeProps<"div">;

/**
 * Things in the HUD that stay together, in a row that wraps: hearts and a bar, or the counters.
 *
 *   <HudGroup><Hearts value={3} max={5} label="Health" /><HudStat>…</HudStat></HudGroup>
 *
 * Renders `<div class="pp-hud-group">`.
 */
export const HudGroup = forwardRef<HTMLDivElement, HudGroupProps>(function HudGroup({ className, ...rest }, ref) {
  return <div ref={ref} className={cx("pp-hud-group", className)} {...rest} />;
});

/** Props for {@link HudStat}. */
export type HudStatProps = NativeProps<"div">;

/**
 * A label beside its bar or number.
 *
 *   <HudStat><HudLabel>HP</HudLabel><HudBar value={7} aria-label="Health" /></HudStat>
 *
 * Renders `<div class="pp-hud-stat">`.
 */
export const HudStat = forwardRef<HTMLDivElement, HudStatProps>(function HudStat({ className, ...rest }, ref) {
  return <div ref={ref} className={cx("pp-hud-stat", className)} {...rest} />;
});

/** Props for {@link HudLabel}. */
export type HudLabelProps = NativeProps<"span">;

/**
 * A HUD label: one short word in capitals (HP, MP, Score), in Pixel Bop at scale 1, POP. Hidden from assistive
 * technology by default, because the bar's or counter's name says the same; pass `aria-hidden={false}` when it is
 * the only name.
 *
 *   <HudLabel>MP</HudLabel>
 *
 * Renders `<span class="pp-hud-label pp-display pp-pop" data-scale="1" aria-hidden="true">`.
 */
export const HudLabel = forwardRef<HTMLSpanElement, HudLabelProps>(function HudLabel({ className, ...rest }, ref) {
  return (
    <span
      ref={ref}
      className={cx("pp-hud-label pp-display pp-pop", className)}
      data-scale={1}
      aria-hidden={true}
      {...rest}
    />
  );
});

/** Own props of {@link HudBar}. */
export interface HudBarOwnProps {
  /** The value, drawn in whole segments (rounded down) and announced. `--pp-hud-value` and `aria-valuenow`. */
  value: number;
  /** The most it can be; 10 by default. `--pp-hud-max` and `aria-valuemax`. */
  max?: number;
  /** How many segments the bar has, each five pixels wide; 10 by default. `--pp-hud-segments`. */
  segments?: number;
  /** The fill's colour: success (default), or any tone: `blue` for mana, `danger` when low. `data-tone`. */
  tone?: Tone;
  children?: never;
}
/** Props for {@link HudBar}: a meter needs a name, `aria-label` or `aria-labelledby` ("Magic"). */
export type HudBarProps = HudBarOwnProps & Named & NativeProps<"div", HudBarOwnProps>;

/**
 * A segmented health or mana bar: a slate track in a candy box, segments five pixels wide with ink between, filled
 * in whole segments. A meter from 0 to `max`: its value is the drawing's, so they never disagree. Low is red and
 * shorter, never colour alone.
 *
 *   <HudBar value={5} max={8} segments={8} tone="blue" aria-label="Magic" />
 *   <HudBar value={2} tone="danger" aria-label="Health, low" />
 *
 * Renders `<div class="pp-box pp-hud-bar" role="meter" aria-valuemin="0" aria-valuemax aria-valuenow
 * style="--pp-hud-value: …">` with its `<span class="pp-hud-bar-fill">` inside.
 */
export const HudBar = forwardRef<HTMLDivElement, HudBarProps>(function HudBar(
  { value, max, segments, tone, className, style, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cx("pp-box pp-hud-bar", className)}
      data-tone={tone}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={max ?? 10}
      aria-valuenow={value}
      style={withVars(style, { "--pp-hud-value": value, "--pp-hud-max": max, "--pp-hud-segments": segments })}
      {...rest}
    >
      <span className="pp-hud-bar-fill" />
    </div>
  );
});

/** Props for {@link CounterIcon}. */
export type CounterIconProps = NativeProps<"span">;

/**
 * A `<Counter>`'s icon when it is not a sprite or an SVG (an image, say): the counter bumps it on every gain, as it
 * does a sprite or an icon by itself. Like them, it says nothing: the counter's `label` does.
 *
 *   <Counter value={gems} label="Gems"><CounterIcon><img src={gem} alt="" /></CounterIcon></Counter>
 *
 * Renders `<span class="pp-counter-icon">`.
 */
export const CounterIcon = forwardRef<HTMLSpanElement, CounterIconProps>(function CounterIcon(
  { className, ...rest },
  ref,
) {
  return <span ref={ref} className={cx("pp-counter-icon", className)} {...rest} />;
});

/* ---------------------------------------------------------------------------------------------------------------
 * Dialogue (dialogue.css): the parts inside <Dialogue>, the RPG text box.
 * ------------------------------------------------------------------------------------------------------------- */

/** Own props of {@link DialogueName}. */
export interface DialogueNameOwnProps {
  /** The speaker's colour: give each speaker one, and use it every time they speak. `data-tone`. */
  tone?: Tone;
}
export type DialogueNameProps = DialogueNameOwnProps & NativeProps<"span", DialogueNameOwnProps>;

/**
 * The speaker's name, on a small candy tab riding the dialogue's top edge, in Pixel Bop. It names the box, and
 * screen readers hear it before each page ("Bramble: Ah, a traveller!").
 *
 *   <Dialogue voice>
 *     <DialogueName tone="green">Bramble</DialogueName>
 *     <DialoguePortrait tone="teal"><svg>…</svg></DialoguePortrait>
 *     <DialogueBody>
 *       <DialogueText>
 *         <p>Ah, a traveller! The rope bridge washed out in last night's storm.</p>
 *         <p>I could patch it up before sunset, for thirty coins.</p>
 *       </DialogueText>
 *       <Choices className="pp-dialogue-choices">
 *         <ChoiceList>
 *           <li><Choice value="pay">Pay 30 coins</Choice></li>
 *           <li><Choice value="later">Maybe later</Choice></li>
 *         </ChoiceList>
 *       </Choices>
 *     </DialogueBody>
 *   </Dialogue>
 *
 * Renders `<span class="pp-box pp-dialogue-name">`.
 */
export const DialogueName = forwardRef<HTMLSpanElement, DialogueNameProps>(function DialogueName(
  { tone, className, ...rest },
  ref,
) {
  return <span ref={ref} className={cx("pp-box pp-dialogue-name", className)} data-tone={tone} {...rest} />;
});

/** Own props of {@link DialoguePortrait}. */
export interface DialoguePortraitOwnProps {
  /** The frame's colour. `data-tone`. */
  tone?: Tone;
}
export type DialoguePortraitProps = DialoguePortraitOwnProps & NativeProps<"div", DialoguePortraitOwnProps>;

/**
 * A framed slot for the speaker's portrait, 36 pixels square (`--pp-dialogue-portrait`): a soft candy box with the
 * art standing at its bottom, one sprite pixel to one Blip pixel. Leave the art unnamed: the tab says who it is.
 *
 *   <DialoguePortrait tone="teal"><svg className="pp-sprite" aria-hidden="true">…</svg></DialoguePortrait>
 *
 * Renders `<div class="pp-box pp-dialogue-portrait" data-variant="soft">`.
 */
export const DialoguePortrait = forwardRef<HTMLDivElement, DialoguePortraitProps>(function DialoguePortrait(
  { tone, className, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cx("pp-box pp-dialogue-portrait", className)}
      data-variant="soft"
      data-tone={tone}
      {...rest}
    />
  );
});

/** Props for {@link DialogueBody}. */
export type DialogueBodyProps = NativeProps<"div">;

/**
 * The dialogue's column beside the portrait: the {@link DialogueText}, then the choices, if any
 * (`<Choices className="pp-dialogue-choices">`), which show once the last page has typed.
 *
 *   <DialogueBody><DialogueText>…</DialogueText></DialogueBody>
 *
 * Renders `<div class="pp-dialogue-body">`.
 */
export const DialogueBody = forwardRef<HTMLDivElement, DialogueBodyProps>(function DialogueBody(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("pp-dialogue-body", className)} {...rest} />;
});

/** Props for {@link DialogueText}. */
export type DialogueTextProps = NativeProps<"div">;

/**
 * The pages: one child each, usually a `<p>`. The element types them in one at a time and gives screen readers each
 * whole page; without JavaScript every page shows, one after another. One thought per page, three lines or fewer;
 * no links or fields (the typed copy is hidden from screen readers). `<Dialogue font="display">` sets them in Pixel
 * Bop capitals, for signs and short barks.
 *
 *   <DialogueText><p>Ah, a traveller!</p><p>The rope bridge washed out in last night's storm.</p></DialogueText>
 *
 * Renders `<div class="pp-dialogue-text">`.
 */
export const DialogueText = forwardRef<HTMLDivElement, DialogueTextProps>(function DialogueText(
  { className, ...rest },
  ref,
) {
  return <div ref={ref} className={cx("pp-dialogue-text", className)} {...rest} />;
});

/* ---------------------------------------------------------------------------------------------------------------
 * Choices (choices.css): the list inside <Choices>, with the pixel pointer.
 * ------------------------------------------------------------------------------------------------------------- */

/** Own props of {@link ChoiceList}. */
export interface ChoiceListOwnProps {
  /** Pixel Bop capitals, for title screens and pause menus. `data-font="display"`. */
  font?: "display";
}
export type ChoiceListProps = ChoiceListOwnProps & NativeProps<"ul", ChoiceListOwnProps>;

/**
 * The list inside `<Choices>`: as wide as its widest choice, so every highlight matches, with room on the start
 * side for the white glove that points at the choice under the cursor or the keyboard. One {@link Choice} in each
 * `<li>`; keep the safe one last.
 *
 *   <Choices onChoice={(e) => start(e.detail.value)}>
 *     <ChoiceList font="display">
 *       <li><Choice value="new">New game</Choice></li>
 *       <li><Choice value="continue">Continue</Choice></li>
 *     </ChoiceList>
 *   </Choices>
 *
 * Renders `<ul class="pp-choices" role="list">`.
 */
export const ChoiceList = forwardRef<HTMLUListElement, ChoiceListProps>(function ChoiceList(
  { font, role = "list", className, ...rest },
  ref,
) {
  return <ul ref={ref} className={cx("pp-choices", className)} role={role} data-font={font} {...rest} />;
});

/** Own props of {@link Choice}. */
export interface ChoiceOwnProps {
  /** The tier: ghost (the default here), quiet until pointed at; a candy choice would shout. `data-variant`. */
  variant?: Variant;
}
export type ChoiceProps = ChoiceOwnProps & NativeProps<"button", ChoiceOwnProps>;

/**
 * One choice: a real button, quiet until the pointer or the keyboard is on it. Its `value` is what `<Choices>`
 * reports (else its text). A sprite or an icon may lead; a {@link ChoiceAside} sits at the far end. A choice that
 * can't be taken stays in the list and says why: `aria-disabled` (dithered, skipped by the arrow keys, still read)
 * and the reason in its words. Two to four words, a verb first.
 *
 *   <li><Choice value="trade">Trade the moon key</Choice></li>
 *   <li><Choice value="pay" aria-disabled>Pay 30 coins <ChoiceAside>You have 12</ChoiceAside></Choice></li>
 *
 * Renders `<button type="button" class="pp-box pp-choice" data-variant="ghost">`.
 */
export const Choice = forwardRef<HTMLButtonElement, ChoiceProps>(function Choice(
  { type = "button", variant = "ghost", className, ...rest },
  ref,
) {
  return (
    <button ref={ref} type={type} className={cx("pp-box pp-choice", className)} data-variant={variant} {...rest} />
  );
});

/** Props for {@link ChoiceAside}. */
export type ChoiceAsideProps = NativeProps<"span">;

/**
 * Something said beside a choice, at its far end: a price, a count, a key.
 *
 *   <Choice value="potion"><Sprite name="potion" />Red potion <ChoiceAside>12</ChoiceAside></Choice>
 *
 * Renders `<span class="pp-choice-aside">`.
 */
export const ChoiceAside = forwardRef<HTMLSpanElement, ChoiceAsideProps>(function ChoiceAside(
  { className, ...rest },
  ref,
) {
  return <span ref={ref} className={cx("pp-choice-aside", className)} {...rest} />;
});

/* ---------------------------------------------------------------------------------------------------------------
 * Inventory (inventory.css): the slots inside <Inventory>, a grid of `--pp-inventory-columns` slots across.
 * ------------------------------------------------------------------------------------------------------------- */

/** Own props of {@link Slot}. */
export interface SlotOwnProps {
  /**
   * The item's rarity, which tints the slot: common (cream, the default), uncommon (green), rare (blue), epic
   * (purple), legendary (orange). Say it in the slot's name too. `data-rarity`.
   */
  rarity?: "common" | "uncommon" | "rare" | "epic" | "legendary";
  /** soft (the default here) for a slot with an item in it; outline for an empty one, flat, no drop. `data-variant`. */
  variant?: "soft" | "outline";
  /** A colour outside the rarity scale. `data-tone`. */
  tone?: Tone;
  /** The selected slot: sits in, bands swapped. `<Inventory>` moves it as the player picks. `aria-selected`. */
  selected?: boolean;
  /** Can't be picked: dithered, and the arrow keys skip it. `aria-disabled="true"`. */
  locked?: boolean;
}
export type SlotProps<T extends ElementType = "button"> = PolymorphicProps<T, SlotOwnProps>;

/**
 * One item slot of an `<Inventory>`: a soft candy box holding one sprite, tinted by rarity, maybe with a
 * {@link SlotCount} and a {@link SlotTag}. The element makes the slots the options of its listbox. Name every slot
 * with what it holds, how many, and anything shown only by colour or a tag ("Dusk gem, epic, 2"); an empty one is
 * "Empty". Leave its sprite unnamed.
 *
 *   <Inventory aria-label="Backpack" onSelect={(e) => show(e.detail.value)}>
 *     <Slot aria-label="Red potion, 3"><Sprite name="potion" /><SlotCount>3</SlotCount></Slot>
 *     <Slot rarity="rare" selected aria-label="Moon key, rare"><Sprite name="key" tone="blue" /></Slot>
 *     <Slot variant="outline" aria-label="Empty" />
 *   </Inventory>
 *
 * Renders `<button type="button" class="pp-box pp-slot" data-variant="soft">`; `as="span"` for a picture of a slot
 * outside the grid (beside the selected item's details).
 */
export const Slot = forwardRef(function Slot(
  {
    as: Tag = "button",
    type,
    rarity,
    variant = "soft",
    tone,
    selected,
    locked,
    className,
    ...rest
  }: SlotProps<ElementType>,
  ref,
) {
  return (
    <Tag
      ref={ref}
      type={type ?? (Tag === "button" ? "button" : undefined)}
      className={cx("pp-box pp-slot", className)}
      data-variant={variant}
      data-rarity={rarity}
      data-tone={tone}
      aria-selected={selected}
      aria-disabled={locked ? true : undefined}
      {...rest}
    />
  );
}) as PolymorphicComponent<"button", SlotOwnProps>;

/** Props for {@link SlotCount}. */
export type SlotCountProps = NativeProps<"span">;

/**
 * How many are in the slot: Pixel Bop digits in POP, in the bottom corner. Hidden from assistive technology by
 * default: say the count in the slot's name.
 *
 *   <SlotCount>3</SlotCount>
 *
 * Renders `<span class="pp-slot-count pp-display pp-pop" data-scale="1" aria-hidden="true">`.
 */
export const SlotCount = forwardRef<HTMLSpanElement, SlotCountProps>(function SlotCount({ className, ...rest }, ref) {
  return (
    <span
      ref={ref}
      className={cx("pp-slot-count pp-display pp-pop", className)}
      data-scale={1}
      aria-hidden={true}
      {...rest}
    />
  );
});

/** Own props of {@link SlotTag}. */
export interface SlotTagOwnProps {
  /** The tag's colour. `data-tone`. */
  tone?: Tone;
}
export type SlotTagProps = SlotTagOwnProps & NativeProps<"span", SlotTagOwnProps>;

/**
 * A tiny candy label on the slot's top corner: "E" for equipped, "New". Hidden from assistive technology by
 * default: say it in the slot's name ("Reed sword, uncommon, equipped").
 *
 *   <SlotTag tone="neutral">E</SlotTag>
 *
 * Renders `<span class="pp-box pp-slot-tag" aria-hidden="true">`.
 */
export const SlotTag = forwardRef<HTMLSpanElement, SlotTagProps>(function SlotTag({ tone, className, ...rest }, ref) {
  return (
    <span ref={ref} className={cx("pp-box pp-slot-tag", className)} data-tone={tone} aria-hidden={true} {...rest} />
  );
});
