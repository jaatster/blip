/** /search.json: the index the search palette loads the first time it opens (sections are added after the build). */
import { searchData } from "../lib/search";
export const prerender = true;
export function GET() {
  return new Response(JSON.stringify(searchData()), { headers: { "content-type": "application/json" } });
}
