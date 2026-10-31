/** /search.json: the index the search palette loads the first time it opens. */
import { searchIndex } from "../lib/search";
export const prerender = true;
export function GET() {
  return new Response(JSON.stringify({ groups: searchIndex() }), { headers: { "content-type": "application/json" } });
}
