/** The site's map: the sections in the app bar, and what each section's sidebar lists. */
import { groupedComponents } from "./data";

export interface NavItem {
  title: string;
  url: string;
  icon?: string;
  hint?: string;
}
export interface NavGroup {
  title?: string;
  items: NavItem[];
}
export interface Section {
  id: string;
  title: string;
  short: string;
  url: string;
  icon: string;
  groups: () => NavGroup[];
}

export const FOUNDATIONS: (NavItem & { slug: string; blurb: string })[] = [
  { slug: "colour", title: "Colour", url: "/foundations/colour/", icon: "palette", blurb: "Ten candies, three schemes, every pair checked." },
  { slug: "pixel", title: "The pixel and space", url: "/foundations/pixel/", icon: "maximize", blurb: "One square pixel, and spacing counted in it." },
  { slug: "type", title: "Type", url: "/foundations/type/", icon: "bold", blurb: "Pixel Bop for big text, Pixelify Sans for the rest." },
  { slug: "shape", title: "Shape", url: "/foundations/shape/", icon: "puzzle", blurb: "The candy box, its corners and its tiers." },
  { slug: "depth", title: "Depth", url: "/foundations/depth/", icon: "archive", blurb: "A one-pixel drop. Things lift and sit in." },
  { slug: "motion", title: "Motion", url: "/foundations/motion/", icon: "fast-forward", blurb: "Frames and steps, never curves." },
  { slug: "states", title: "States", url: "/foundations/states/", icon: "sliders", blurb: "One look per state, everywhere." },
  { slug: "sound", title: "Sound", url: "/foundations/sound/", icon: "volume", blurb: "Eleven chip sounds, off until asked for." },
  { slug: "icons", title: "Icons", url: "/foundations/icons/", icon: "star", blurb: "Every icon, on the font's grid." },
  { slug: "accessibility", title: "Accessibility", url: "/foundations/accessibility/", icon: "eye", blurb: "What the system does for you, and what it asks." },
];

export const TEMPLATES: (NavItem & { slug: string; blurb: string })[] = [
  { slug: "dashboard", title: "Dashboard", url: "/templates/dashboard/", icon: "table", blurb: "An app shell for a game's live ops: stats, a sortable table, segmented charts and toasts." },
  { slug: "landing", title: "Landing page", url: "/templates/landing/", icon: "desktop", blurb: "A launch page put together from the blocks, with a world that follows the clock." },
  { slug: "game", title: "Game menu", url: "/templates/game/", icon: "gamepad", blurb: "A title screen, a main menu, a level with its HUD and a talking frog, and a pause menu." },
];

export const SECTIONS: Section[] = [
  {
    id: "start",
    title: "Get started",
    short: "Start",
    url: "/start/",
    icon: "rocket",
    groups: () => [{ items: [{ title: "Get started", url: "/start/", icon: "rocket" }, { title: "Versions and support", url: "/versions/", icon: "tag" }, { title: "Diagnostics", url: "/diagnostics/", icon: "bug" }, { title: "All pages", url: "/search/", icon: "search" }] }],
  },
  {
    id: "foundations",
    title: "Foundations",
    short: "Basics",
    url: "/foundations/",
    icon: "palette",
    groups: () => [{ items: [{ title: "Overview", url: "/foundations/", icon: "home" }, ...FOUNDATIONS] }],
  },
  {
    id: "components",
    title: "Components",
    short: "Parts",
    url: "/components/",
    icon: "puzzle",
    groups: () => [
      { items: [{ title: "All components", url: "/components/", icon: "home" }] },
      ...groupedComponents().map(({ group, docs }) => ({ title: group.title, items: docs.map((d) => ({ title: d.meta.name, url: d.url })) })),
    ],
  },
  {
    id: "templates",
    title: "Templates",
    short: "Screens",
    url: "/templates/",
    icon: "desktop",
    groups: () => [{ items: [{ title: "Overview", url: "/templates/", icon: "home" }, ...TEMPLATES] }],
  },
  {
    id: "theme",
    title: "Palette maker",
    short: "Palette",
    url: "/theme/",
    icon: "brush",
    groups: () => [],
  },
];

export function sectionOf(path: string): Section | undefined {
  if (path.startsWith("/diagnostics") || path.startsWith("/search") || path.startsWith("/versions")) return SECTIONS[0];
  return SECTIONS.find((s) => path.startsWith(s.url));
}

/** Every page in reading order, for previous and next links. */
export function readingOrder(): NavItem[] {
  return SECTIONS.flatMap((s) => s.groups().flatMap((g) => g.items)).filter((i, n, all) => all.findIndex((x) => x.url === i.url) === n && i.url !== "/search/");
}
