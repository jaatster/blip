/** The search index: every page, component and token, with words to match. Built with the site. */
import { componentDocs, headingsOf, manifest, summary } from "./data";
import { FOUNDATIONS, TEMPLATES } from "./nav";

export interface Item {
  title: string;
  url: string;
  hint: string;
  icon?: string;
  keywords: string;
}
export interface Group {
  title: string;
  items: Item[];
}

const words = (...parts: (string | undefined | null)[]) => parts.filter(Boolean).join(" ").toLowerCase().replace(/[^a-z0-9 \-:]+/g, " ").replace(/\s+/g, " ").trim();

export function searchIndex(): Group[] {
  const pages: Item[] = [
    { title: "Home", url: "/", hint: "Page", icon: "home", keywords: words("blip overview rules budgets kits sizes") },
    { title: "Get started", url: "/start/", hint: "Page", icon: "rocket", keywords: words("install npm pnpm cdn import map css order layers web components elements react frameworks vue svelte angular theming scheme pixel auto clock reduced motion diagnostics") },
    { title: "Theme builder", url: "/theme/", hint: "Page", icon: "brush", keywords: words("theme accent colour color custom hex export dtcg tokens css resolver contrast") },
    { title: "Diagnostics", url: "/diagnostics/", hint: "Page", icon: "bug", keywords: words("warnings errors codes pp-a001 pp-a010 pp-c001 pp-e001 pp-e010 pp-e020 pp-i001 pp-m001 pp-t001 console") },
    { title: "Templates", url: "/templates/", hint: "Page", icon: "desktop", keywords: words("examples screens dashboard landing game menu") },
    { title: "Components", url: "/components/", hint: "Page", icon: "puzzle", keywords: words("all components index") },
    { title: "Foundations", url: "/foundations/", hint: "Page", icon: "palette", keywords: words("basics foundations overview") },
  ];
  const foundations: Item[] = FOUNDATIONS.map((f) => ({ title: f.title, url: f.url, hint: "Foundation", icon: f.icon, keywords: words(f.blurb) }));
  const templates: Item[] = TEMPLATES.map((t) => ({ title: t.title, url: t.url, hint: "Template", icon: t.icon, keywords: words(t.blurb) }));
  const components: Item[] = componentDocs()
    .map((d) => ({ title: d.meta.name, url: d.url, hint: d.group.title, icon: d.group.icon, keywords: words(d.name, d.meta.element, d.meta.react, d.meta.css, d.meta.package, summary(d.source), headingsOf(d.source).join(" ")) }))
    .sort((a, b) => a.title.localeCompare(b.title));
  const tokens: Item[] = manifest()
    .filter((t) => !t.name.startsWith("world-") && !t.name.startsWith("scene-") && !t.name.startsWith("deep-") && !t.name.startsWith("tone-"))
    .map((t) => {
      const url = t.type === "color" ? (t.scheme ? "/foundations/colour/#roles" : "/foundations/colour/#candy") : t.type === "duration" || t.name.startsWith("steps") || t.name.startsWith("delay") ? "/foundations/motion/#durations" : t.type === "fontFamily" || t.type === "fontWeight" || /^(size|leading|tracking|display)-/.test(t.name) ? "/foundations/type/#pixelify" : "/foundations/pixel/#space";
      return { title: t.cssVar, url, hint: "Token", keywords: words(t.name, t.description, t.type) };
    });
  return [
    { title: "Pages", items: pages },
    { title: "Foundations", items: foundations },
    { title: "Components", items: components },
    { title: "Templates", items: templates },
    { title: "Tokens", items: tokens },
  ];
}
