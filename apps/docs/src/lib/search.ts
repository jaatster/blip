/**
 * The search index: every page, component and token, with words to match. Built with the site; after the build,
 * scripts/search-sections.mjs adds each page's headings, so a search can open a page at the section it found.
 * The matching (synonyms, sections, typos) is public/js/search-match.js, shared by the palette and the A to Z page.
 */
import { APG, componentDocs, diagnostics, headingsOf, manifest, summary } from "./data";
import { FOUNDATIONS, TEMPLATES } from "./nav";
import { reactFamily } from "./react";

export interface Item {
  title: string;
  url: string;
  hint: string;
  icon?: string;
  keywords: string;
  /** Words people search with that the page does not use (SYNONYMS). */
  synonyms?: string;
  /** The page's headings, [id, text, words that also find it]: added after the build. */
  sections?: [string, string, string?][];
}
export interface Group {
  title: string;
  items: Item[];
}
export interface SearchData {
  groups: Group[];
  /** "<url>#<id>" -> words that should find that section (the synonyms below that point at a section). */
  sectionWords: Record<string, string>;
}

const words = (...parts: (string | undefined | null)[]) => parts.filter(Boolean).join(" ").toLowerCase().replace(/[^a-z0-9 \-:]+/g, " ").replace(/\s+/g, " ").trim();

/**
 * The words people search with that the docs do not use, and the pages (or sections) they mean. A word here finds
 * its page as if the page said it.
 */
export const SYNONYMS: [terms: string, to: string[]][] = [
  ["modal popup", ["/components/dialog/"]],
  ["dropdown drop-down", ["/components/select/", "/components/menu/"]],
  ["snackbar notification", ["/components/toast/"]],
  ["upload", ["/components/file-drop/"]],
  ["date date-picker datepicker", ["/components/input/"]],
  ["loading spinner", ["/components/loader/", "/components/skeleton/", "/components/progress/"]],
  ["validation validate form error-message", ["/components/field/"]],
  ["dark mode dark-mode light mode", ["/start/#theming", "/foundations/colour/#schemes"]],
  ["tailwind", ["/start/#tailwind"]],
  ["vue svelte", ["/start/#frameworks"]],
  ["ssr server-rendering next-js nextjs", ["/start/#react"]],
  ["responsive mobile media-query", ["/foundations/pixel/#breakpoints"]],
  ["brand", ["/theme/"]],
  ["btn", ["/components/button/"]],
  ["rtl right-to-left bidi direction", ["/start/#languages"]],
];

export function searchData(): SearchData {
  const pages: Item[] = [
    { title: "Home", url: "/", hint: "Page", icon: "home", keywords: words("blip overview rules budgets kits sizes") },
    { title: "Get started", url: "/start/", hint: "Page", icon: "rocket", keywords: words("install npm pnpm cdn import map css order layers web components elements react frameworks angular theming scheme pixel auto clock reduced motion diagnostics") },
    { title: "Versions and support", url: "/versions/", hint: "Page", icon: "tag", keywords: words("versions semver semantic versioning release stable beta status deprecation deprecated migration upgrade breaking changes changelog browser support baseline help issues bugs security") },
    { title: "Palette maker", url: "/theme/", hint: "Page", icon: "brush", keywords: words("palette maker theme builder accent colour color custom hex levers preset dracula nord catppuccin gruvbox tokyo night rose pine ember grape export dtcg tokens css resolver contrast override") },
    { title: "Diagnostics", url: "/diagnostics/", hint: "Page", icon: "bug", keywords: words("warnings errors codes console", [...diagnostics().keys()].join(" ")) },
    { title: "Templates", url: "/templates/", hint: "Page", icon: "desktop", keywords: words("examples screens dashboard landing game menu") },
    { title: "Starfall", url: "/play/", hint: "Game", icon: "gamepad", keywords: words("play game platformer demo made with blip pip bramble") },
    { title: "Components", url: "/components/", hint: "Page", icon: "puzzle", keywords: words("all components index") },
    { title: "Foundations", url: "/foundations/", hint: "Page", icon: "palette", keywords: words("basics foundations overview") },
  ];
  const foundations: Item[] = FOUNDATIONS.map((f) => ({ title: f.title, url: f.url, hint: "Foundation", icon: f.icon, keywords: words(f.blurb) }));
  const templates: Item[] = TEMPLATES.map((t) => ({ title: t.title, url: t.url, hint: "Template", icon: t.icon, keywords: words(t.blurb) }));
  const components: Item[] = componentDocs()
    .map((d) => {
      // The React names of a component and its parts find it too: <DialogPanel>, <CardBody>.
      const react = reactFamily(d);
      // What other systems call it: shadcn/ui's names count as synonyms (searching "Sheet" finds the drawer), the
      // APG pattern's name and the HTML element as keywords.
      const eq = d.meta.equivalents;
      const item: Item = { title: d.meta.name, url: d.url, hint: d.group.title, icon: d.group.icon, keywords: words(d.name, d.meta.element, d.meta.react, react.map((c) => c.name).join(" "), d.meta.css, d.meta.package, summary(d.source), headingsOf(d.source).join(" "), eq.apg.map((s) => APG[s]).join(" "), eq.html.join(" ")) };
      if (eq.shadcn.length) item.synonyms = words(eq.shadcn.join(" "));
      return item;
    })
    .sort((a, b) => a.title.localeCompare(b.title));
  const tokens: Item[] = manifest()
    .filter((t) => !t.name.startsWith("world-") && !t.name.startsWith("scene-") && !t.name.startsWith("deep-") && !t.name.startsWith("tone-"))
    .map((t) => {
      const url = t.type === "color" ? (t.scheme ? "/foundations/colour/#roles" : "/foundations/colour/#candy") : t.type === "duration" || t.name.startsWith("steps") || t.name.startsWith("delay") ? "/foundations/motion/#durations" : t.type === "fontFamily" || t.type === "fontWeight" || /^(size|leading|tracking|display)-/.test(t.name) ? "/foundations/type/#pixel-operator" : "/foundations/pixel/#space";
      return { title: t.cssVar, url, hint: "Token", keywords: words(t.name, t.description, t.type) };
    });
  const groups: Group[] = [
    { title: "Pages", items: pages },
    { title: "Foundations", items: foundations },
    { title: "Components", items: components },
    { title: "Templates", items: templates },
    { title: "Tokens", items: tokens },
  ];

  // Synonyms: on the page's own words, or on the section they point at.
  const byUrl = new Map(groups.flatMap((g) => g.items).filter((i) => !i.url.includes("#")).map((i) => [i.url, i]));
  const sectionWords: Record<string, string> = {};
  for (const [terms, to] of SYNONYMS) {
    for (const target of to) {
      const [url, id] = target.split("#") as [string, string?];
      const item = byUrl.get(url);
      if (!item) throw new Error(`docs: the search synonym "${terms}" points at ${target}, which is not a page in the index`);
      if (id) sectionWords[`${url}#${id}`] = words(sectionWords[`${url}#${id}`], terms);
      else item.synonyms = words(item.synonyms, terms);
    }
  }
  return { groups, sectionWords };
}

/** The index as groups, for the A to Z page. */
export const searchIndex = (): Group[] => searchData().groups;
