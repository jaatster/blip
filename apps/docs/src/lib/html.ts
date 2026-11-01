/** Small HTML helpers for generated tables and text. */
export const esc = (s: unknown) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
export const code = (s: unknown) => `<code class="docs-inline-code">${esc(s)}</code>`;
export const stripTags = (s: string) => s.replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
export const kb = (bytes: number, digits = 1) => `${(bytes / 1024).toFixed(digits)} KB`;

/** The kits a fragment of markup needs, besides the components. */
export function kitsFor(html: string, pkg?: string): ("game" | "blocks" | "effects")[] {
  const kits = new Set<"game" | "blocks" | "effects">();
  if (pkg === "game" || pkg === "blocks" || pkg === "effects") kits.add(pkg);
  if (/chu-world|chu-drop-text|chu-typewriter|chu-crt|chu-glint|chu-transition|data-chu-transition|chu-burst|chu-attract/.test(html)) kits.add("effects");
  if (/chu-sprite|chu-stage|chu-hud|chu-choice|chu-dialogue|chu-prompt|chu-pause|chu-level|chu-inventory|chu-achievement|chu-hearts|chu-counter/.test(html)) kits.add("game");
  if (/chu-hero|chu-cta|chu-feature|chu-plan|chu-pricing|chu-footer/.test(html)) kits.add("blocks");
  return [...kits].sort((a, b) => ["game", "blocks", "effects"].indexOf(a) - ["game", "blocks", "effects"].indexOf(b));
}
