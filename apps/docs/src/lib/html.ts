/** Small HTML helpers for generated tables and text. */
export const esc = (s: unknown) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
export const code = (s: unknown) => `<code class="docs-inline-code">${esc(s)}</code>`;
export const stripTags = (s: string) => s.replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
export const kb = (bytes: number, digits = 1) => `${(bytes / 1024).toFixed(digits)} KB`;

/** The kits a fragment of markup needs, besides the components. */
export function kitsFor(html: string, pkg?: string): ("game" | "blocks" | "effects")[] {
  const kits = new Set<"game" | "blocks" | "effects">();
  if (pkg === "game" || pkg === "blocks" || pkg === "effects") kits.add(pkg);
  if (/blip-world|blip-drop-text|blip-typewriter|blip-crt|blip-glint|blip-transition|data-blip-transition|blip-burst|blip-attract/.test(html)) kits.add("effects");
  if (/blip-sprite|blip-stage|blip-hud|blip-choice|blip-dialogue|blip-prompt|blip-pause|blip-level|blip-inventory|blip-achievement|blip-hearts|blip-counter/.test(html)) kits.add("game");
  if (/blip-hero|blip-cta|blip-feature|blip-plan|blip-pricing|blip-footer/.test(html)) kits.add("blocks");
  return [...kits].sort((a, b) => ["game", "blocks", "effects"].indexOf(a) - ["game", "blocks", "effects"].indexOf(b));
}
