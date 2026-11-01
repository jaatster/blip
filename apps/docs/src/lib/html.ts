/** Small HTML helpers for generated tables and text. */
export const esc = (s: unknown) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
export const code = (s: unknown) => `<code class="docs-inline-code">${esc(s)}</code>`;
export const stripTags = (s: string) => s.replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
export const kb = (bytes: number, digits = 1) => `${(bytes / 1024).toFixed(digits)} KB`;

/** The kits a fragment of markup needs, besides the components. */
export function kitsFor(html: string, pkg?: string): ("game" | "blocks" | "effects")[] {
  const kits = new Set<"game" | "blocks" | "effects">();
  if (pkg === "game" || pkg === "blocks" || pkg === "effects") kits.add(pkg);
  if (/pp-world|pp-drop-text|pp-typewriter|pp-crt|pp-glint|pp-transition|data-pp-transition|pp-burst|pp-attract/.test(html)) kits.add("effects");
  if (/pp-sprite|pp-stage|pp-hud|pp-choice|pp-dialogue|pp-prompt|pp-pause|pp-level|pp-inventory|pp-achievement|pp-hearts|pp-counter/.test(html)) kits.add("game");
  if (/pp-hero|pp-cta|pp-feature|pp-plan|pp-pricing|pp-footer/.test(html)) kits.add("blocks");
  return [...kits].sort((a, b) => ["game", "blocks", "effects"].indexOf(a) - ["game", "blocks", "effects"].indexOf(b));
}
