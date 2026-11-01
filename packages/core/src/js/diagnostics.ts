/**
 * Diagnostics: warnings with a code and a docs link, for people and agents. On when
 * globalThis.BLIP_DIAGNOSTICS is true, or on localhost; production builds can turn them off by setting it false.
 *
 *   warn("CHU-A001", "An icon-only button needs aria-label.", el);
 */
const seen = new Set<string>();

function enabled(): boolean {
  const flag = (globalThis as { BLIP_DIAGNOSTICS?: boolean }).BLIP_DIAGNOSTICS;
  if (typeof flag === "boolean") return flag;
  return typeof location !== "undefined" && /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
}

export function warn(code: string, message: string, el?: Element): void {
  if (!enabled()) return;
  const key = `${code}:${message}`;
  if (seen.has(key)) return;
  seen.add(key);
  console.warn(`Blip ${code}: ${message}\n  https://jaatster.com/blip/diagnostics/#${code.toLowerCase()}`, el ?? "");
}

/** Common checks any element can run when it connects. */
export function checkName(el: Element, code = "CHU-A001"): void {
  const named = el.getAttribute("aria-label") || el.getAttribute("aria-labelledby") || el.textContent?.trim();
  if (!named) warn(code, `<${el.localName}> has no accessible name. Add text or aria-label.`, el);
}
