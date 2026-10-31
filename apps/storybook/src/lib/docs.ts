/**
 * Turns a component's markdown (packages/<pkg>/docs/<name>.md) into the two halves of its docs page: the title and
 * introduction with a facts table from the front matter, then everything from the first "##" heading on. The page
 * shows the gallery between them.
 */
export interface DocMeta {
  example: string;
  docs: string | null;
  package: string;
  element: string | null;
  status: string | null;
}

const FRONT = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

function front(source: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of FRONT.exec(source)?.[1]?.split(/\r?\n/) ?? []) {
    const kv = /^([\w-]+):\s*(.*)$/.exec(line);
    if (kv) out[kv[1]!] = kv[2]!.trim().replace(/^"(.*)"$/, "$1");
  }
  return out;
}

const code = (v: string | undefined) => (v && v !== "null" ? v.split(/,\s*/).map((s) => `\`${s}\``).join(", ") : "none");
const tags = (v: string | undefined) => (v && v !== "null" ? v.split(/,\s*/).map((s) => `\`<${s}>\``).join(", ") : "none (CSS only)");

/** Links between the docs (`[segmented control](segmented.md)`) open that component's page in Storybook. */
function relink(markdown: string, pages: Record<string, string>): string {
  return markdown.replace(/\[([^\]]+)\]\((?:\.\/)?([\w-]+)\.md(?:#[\w-]*)?\)/g, (whole, text: string, name: string) =>
    pages[name] ? `<a href="./?path=/docs/${pages[name]}" target="_top">${text}</a>` : whole,
  );
}

export function docParts(source: string, meta: DocMeta, pages: Record<string, string> = {}): { intro: string; body: string } {
  const f = front(source);
  const text = relink(source.replace(FRONT, "").trim(), pages);
  const at = text.search(/^## /m);
  const intro = at < 0 ? text : text.slice(0, at).trim();
  const body = at < 0 ? "" : text.slice(at);
  const facts = [
    "| Package | CSS | Element | React | Status |",
    "|---|---|---|---|---|",
    `| \`${f.package ?? meta.package}\` | ${code(f.css)} | ${tags(f.element)} | ${code(f.react)} | ${f.status ?? meta.status ?? ""} |`,
  ].join("\n");
  return { intro: `${intro}\n\n${facts}\n\nThe example below is \`${meta.example}\`. Use the toolbar to change the scheme, the pixel and motion.`, body };
}
