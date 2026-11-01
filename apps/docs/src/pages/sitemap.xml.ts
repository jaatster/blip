/**
 * /sitemap.xml: every page of the docs, as absolute addresses from the site's own (astro.config.mjs's site, with its
 * path: https://jaatster.com/blip/). The pages are the search index's (every page, foundation, component and
 * template), and the A to Z page; tokens are places on those pages, not pages.
 */
import type { APIContext } from "astro";
import { searchData } from "../lib/search";
export const prerender = true;
export function GET({ site }: APIContext) {
  const home = site!.href.replace(/\/?$/, "/");
  const paths = new Set(["/", "/search/"]);
  for (const g of searchData().groups) for (const i of g.items) if (!i.url.includes("#")) paths.add(i.url);
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const urls = [...paths].map((p) => `  <url><loc>${esc(new URL(p.slice(1), home).href)}</loc></url>`);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
  return new Response(xml, { headers: { "content-type": "application/xml" } });
}
