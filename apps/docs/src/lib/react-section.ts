/**
 * A component page's React section, from lib/react.ts: an example that works (with its imports), the parts, and
 * the props of each, as the source types and JSDoc say today.
 */
import type { Doc } from "./data";
import { esc } from "./html";
import { codeBlock } from "./markdown";
import { NAMED_TYPES, htmlExample, namedType, reactExamples, reactFamily, reactFunctionsFor, type ReactComponent } from "./react";

/** JSDoc prose as HTML: `code` as code, everything else as text. */
export const inline = (text: string): string =>
  text
    .split(/(`[^`]+`)/)
    .map((part) => (/^`[^`]+`$/.test(part) ? `<code class="docs-inline-code">${esc(part.slice(1, -1))}</code>` : esc(part)))
    .join("");
const code = (s: string) => `<code class="docs-inline-code">${esc(s)}</code>`;
const tag = (name: string) => code(`<${name}>`);

export interface PropsTable {
  rows: string[][];
  /** Where every other prop goes, and the ref. */
  rest: string;
  notes: string[];
}
export interface ReactSection {
  main: ReactComponent;
  parts: ReactComponent[];
  intro: string;
  examples: { html: string; checked: boolean }[];
  props: PropsTable;
  partRows: string[][];
  partProps: { name: string; table: PropsTable }[];
  /** The named types the tables use (Tone, Radius), each with its values (HTML). */
  types: [name: string, values: string][];
  functions: { name: string; signature: string; description: string; examples: string[] }[];
}

function propsTable(c: ReactComponent, used: Set<string>): PropsTable {
  const rows = c.props.map((p) => {
    for (const t of p.type.split(/[^A-Za-z]+/)) if (NAMED_TYPES.has(t)) used.add(t);
    return [code(p.name) + (p.optional ? "" : ' <span class="pp-muted">required</span>'), code(p.type), p.default ? code(p.default) : "", inline(p.description)];
  });
  const root = c.renders?.match(/^<([a-z][a-z0-9-]*)/)?.[1];
  let rest: string;
  if (c.native === "*") rest = `It takes every HTML attribute too (${code("id")}, ${code("className")}, ${code("aria-*")}, ${code("on…")} handlers), and its ref is the ${tag(c.tag ?? root ?? "element")} element itself.`;
  else if (c.native === "as") rest = `Every other prop goes to the element it renders (${tag(c.as ?? root ?? "div")}, or the one ${code("as")} names), and so does the ref.`;
  else if (c.native && root && c.native !== root) rest = `Every other prop goes to its ${tag(c.native)}, and so does the ref; ${code("className")} goes on the ${tag(root)} around it.`;
  else if (c.native) rest = `Every other prop goes to its ${tag(c.native)}, and so does the ref.`;
  else rest = "";
  return { rows, rest, notes: c.notes.map(inline) };
}

export async function reactSection(doc: Doc, exampleHtml: string | null): Promise<ReactSection | null> {
  const family = reactFamily(doc);
  const main = family[0];
  if (!main) return null;
  const parts = family.slice(1);
  const used = new Set<string>();

  const found = reactExamples(family);
  if (!found.length && exampleHtml) {
    const fromHtml = htmlExample(exampleHtml, main);
    if (fromHtml) found.push(fromHtml);
  }
  const examples = await Promise.all(found.map(async (e) => ({ html: await codeBlock(e.code, "tsx", "TSX"), checked: e.checked })));

  const element = main.tag ? ` It loads ${tag(main.tag)}'s module on the client the first time it mounts.` : "";
  const intro =
    `${tag(main.name)}${parts.length ? " and its parts" : ""}, from ${code(main.entry)}, render${parts.length ? "" : "s"} the markup above with typed props.${element} ` +
    `Each prop sets the attribute or state its description names, so the HTML on this page says what it does. Load the CSS once, as for plain HTML.`;

  const props = propsTable(main, used);
  const partRows = parts.map((p) => [tag(p.name), p.renders ? code(p.renders) : "", inline(p.summary) + (p.props.length ? ` <span class="pp-muted">Props: ${p.props.map((x) => code(x.name)).join(", ")}.</span>` : "")]);
  const partProps = parts.filter((p) => p.props.length).map((p) => ({ name: p.name, table: propsTable(p, used) }));
  const types = [...used].sort().map((t): [string, string] => [t, inline(namedType(t)?.split(", ").map((v) => `\`${v}\``).join(", ") ?? "")]);

  const functions = await Promise.all(
    reactFunctionsFor(doc).map(async (f) => ({
      name: f.name,
      signature: await codeBlock(`import { ${f.name} } from "${f.entry}";\n\nfunction ${f.signature};`, "ts", "TypeScript"),
      description: inline(f.description),
      examples: await Promise.all(f.examples.map((e) => codeBlock(e, "tsx", "TSX"))),
    })),
  );
  return { main, parts, intro, examples, props, partRows, partProps, types, functions };
}
