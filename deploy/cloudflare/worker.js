// jaatster.com/blip: the docs, from the "blip" Cloudflare Pages project, under the owner's own domain. The route
// (wrangler.toml) sends only /blip* here; the rest of jaatster.com is its own Pages project, untouched. The path
// is passed on as it is: the docs are uploaded inside a blip/ folder (scripts/deploy-docs.mjs).
const ORIGIN = "https://blip.pages.dev";

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const response = await fetch(new Request(ORIGIN + url.pathname + url.search, request), { redirect: "manual" });
    // A redirect (/blip to /blip/) stays on jaatster.com.
    const location = response.headers.get("location");
    if (!location?.startsWith(ORIGIN)) return response;
    const headers = new Headers(response.headers);
    headers.set("location", location.slice(ORIGIN.length) || "/");
    return new Response(response.body, { status: response.status, headers });
  },
};
