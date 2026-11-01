/**
 * Shared prop types and helpers for the hand-written components. Every value here is one the CSS reads: a prop
 * becomes the data-* or ARIA attribute the component's CSS documents, never a style.
 */
import type { ComponentPropsWithoutRef, ElementType } from "react";

/** The candy box's tiers, loud to quiet (`data-variant`). */
export type Variant = "candy" | "soft" | "outline" | "ghost";
/** The calm panel tier some components use (`data-variant="panel"`). */
export type PanelVariant = Variant | "panel";
/** The four intents. */
export type Intent = "info" | "success" | "warning" | "danger";
/** The raw candies: for games and decoration. Yellow is for coins and stars. */
export type Candy = "red" | "orange" | "yellow" | "green" | "teal" | "blue" | "purple" | "pink" | "slate";
/** A box's colour (`data-tone`): meaning first (`danger` for destructive actions), candy names for decoration. */
export type Tone = "accent" | Intent | "neutral" | Candy;
/** Control heights: 16, 20 or 24 pixels (`data-size`). */
export type Size = "sm" | "md" | "lg";
/** Corner radius in pixels (`data-chu-r`). */
export type Radius = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
/** Pixel Bop's whole scales (`data-scale`). */
export type Scale = 1 | 2 | 3 | 4;
/** Spacing steps in pixels, as the layout components take them (`data-gap`). */
export type Space = 0 | 1 | 2 | 3 | 4 | 6 | 8 | 12 | 16 | 24 | 32;

/** Props every candy box takes. */
export interface BoxProps {
  /** The tier: candy (default), soft, outline or ghost. `data-variant`. */
  variant?: Variant;
  /** The colour: accent (default), an intent, neutral, or a candy name. `data-tone`. */
  tone?: Tone;
  /** Corner radius in pixels, 0 to 8. `data-chu-r`. */
  radius?: Radius;
}

/** The attributes for BoxProps. */
export const box = ({ variant, tone, radius }: BoxProps) => ({ "data-variant": variant, "data-tone": tone, "data-chu-r": radius });

/** Joins class names, skipping empty ones. */
export function cx(...names: (string | false | null | undefined)[]): string {
  return names.filter(Boolean).join(" ");
}

/** A present-or-absent attribute: "" when on, left out when off. */
export const flag = (on: boolean | undefined): "" | undefined => (on ? "" : undefined);

/** Props of an element type, without ref, minus the component's own. */
export type NativeProps<T extends ElementType, Own = object> = Omit<ComponentPropsWithoutRef<T>, keyof Own>;
