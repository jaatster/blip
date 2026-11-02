/**
 * The Custom Elements Manifest, when a package has one: the element reference tables come from it, so the docs, the
 * React types and Storybook's controls all read the same contract.
 */
import { exists, json } from "./data";

interface CemType {
  text?: string;
}
interface CemMember {
  kind?: string;
  name: string;
  type?: CemType;
  default?: string;
  description?: string;
  summary?: string;
  privacy?: string;
  static?: boolean;
  readonly?: boolean;
  fieldName?: string;
  attribute?: string;
  parameters?: { name: string; type?: CemType; optional?: boolean }[];
  return?: { type?: CemType };
}
interface CemDeclaration {
  kind: string;
  name: string;
  tagName?: string;
  customElement?: boolean;
  description?: string;
  summary?: string;
  attributes?: CemMember[];
  members?: CemMember[];
  events?: CemMember[];
  cssProperties?: CemMember[];
  cssParts?: CemMember[];
  slots?: CemMember[];
}
interface Cem {
  modules?: { path: string; declarations?: CemDeclaration[] }[];
}

export interface ElementReference {
  tag: string;
  className: string;
  module: string;
  summary: string;
  attributes: { name: string; type: string; default: string; description: string }[];
  properties: { name: string; type: string; description: string; readonly: boolean }[];
  methods: { name: string; signature: string; description: string }[];
  events: { name: string; type: string; description: string }[];
  cssProperties: { name: string; default: string; description: string }[];
}

const cache = new Map<string, Cem | null>();
function manifestOf(pkg: string): Cem | null {
  if (!cache.has(pkg)) cache.set(pkg, exists(`packages/${pkg}/custom-elements.json`) ? json<Cem>(`packages/${pkg}/custom-elements.json`) : null);
  return cache.get(pkg)!;
}

const clean = (s?: string) => (s ?? "").replace(/\s+/g, " ").trim();

export function elementReference(tag: string): ElementReference | undefined {
  for (const pkg of ["elements", "game", "effects", "icons", "blocks", "components"]) {
    const cem = manifestOf(pkg);
    if (!cem) continue;
    for (const mod of cem.modules ?? []) {
      for (const d of mod.declarations ?? []) {
        if (!d.customElement || d.tagName !== tag) continue;
        const pub = (m: CemMember) => m.privacy !== "private" && m.privacy !== "protected" && !m.static && !m.name.startsWith("#") && !m.name.startsWith("_");
        const members = (d.members ?? []).filter(pub);
        return {
          tag,
          className: d.name,
          module: `@jaatster/blip-${pkg}/${mod.path.replace(/^src\//, "").replace(/\.(ts|js)$/, "")}`,
          summary: clean(d.summary || d.description),
          attributes: (d.attributes ?? []).map((a) => ({ name: a.name, type: clean(a.type?.text), default: clean(a.default), description: clean(a.description || a.summary) })),
          properties: members.filter((m) => m.kind === "field").map((m) => ({ name: m.name, type: clean(m.type?.text), description: clean(m.description || m.summary), readonly: !!m.readonly })),
          methods: members
            .filter((m) => m.kind === "method")
            .map((m) => ({ name: m.name, signature: `${m.name}(${(m.parameters ?? []).map((p) => `${p.name}${p.optional ? "?" : ""}${p.type?.text ? `: ${p.type.text}` : ""}`).join(", ")})${m.return?.type?.text && m.return.type.text !== "void" ? `: ${m.return.type.text}` : ""}`, description: clean(m.description || m.summary) })),
          events: (d.events ?? []).map((e) => ({ name: e.name, type: clean(e.type?.text), description: clean(e.description || e.summary) })),
          cssProperties: (d.cssProperties ?? []).map((c) => ({ name: c.name, default: clean(c.default), description: clean(c.description || c.summary) })),
        };
      }
    }
  }
  return undefined;
}

/**
 * Every element's boolean attributes (present or absent), from the manifests, and which of them say that "false"
 * is off: for the frameworks' notes.
 */
export function booleanAttributes(): { tag: string; names: string[]; falseIsOff: string[] }[] {
  const out: { tag: string; names: string[]; falseIsOff: string[] }[] = [];
  for (const pkg of ["elements", "game", "effects", "icons"]) {
    for (const mod of manifestOf(pkg)?.modules ?? []) {
      for (const d of mod.declarations ?? []) {
        if (!d.customElement || !d.tagName) continue;
        const attrs = (d.attributes ?? []).filter((a) => /\bboolean\b/.test(a.type?.text ?? "") && !a.name.startsWith("data-"));
        if (attrs.length) out.push({ tag: d.tagName, names: attrs.map((a) => a.name), falseIsOff: attrs.filter((a) => /"false" is off/i.test(clean(a.description || a.summary))).map((a) => a.name) });
      }
    }
  }
  return out.sort((a, b) => a.tag.localeCompare(b.tag));
}

/**
 * The event an element fires when one of its options is chosen (blip-command and blip-menu), read from its manifest so
 * the site's scripts listen for the name the element has today.
 */
export function chooseEvent(tag: string): string {
  for (const pkg of ["elements", "game", "effects"]) {
    for (const mod of manifestOf(pkg)?.modules ?? []) {
      for (const d of mod.declarations ?? []) {
        if (d.tagName !== tag) continue;
        const e = (d.events ?? []).find((x) => /\bchosen\b/i.test(clean(x.description || x.summary)));
        if (e) return e.name;
      }
    }
  }
  throw new Error(`docs: <${tag}> has no event for a chosen option in its manifest`);
}
