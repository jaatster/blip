/**
 * @jaatster/blip-react, read from its source when the site builds: what each entry exports, every component with its
 * JSDoc (summary, examples, what it renders) and its props resolved from its TypeScript types, and which component
 * page each one belongs to. The React section of a component page is made from this, so it shows the API that
 * exists, under the names it has today.
 */
import { componentDocs, exists, read, type Doc } from "./data";

const BASE = "packages/react/src";
const ENTRIES: Record<string, string> = { "@jaatster/blip-react": "index.ts", "@jaatster/blip-react/game": "game.ts", "@jaatster/blip-react/blocks": "blocks.ts", "@jaatster/blip-react/effects": "effects.ts", "@jaatster/blip-react/icons": "icons.tsx" };

// ------------------------------------------------------------------ scanning TypeScript text

/** The index just past the bracket that closes the one at `open` ({, ( or [), skipping strings and comments. */
function close(s: string, open: number): number {
  const pairs: Record<string, string> = { "{": "}", "(": ")", "[": "]" };
  const stack: string[] = [];
  for (let i = open; i < s.length; i++) {
    const c = s[i]!;
    if (c === '"' || c === "'" || c === "`") {
      for (i++; i < s.length && s[i] !== c; i++) if (s[i] === "\\") i++;
      continue;
    }
    if (c === "/" && s[i + 1] === "/") {
      i = s.indexOf("\n", i);
      if (i < 0) return s.length;
      continue;
    }
    if (c === "/" && s[i + 1] === "*") {
      i = s.indexOf("*/", i + 2) + 1;
      continue;
    }
    if (pairs[c]) stack.push(pairs[c]!);
    else if (c === stack.at(-1)) {
      stack.pop();
      if (!stack.length) return i + 1;
    }
  }
  return s.length;
}

/** Splits a type at the top level on `sep` ("&", "|", ";" or ","), outside brackets, generics, strings and comments. */
function split(s: string, sep: string): string[] {
  const out: string[] = [];
  let depth = 0, start = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i]!;
    if (c === '"' || c === "'" || c === "`") {
      for (i++; i < s.length && s[i] !== c; i++) if (s[i] === "\\") i++;
      continue;
    }
    if (c === "/" && s[i + 1] === "*") {
      i = s.indexOf("*/", i + 2) + 1;
      continue;
    }
    if (c === "/" && s[i + 1] === "/") {
      i = s.indexOf("\n", i);
      if (i < 0) break;
      continue;
    }
    if (c === "=" && s[i + 1] === ">") {
      i++;
      continue;
    }
    if ("{([<".includes(c)) depth++;
    else if ("})]>".includes(c)) depth--;
    else if (depth === 0 && c === sep) {
      out.push(s.slice(start, i));
      start = i + 1;
    }
  }
  out.push(s.slice(start));
  return out.map((x) => x.trim()).filter(Boolean);
}

/** `Name<Args>` -> ["Name", ["Arg", …]]; anything else -> null. */
function generic(t: string): [string, string[]] | null {
  const m = t.match(/^([A-Za-z_$][\w$]*)\s*(?:<([\s\S]*)>)?$/);
  if (!m) return null;
  return [m[1]!, m[2] === undefined ? [] : split(m[2], ",")];
}

const unwrap = (t: string): string => {
  t = t.trim();
  while (t.startsWith("(") && close(t, 0) === t.length) t = t.slice(1, -1).trim();
  return t;
};

/** JSDoc text without its stars, line by line. */
function docLines(doc: string): string[] {
  return doc
    .replace(/^\/\*\*\s?/, "")
    .replace(/\s*\*\/$/, "")
    .split("\n")
    .map((l) => l.replace(/^\s*\* ?/, "").replace(/\s+$/, ""));
}

// ------------------------------------------------------------------ declarations

interface Decl {
  kind: "interface" | "type" | "const" | "function";
  name: string;
  file: string;
  exported: boolean;
  doc: string | null;
  /** Type parameters as written, without the brackets: `T extends ElementType = "div"`. */
  params: string;
  /** interface: the body; type: the right-hand side; const and function: the statement. */
  text: string;
  extends: string[];
}

// A declaration at the start of a line, with the JSDoc right above it (line comments may come between).
const DECL = /^(\/\*\*(?:(?!\*\/)[\s\S])*\*\/\n)?(?:\/\/[^\n]*\n)*(export\s+)?(?:declare\s+)?(interface|type|const|async\s+function|function)\s+([A-Za-z_$][\w$]*)/gm;

function declarations(file: string): Decl[] {
  const s = read(`${BASE}/${file}`);
  const out: Decl[] = [];
  for (const m of s.matchAll(DECL)) {
    const kind = m[3]!.replace(/^async\s+/, "") as Decl["kind"];
    const name = m[4]!;
    let at = m.index! + m[0].length;
    let params = "";
    if (s[at] === "<" && (kind === "interface" || kind === "type")) {
      const end = matchAngle(s, at);
      params = s.slice(at + 1, end - 1);
      at = end;
    }
    let text = "";
    const ext: string[] = [];
    if (kind === "interface") {
      const open = s.indexOf("{", at);
      const head = s.slice(at, open);
      const e = head.match(/extends\s+([\s\S]+)/);
      if (e) ext.push(...split(e[1]!, ","));
      text = s.slice(open + 1, close(s, open) - 1);
    } else if (kind === "type") {
      const eq = s.indexOf("=", at);
      let i = eq + 1, depth = 0;
      for (; i < s.length; i++) {
        const c = s[i]!;
        if (c === '"' || c === "'" || c === "`") {
          for (i++; i < s.length && s[i] !== c; i++) if (s[i] === "\\") i++;
          continue;
        }
        // Comments (a JSDoc's "button's" is not a string).
        if (c === "/" && s[i + 1] === "*") {
          i = s.indexOf("*/", i + 2) + 1;
          continue;
        }
        if (c === "/" && s[i + 1] === "/") {
          i = s.indexOf("\n", i);
          continue;
        }
        if ("{([".includes(c)) depth++;
        else if ("})]".includes(c)) depth--;
        else if (c === ";" && depth === 0) break;
      }
      text = s.slice(eq + 1, i).trim();
    } else if (kind === "function") {
      // Its signature is enough.
      text = s.slice(m.index! + (m[1]?.length ?? 0), s.indexOf("{", at) + 1);
    } else {
      // A component's statement runs to the line that closes it: `});` or `}) as Type;`.
      const end = s.slice(at).search(/^\}\)(?: as [^;\n]+)?;\s*$|^\}\);?$/m);
      const line = end < 0 ? s.indexOf("\n", at) : at + end;
      text = s.slice(m.index! + (m[1]?.length ?? 0), s.indexOf("\n", line) < 0 ? s.length : s.indexOf("\n", line));
    }
    out.push({ kind, name, file, exported: !!m[2], doc: m[1]?.trim() ?? null, params, text, extends: ext });
  }
  return out;
}

/** The index just past the ">" that closes the "<" at `open`. */
function matchAngle(s: string, open: number): number {
  let depth = 0;
  for (let i = open; i < s.length; i++) {
    if (s[i] === "=" && s[i + 1] === ">") {
      i++;
      continue;
    }
    if (s[i] === "<") depth++;
    else if (s[i] === ">" && --depth === 0) return i + 1;
  }
  return s.length;
}

// ------------------------------------------------------------------ the package's files and exports

let filesCache: Map<string, Decl[]> | undefined;
/** Every source file reachable from the entries, with its declarations. */
function files(): Map<string, Decl[]> {
  if (filesCache) return filesCache;
  filesCache = new Map();
  const visit = (file: string) => {
    if (filesCache!.has(file) || !exists(`${BASE}/${file}`)) return;
    filesCache!.set(file, declarations(file));
    const dir = file.includes("/") ? file.slice(0, file.lastIndexOf("/") + 1) : "";
    for (const m of read(`${BASE}/${file}`).matchAll(/from\s+"(\.{1,2}\/[^"]+)"/g)) {
      const rel = normalise(dir + m[1]!).replace(/\.js$/, "");
      const target = [".ts", ".tsx"].map((e) => rel + e).find((f) => exists(`${BASE}/${f}`));
      if (target) visit(target);
    }
  };
  for (const file of Object.values(ENTRIES)) visit(file);
  return filesCache;
}
const normalise = (p: string) => {
  const out: string[] = [];
  for (const part of p.split("/")) {
    if (part === "..") out.pop();
    else if (part !== ".") out.push(part);
  }
  return out.join("/");
};

/** The names each entry exports (components, functions and types), read from its source. */
function namesIn(file: string, seen = new Set<string>()): Set<string> {
  const out = new Set<string>();
  if (seen.has(file) || !exists(`${BASE}/${file}`)) return out;
  seen.add(file);
  const src = read(`${BASE}/${file}`);
  const dir = file.includes("/") ? file.slice(0, file.lastIndexOf("/") + 1) : "";
  // Values and types: a type is imported with `type` (importsFor knows which is which by how it is used).
  for (const m of src.matchAll(/^export\s+(?:declare\s+)?(?:const|function|async\s+function|class|interface|type)\s+([A-Za-z_$][\w$]*)/gm)) out.add(m[1]!);
  for (const m of src.matchAll(/export\s+(?:type\s+)?\{([^}]*)\}/g)) {
    for (const part of m[1]!.split(",")) {
      const p = part.trim().replace(/^type\s+/, "");
      if (p) out.add(p.split(/\s+as\s+/).pop()!.trim());
    }
  }
  for (const m of src.matchAll(/export\s*\*\s*from\s*"\.\/([^"]+)"/g)) {
    const rel = normalise(dir + m[1]!).replace(/\.js$/, "");
    const f = [".ts", ".tsx"].map((e) => rel + e).find((x) => exists(`${BASE}/${x}`));
    if (f) for (const n of namesIn(f, seen)) out.add(n);
  }
  return out;
}

let exportsCache: Map<string, Set<string>> | undefined;
export function reactExports(): Map<string, Set<string>> {
  exportsCache ??= new Map(Object.entries(ENTRIES).map(([entry, file]) => [entry, namesIn(file)]));
  return exportsCache;
}
/** The entry that exports a name, preferring the given one. */
export function reactEntryFor(name: string, preferred?: string): string | undefined {
  const all = reactExports();
  if (preferred && all.get(preferred)?.has(name)) return preferred;
  for (const [entry, names] of all) if (names.has(name)) return entry;
  return undefined;
}

// ------------------------------------------------------------------ resolving props

export interface ReactProp {
  name: string;
  type: string;
  optional: boolean;
  description: string;
  default?: string;
  /** An HTML attribute a type only asks for (an icon-only button's aria-label): said in a note, not a row. */
  drop?: boolean;
}
/** HTML and ARIA attributes every element takes: a type that asks for one says why in a note instead. */
const ATTRIBUTE = /^(aria-[a-z]+|role|children|hidden|id|title|href|type|tabIndex)$/;
interface Resolved {
  props: ReactProp[];
  /** The native element whose own props pass through ("button"), "*" for an element's HTML attributes. */
  native: string | null;
  /** Notes from the types that ask for more than a prop can say (an icon-only button needs a name). */
  notes: string[];
}

/** Type aliases worth showing by name with their values listed once, under the table, rather than inline. */
export const NAMED_TYPES = new Set(["Tone", "Candy", "Radius", "Space", "ButtonCommand", "IconName"]);

function lookup(name: string, file: string): Decl | undefined {
  const all = files();
  const local = all.get(file)?.find((d) => d.name === name && d.kind !== "const" && d.kind !== "function");
  if (local) return local;
  for (const list of all.values()) {
    const d = list.find((x) => x.name === name && x.exported && x.kind !== "const" && x.kind !== "function");
    if (d) return d;
  }
  return undefined;
}

/** A JSDoc's prose: lines joined, tags and examples left out, {@link X} as `X`. */
function prose(doc: string | null): string {
  if (!doc) return "";
  const lines = docLines(doc);
  const out: string[] = [];
  for (const l of lines) {
    if (/^@/.test(l)) break;
    if (/^ {2,}\S/.test(l)) continue;
    out.push(l.trim());
  }
  return out.join(" ").replace(/\s+/g, " ").replace(/\{@link\s+([^}\s]+)\s*\}/g, "`$1`").trim();
}
const tag = (doc: string | null, name: string): string | undefined => {
  const m = doc?.match(new RegExp(`@${name}\\s+([^\\n]*?)\\s*(?:\\n|\\*\\/)`));
  return m?.[1]?.trim();
};

/** The members of an object type's body. */
function members(body: string): ReactProp[] {
  const out: ReactProp[] = [];
  for (const chunk of split(body, ";")) {
    const docs = [...chunk.matchAll(/\/\*\*[\s\S]*?\*\//g)].map((m) => m[0]);
    const code = chunk.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "").trim();
    const m = code.match(/^(?:readonly\s+)?("[^"]+"|'[^']+'|[A-Za-z_$][\w$]*)(\?)?\s*:\s*([\s\S]+)$/);
    if (!m) continue;
    const doc = docs.at(-1) ?? null;
    out.push({ name: m[1]!.replace(/^["']|["']$/g, ""), optional: !!m[2], type: m[3]!.replace(/\s+/g, " ").trim(), description: prose(doc), default: tag(doc, "default") });
  }
  return out;
}

function merge(into: ReactProp[], more: ReactProp[]): ReactProp[] {
  for (const p of more) {
    const had = into.find((x) => x.name === p.name);
    if (!had) into.push({ ...p });
    else {
      if (!had.description && p.description) (had.description = p.description), (had.drop = p.drop);
      had.default ??= p.default;
    }
  }
  return into;
}

/** A type's props: object types, interfaces, aliases, intersections, unions, Omit, Partial and the package's own helpers. */
function resolve(type: string, file: string, depth = 0): Resolved {
  const r: Resolved = { props: [], native: null, notes: [] };
  if (depth > 12) return r;
  const t = unwrap(type);
  const union = split(t, "|");
  if (union.length > 1) {
    const branches = union.map((b) => resolve(b, file, depth + 1));
    const names = [...new Set(branches.flatMap((b) => b.props.map((p) => p.name)))];
    for (const name of names) {
      const found = branches.map((b) => b.props.find((p) => p.name === name));
      const types = [...new Set(found.filter(Boolean).flatMap((p) => split(p!.type, "|")))];
      const boolean = types.includes("true") && types.includes("false");
      const first = found.find((p) => p?.description) ?? found.find(Boolean)!;
      r.props.push({ ...first!, optional: found.some((p) => !p || p.optional), type: (boolean ? ["boolean", ...types.filter((x) => x !== "true" && x !== "false")] : types).join(" | ") });
    }
    for (const b of branches) r.notes.push(...b.notes);
    r.native = branches.find((b) => b.native)?.native ?? null;
    return r;
  }
  const parts = split(t, "&");
  if (parts.length > 1) {
    for (const p of parts) {
      const x = resolve(p, file, depth + 1);
      merge(r.props, x.props);
      r.native ??= x.native;
      r.notes.push(...x.notes);
    }
    return r;
  }
  if (t.startsWith("{")) {
    r.props = members(t.slice(1, close(t, 0) - 1));
    return r;
  }
  const g = generic(t);
  if (!g) return r;
  const [name, args] = g;
  if (name === "NativeProps") {
    r.native = args[0]!.replace(/^["']|["']$/g, "");
    return r;
  }
  if (name === "ElementProps") {
    r.native = "*";
    return r;
  }
  if (name === "SVGProps" || name === "ComponentPropsWithoutRef" || name === "ComponentProps") {
    r.native = /SVG/.test(args[0] ?? "") ? "svg" : (args[0] ?? "").replace(/^["']|["']$/g, "");
    return r;
  }
  if (name === "Omit" || name === "Pick") {
    const inner = resolve(args[0]!, file, depth + 1);
    const keys = new Set([...(args[1] ?? "").matchAll(/["']([^"']+)["']/g)].map((m) => m[1]!));
    inner.props = inner.props.filter((p) => (name === "Omit" ? !keys.has(p.name) : keys.has(p.name)));
    return inner;
  }
  if (name === "Partial") {
    const inner = resolve(args[0]!, file, depth + 1);
    for (const p of inner.props) p.optional = true;
    return inner;
  }
  if (name === "PolymorphicProps") {
    const inner = resolve(args[1] ?? "object", file, depth + 1);
    inner.native = "as";
    return inner;
  }
  const d = lookup(name, file);
  if (!d) return r;
  if (d.kind === "interface") {
    for (const e of d.extends) {
      const x = resolve(e, d.file, depth + 1);
      merge(r.props, x.props);
      r.native ??= x.native;
      r.notes.push(...x.notes);
    }
    // Own members first: they are the component's.
    r.props = merge(members(d.text), r.props);
    return r;
  }
  if (d.kind === "type") {
    const x = resolve(d.text, d.file, depth + 1);
    // A union that asks for something (a name, a description) says why in its JSDoc: that describes its own props
    // (iconOnly), and the attributes it asks for (aria-label) go in a note.
    const branches = split(unwrap(d.text), "|");
    if (branches.length > 1) {
      let why = prose(d.doc);
      if (!why) {
        const required = branches.map((b) => resolve(b, d.file, depth + 1).props.filter((p) => !p.optional).map((p) => p.name));
        if (required.every((list) => list.length === 1)) why = `Needs ${required.map((l) => `\`${l[0]}\``).join(" or ")}.`;
      }
      let used = false;
      for (const p of x.props) {
        if (p.description) continue;
        if (ATTRIBUTE.test(p.name)) p.drop = true;
        else if (why) (p.description = why), (used = true);
      }
      if (why && !used) x.notes.unshift(why);
    }
    return x;
  }
  return r;
}

/** A prop's type for a reader: aliases of literal unions written out, long ones kept by name (NAMED_TYPES). */
function display(type: string, file: string, depth = 0): string {
  if (depth > 6) return type;
  const parts = split(unwrap(type), "|");
  const out = parts.map((p) => {
    const g = generic(p);
    if (!g || g[1].length || NAMED_TYPES.has(g[0])) return p;
    const d = lookup(g[0], file);
    if (!d || d.kind !== "type") return p;
    const expanded = display(d.text, d.file, depth + 1);
    return split(expanded, "|").every((x) => /^(["'`].*["'`]|\d+|true|false|null|undefined)$/.test(x)) ? expanded : p;
  });
  return [...new Set(out.flatMap((o) => split(o, "|")))].join(" | ");
}

/** The values of a named type, for the note under a table: `Tone`: "accent", "info", … */
export function namedType(name: string): string | undefined {
  if (name === "IconName") return "any icon's name (see Icons)";
  const d = lookup(name, "internal/props.ts");
  if (!d || d.kind !== "type") return undefined;
  return display(d.text, d.file, 0)
    .split(" | ")
    .flatMap((x) => (NAMED_TYPES.has(x) ? split(display(lookup(x, d.file)?.text ?? x, d.file), "|") : [x]))
    .join(", ");
}

// ------------------------------------------------------------------ components

export interface ReactComponent {
  name: string;
  entry: string;
  file: string;
  /** The first sentence of its JSDoc. */
  summary: string;
  /** Its JSDoc's prose, without examples or the "Renders" sentence. */
  description: string;
  /** The code examples in its JSDoc. */
  examples: string[];
  /** What it renders, as its JSDoc says: `<button class="blip-box blip-button">`. */
  renders: string | null;
  /** The custom element it wraps, for an element's wrapper. */
  tag: string | null;
  props: ReactProp[];
  /** Where other props go: a native element's name, "as" (polymorphic), "*" (an element's HTML attributes). */
  native: string | null;
  /** The element it renders by default when it takes `as`. */
  as: string | null;
  notes: string[];
}

function examplesOf(doc: string | null): string[] {
  if (!doc) return [];
  const blocks: string[][] = [];
  let current: string[] | null = null;
  for (const l of docLines(doc)) {
    if (/^@/.test(l)) break;
    if (/^ {2,}\S/.test(l)) {
      current ??= [];
      current.push(l);
    } else if (l.trim() === "" && current) {
      current.push("");
    } else {
      if (current) blocks.push(current);
      current = null;
    }
  }
  if (current) blocks.push(current);
  return blocks.map((b) => {
    const lines = b.join("\n").replace(/\n+$/, "").split("\n");
    const indent = Math.min(...lines.filter((x) => x.trim()).map((x) => x.match(/^ */)![0].length));
    return lines.map((x) => x.slice(indent)).join("\n");
  });
}

/** Default values written in the component's parameters: `{ type = "button", as: Tag = "article" }`. */
function defaults(statement: string): Record<string, string> {
  const fn = statement.search(/function\s+[A-Za-z_$][\w$]*\s*\(/);
  if (fn < 0) return {};
  const open = statement.indexOf("{", statement.indexOf("(", fn));
  const paren = statement.indexOf("(", fn);
  if (open < 0 || statement.slice(paren + 1, open).trim()) return {};
  const body = statement.slice(open + 1, close(statement, open) - 1);
  const out: Record<string, string> = {};
  for (const part of split(body, ",")) {
    const m = part.match(/^([A-Za-z_$][\w$]*)\s*(?::\s*[A-Za-z_$][\w$]*)?\s*=\s*([\s\S]+)$/);
    if (m) out[m[1]!] = m[2]!.trim();
  }
  return out;
}

let componentsCache: ReactComponent[] | undefined;
/** Every component @jaatster/blip-react exports, in source order, with its props. */
export function reactComponents(): ReactComponent[] {
  if (componentsCache) return componentsCache;
  const out: ReactComponent[] = [];
  const exported = reactExports();
  for (const [file, list] of files()) {
    for (const d of list) {
      if (d.kind !== "const" || !d.exported || !/^[A-Z]/.test(d.name)) continue;
      const entry = [...exported].find(([, names]) => names.has(d.name))?.[0];
      if (!entry) continue;
      // Comments out: /*#__PURE__*/ before forwardRef is for bundlers.
      const head = d.text.slice(d.text.indexOf("=") + 1).replace(/\/\*[\s\S]*?\*\//g, "").trim();
      let propsType: string | null = null;
      let as: string | null = null;
      let tagName: string | null = null;
      const cast = d.text.match(/\}\) as PolymorphicComponent<\s*["']([^"']+)["']\s*,\s*([\s\S]+?)>;\s*$/);
      const fr = head.match(/^forwardRef<([\s\S]+?)>\(\s*function/);
      const cc = head.match(/^createComponent<([\s\S]+?)>\(\{/);
      if (cast) {
        as = cast[1]!;
        propsType = cast[2]!.trim() === "object" ? "{}" : cast[2]!.trim();
      } else if (fr) {
        propsType = split(fr[1]!, ",")[1] ?? null;
      } else if (cc) {
        propsType = split(cc[1]!, ",")[1] ?? null;
        tagName = d.text.match(/tag:\s*"(blip-[a-z0-9-]+)"/)?.[1] ?? null;
      } else continue;
      const res = propsType ? resolve(propsType, file) : { props: [], native: null, notes: [] };
      const defs = defaults(d.text);
      const props = res.props.filter((p) => !p.drop && !(p.name === "children" && !p.description)).map((p) => ({ ...p, type: display(p.type, file), default: p.default ?? defs[p.name] }));
      if (as) props.unshift({ name: "as", type: "ElementType", optional: true, description: `The element to render instead of \`<${as}>\`; the props and the ref follow it.`, default: `"${as}"` });
      const text = prose(d.doc);
      const renders = d.doc?.replace(/\n\s*\*\s*/g, " ").match(/Renders\s+`([^`]+)`/)?.[1] ?? null;
      const description = text.replace(/\s*Renders\s+`[^`]+`[^.]*\.?/, "").trim();
      out.push({
        name: d.name,
        entry,
        file: `${BASE}/${file}`,
        summary: description.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? description,
        description,
        examples: examplesOf(d.doc),
        renders,
        tag: tagName ?? renders?.match(/^<(blip-[a-z0-9-]+)/)?.[1] ?? null,
        props,
        native: as ? "as" : res.native,
        as,
        notes: [...new Set(res.notes)],
      });
    }
  }
  componentsCache = out;
  return out;
}

export interface ReactFunction {
  name: string;
  entry: string;
  signature: string;
  description: string;
  examples: string[];
}
/** Exported functions (toast()). */
export function reactFunctions(): ReactFunction[] {
  const exported = reactExports();
  const out: ReactFunction[] = [];
  for (const list of files().values()) {
    for (const d of list) {
      if (d.kind !== "function" || !d.exported) continue;
      const entry = [...exported].find(([, names]) => names.has(d.name))?.[0];
      if (!entry) continue;
      const sig = d.text.match(/function\s+([\s\S]*?)\s*\{/)?.[1]?.replace(/\s+/g, " ") ?? d.name;
      out.push({ name: d.name, entry, signature: sig, description: prose(d.doc), examples: examplesOf(d.doc) });
    }
  }
  // A function's file comment often holds its examples (toast.ts).
  for (const f of out) {
    if (f.examples.length) continue;
    const file = [...files()].find(([, list]) => list.some((d) => d.name === f.name))?.[0];
    const head = file ? read(`${BASE}/${file}`).match(/^\/\*\*[\s\S]*?\*\//)?.[0] : undefined;
    if (head && new RegExp(`\\b${f.name}\\(`).test(head)) f.examples = examplesOf(head).filter((e) => e.includes(`${f.name}(`));
  }
  return out;
}

// ------------------------------------------------------------------ which page each belongs to

const UTILITY = new Set(["blip-box", "blip-display", "blip-pop", "blip-pop-in", "blip-sr-only", "blip-icon", "blip-label", "blip-outline"]);
const cssBase = (d: Doc) => (d.meta.css && /^[a-z0-9-]+\.css$/.test(d.meta.css) ? d.meta.css.replace(/\.css$/, "") : null);
const lcp = (a: string, b: string) => {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i;
};

let pagesCache: Map<string, ReactComponent[]> | undefined;
/** Component page slug -> its React components, the page's own first, then its parts in source order. */
function byPage(): Map<string, ReactComponent[]> {
  if (pagesCache) return pagesCache;
  const pages = componentDocs();
  const all = reactComponents();
  const css = new Map<string, string>();
  const cssText = (d: Doc) => {
    if (!d.meta.css || !cssBase(d)) return "";
    if (!css.has(d.slug)) css.set(d.slug, exists(`packages/${d.pkg}/src/${d.meta.css}`) ? read(`packages/${d.pkg}/src/${d.meta.css}`) : "");
    return css.get(d.slug)!;
  };
  const owner = new Map<string, Doc>();
  let previous: { file: string; page: Doc | undefined } | undefined;
  for (const c of all) {
    let page: Doc | undefined = pages.find((d) => d.meta.react === c.name);
    if (!page && c.tag) page = pages.find((d) => (d.meta.element ?? "").split(",").map((s) => s.trim()).includes(c.tag!));
    const classes = (c.renders?.match(/class="([^"]*)"/)?.[1] ?? "").split(/\s+/).filter((x) => x.startsWith("blip-") && !UTILITY.has(x));
    if (!page && classes.length) {
      // A part's own class (blip-alert-close) says more than a class it shares (blip-button); the longest base wins.
      let best: { doc: Doc; part: boolean; len: number } | undefined;
      for (const cls of classes) {
        for (const d of pages) {
          const b = cssBase(d);
          if (!b || !(cls === `blip-${b}` || cls.startsWith(`blip-${b}-`))) continue;
          const part = cls !== `blip-${b}`;
          const better = !best || (part && !best.part) || (part === best.part && b.length > best.len) || (part === best.part && b.length === best.len && d.meta.react && lcp(c.name, d.meta.react) > lcp(c.name, best.doc.meta.react ?? ""));
          if (better) best = { doc: d, part, len: b.length };
        }
      }
      page = best?.doc;
      // Else: the page whose stylesheet styles the class.
      page ??= pages.find((d) => classes.some((cls) => new RegExp(`\\.${cls}(?![\\w-])`).test(cssText(d))));
    }
    // Else: the page with the most of its name (Segment: Segmented), or the one before it in the same file.
    if (!page) {
      const named = pages.filter((d) => d.meta.react).map((d) => ({ d, n: lcp(c.name, d.meta.react!) })).sort((a, b) => b.n - a.n)[0];
      page = named && named.n >= 4 ? named.d : previous?.file === c.file ? previous.page : undefined;
    }
    if (page) owner.set(c.name, page);
    previous = { file: c.file, page };
  }
  pagesCache = new Map();
  for (const d of pages) {
    const family = all.filter((c) => owner.get(c.name)?.slug === d.slug);
    const main = family.find((c) => c.name === d.meta.react) ?? family.find((c) => c.tag && (d.meta.element ?? "").includes(c.tag)) ?? family[0];
    if (main) pagesCache.set(d.slug, [main, ...family.filter((c) => c !== main)]);
  }
  return pagesCache;
}

/** A component page's React components: its own first, then its parts. Empty when it has none. */
export const reactFamily = (doc: Doc): ReactComponent[] => (doc.foundation ? [] : byPage().get(doc.slug) ?? []);

/** Functions that belong with a page's components (toast() with the toaster). */
export function reactFunctionsFor(doc: Doc): ReactFunction[] {
  const family = reactFamily(doc).map((c) => c.name.toLowerCase());
  return reactFunctions().filter((f) => family.some((n) => n.startsWith(f.name.toLowerCase()) && f.name.length >= 4));
}


// ------------------------------------------------------------------ examples

const USAGE = "packages/react/examples/usage.tsx";

/** The end of a JSX tag that opens at `at` (just after its name): the index after its ">". */
function tagEnd(s: string, at: number): number {
  for (let i = at; i < s.length; i++) {
    const c = s[i]!;
    if (c === '"' || c === "'") {
      i = s.indexOf(c, i + 1);
      continue;
    }
    if (c === "{") {
      i = close(s, i) - 1;
      continue;
    }
    if (c === ">") return i + 1;
  }
  return s.length;
}

/** The whole JSX element `<name …>…</name>` (or `<name … />`) that starts at `start`. */
function jsxElement(s: string, start: number, name: string): string | null {
  const first = tagEnd(s, start + 1 + name.length);
  if (s[first - 2] === "/") return s.slice(start, first);
  const re = new RegExp(`<(/?)${name}(?=[\\s>/])`, "g");
  re.lastIndex = first;
  let depth = 1;
  for (let m; (m = re.exec(s)); ) {
    if (m[1]) {
      if (--depth === 0) return s.slice(start, s.indexOf(">", m.index) + 1);
    } else {
      const end = tagEnd(s, m.index + 1 + name.length);
      if (s[end - 2] !== "/") depth++;
      re.lastIndex = end;
    }
  }
  return null;
}

/** Imports for the names a piece of code uses, from the entries that export them. */
export function importsFor(code: string, preferred?: string): string {
  const used = new Set([...code.matchAll(/<([A-Z][\w]*)[\s>/]/g)].map((m) => m[1]!));
  for (const m of code.matchAll(/\b([a-z][A-Za-z]*)\(/g)) if (reactEntryFor(m[1]!)) used.add(m[1]!);
  // Types named in annotations (const tone: Tone = …) come in as types.
  const types = new Set([...code.matchAll(/:\s*([A-Z][\w]*)\b/g)].map((m) => m[1]!).filter((t) => reactEntryFor(t, preferred) && !used.has(t)));
  const byEntry = new Map<string, string[]>();
  for (const n of [...used, ...types].sort()) {
    const e = reactEntryFor(n, preferred);
    if (e) byEntry.set(e, [...(byEntry.get(e) ?? []), types.has(n) ? `type ${n}` : n]);
  }
  const hooks = ["useRef", "useState"].filter((h) => new RegExp(`\\b${h}\\b`).test(code));
  const lines = hooks.length ? [`import { ${hooks.join(", ")} } from "react";`] : [];
  for (const [entry, names] of [...byEntry].sort(([a], [b]) => a.localeCompare(b))) lines.push(`import { ${names.join(", ")} } from "${entry}";`);
  return lines.join("\n");
}

export interface ReactExample {
  code: string;
  /** From the package's examples/usage.tsx, which is type-checked against React 18 and 19. */
  checked: boolean;
}

/** The names a `const` declares: `const [view, setView] = …` -> view, setView. */
const declared = (line: string): string[] => {
  const m = line.match(/^const\s+(\[[^\]]*\]|\{[^}]*\}|[A-Za-z_$][\w$]*)/);
  return m ? [...m[1]!.matchAll(/[A-Za-z_$][\w$]*/g)].map((x) => x[0]) : [];
};
/** Does code read this name (not as an object key or a property)? */
const reads = (code: string, name: string) => new RegExp(`(?<![.\\w$])${name}\\b(?!\\s*:)`).test(code);

/** The component as the React package's type-checked examples use it, in a component of its own with its state. */
function checkedExample(main: ReactComponent): ReactExample | null {
  if (!exists(USAGE)) return null;
  const src = read(USAGE).split(/^\/\/ The types refuse/m)[0]!;
  const at = src.search(new RegExp(`<${main.name}(?=[\\s>/])`));
  const element = at >= 0 ? jsxElement(src, at, main.name) : null;
  if (!element) return null;
  const lineStart = src.lastIndexOf("\n", at) + 1;
  const indent = at - lineStart;
  const body = element.split("\n").map((l, i) => (i === 0 ? l : l.slice(Math.min(indent, l.match(/^ */)![0].length)))).join("\n");
  // The declarations it reads, from the function it sits in: const [view, setView] = useState("grid").
  const fn = src.slice(0, at).lastIndexOf("export function ");
  const decls = src.slice(fn, at).split("\n").map((l) => l.trim()).filter((l) => l.startsWith("const ") && declared(l).some((n) => reads(body, n)));
  const inner = body.split("\n").map((l) => `    ${l}`).join("\n");
  const code = `${importsFor(`${decls.join("\n")}\n${body}`, main.entry)}\n\nexport function Example() {\n${decls.map((d) => `  ${d}\n`).join("")}  return (\n${inner}\n  );\n}`;
  return { code, checked: true };
}

/** A JSDoc example, with its imports; notes after a line of code become JSX comments. */
function docExample(example: string, entry: string): ReactExample {
  const code = example.replace(/^([ \t]*<.*>)[ \t]{3,}([^<{\s][^\n]*)$/gm, "$1 {/* $2 */}");
  return { code: `${importsFor(code.replace(/\{\/\*[\s\S]*?\*\/\}/g, ""), entry)}\n\n${code}`, checked: false };
}

/**
 * The examples for a page's React section: the component as the React package's own type-checked examples use it
 * (when they do), then its JSDoc example, or the first of its parts' examples that uses it.
 */
export function reactExamples(family: ReactComponent[]): ReactExample[] {
  const main = family[0];
  if (!main) return [];
  const out: ReactExample[] = [];
  const checked = checkedExample(main);
  if (checked) out.push(checked);
  const own = main.examples[0];
  const theirs = family.slice(1).flatMap((c) => c.examples).find((e) => new RegExp(`<${main.name}(?=[\\s>/])`).test(e));
  const example = own ?? theirs ?? (out.length ? undefined : family.flatMap((c) => c.examples)[0]);
  if (example) out.push(docExample(example, main.entry));
  return out;
}

// ------------------------------------------------------------------ from the page's HTML, when nothing else says

const VOID_TAGS = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"]);
const JSX_NAMES: Record<string, string> = { class: "className", for: "htmlFor", tabindex: "tabIndex", readonly: "readOnly", maxlength: "maxLength", minlength: "minLength", autocomplete: "autoComplete", autofocus: "autoFocus", inputmode: "inputMode", enterkeyhint: "enterKeyHint", spellcheck: "spellCheck", colspan: "colSpan", rowspan: "rowSpan", novalidate: "noValidate", popovertarget: "popoverTarget", popovertargetaction: "popoverTargetAction", crossorigin: "crossOrigin", srcset: "srcSet", datetime: "dateTime", accesskey: "accessKey", contenteditable: "contentEditable" };

/** HTML as JSX: class and for renamed, void elements closed, comments out; a field's value is its default. */
function jsx(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<([a-z][a-z0-9-]*)((?:\s+[^\s=>/]+(?:="[^"]*")?)*)\s*(\/?)>/g, (_, tag: string, attrs: string, slash: string) => {
      const field = tag === "input" || tag === "textarea" || tag === "select";
      const a = attrs.replace(/\s([^\s=>/]+)(="[^"]*")?/g, (_m: string, name: string, value = "") => {
        if (field && (name === "value" || name === "checked")) return ` default${name[0]!.toUpperCase()}${name.slice(1)}${value}`;
        return ` ${JSX_NAMES[name] ?? name}${value}`;
      });
      return `<${tag}${a}${slash || VOID_TAGS.has(tag) ? " /" : ""}>`;
    });
}

/**
 * The first use of an element in a page's HTML example, written with its React wrapper: for the wrappers whose
 * source has no example of its own.
 */
export function htmlExample(html: string, main: ReactComponent): ReactExample | null {
  if (!main.tag) return null;
  const start = html.indexOf(`<${main.tag}`);
  if (start < 0) return null;
  const end = html.indexOf(`</${main.tag}>`, start);
  if (end < 0) return null;
  const lineStart = html.lastIndexOf("\n", start) + 1;
  const indent = start - lineStart;
  const element = html.slice(start, end + main.tag.length + 3).split("\n").map((l, i) => (i ? l.slice(Math.min(indent, l.match(/^ */)![0].length)) : l)).join("\n");
  // The element's attributes are the wrapper's props ("Attribute `empty-text`." in each prop's description).
  const props = new Map(main.props.map((p) => [p.description.match(/Attribute `([^`]+)`/)?.[1], p.name]).filter((x): x is [string, string] => !!x[0]));
  const own = (main.renders?.match(/class="([^"]*)"/)?.[1] ?? "").split(/\s+/);
  const open = element.match(new RegExp(`^<${main.tag}([^>]*)>`))!;
  const attrs = [...open[1]!.matchAll(/\s([^\s=]+)(?:="([^"]*)")?/g)]
    .filter(([, name, value]) => !(name === "class" && (value ?? "").split(/\s+/).every((c) => own.includes(c))))
    .map(([, name, value]) => (props.has(name!) ? `${props.get(name!)}${value === undefined ? "" : `="${value}"`}` : `${JSX_NAMES[name!] ?? name}${value === undefined ? "" : `="${value}"`}`));
  const code = `<${main.name}${attrs.map((a) => ` ${a}`).join("")}>${jsx(element.slice(open[0].length, -(main.tag.length + 3)))}</${main.name}>`;
  return { code: `${importsFor(code, main.entry)}\n\n${code}`, checked: false };
}
