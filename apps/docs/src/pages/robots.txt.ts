/**
 * /robots.txt: everything may be read, and where the sitemap is (an absolute address from astro.config.mjs's site).
 * Crawlers read robots.txt at a host's root, so on jaatster.com, where the docs live under /blip/, the root's own
 * robots.txt should name this sitemap too.
 */
import type { APIContext } from "astro";
export const prerender = true;
export function GET({ site }: APIContext) {
  const sitemap = new URL("sitemap.xml", site!.href.replace(/\/?$/, "/")).href;
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemap}\n`, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
