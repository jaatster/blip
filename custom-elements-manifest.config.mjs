/**
 * Custom Elements Manifest config for the packages with Web Components (elements, game, effects, icons).
 *
 *   pnpm cem                                     every package (scripts/cem.mjs)
 *   cd packages/game && npx cem analyze --config ../../custom-elements-manifest.config.mjs
 *
 * Run from a package: it reads that package's src/*.ts and writes its custom-elements.json. The element sources
 * carry the API in JSDoc (@summary, @attr, @fires, @cssprop); two small plugins fill in what the analyzer cannot
 * see on its own:
 *
 * - pixel-define: Blip registers elements with PixelElement.define("pp-x", Class) (or Class.define), not a
 *   bare customElements.define, so it records those definitions too.
 * - pixel-tidy: keeps the public contract only (no private, protected or static members, no form lifecycle
 *   callbacks, only pp-* events), links each attribute to the property that mirrors it (light-dismiss to
 *   lightDismiss, for to htmlFor), drops attributes a subclass marks `@omit-attr <name>`, and leaves out private
 *   _modules that nothing public refers to.
 */

const LIFECYCLE = new Set(["formAssociatedCallback", "formResetCallback", "formDisabledCallback", "formStateRestoreCallback"]);
/** Attributes whose mirroring property has another name than the camel-cased attribute. */
const FIELD_FOR = { for: "htmlFor", class: "className", readonly: "readOnly" };
const camel = (name) => FIELD_FOR[name] ?? name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

/** PixelElement.define("pp-x", Class) and Class.define("pp-x", Class). */
function pixelDefine() {
  return {
    name: "blip/define",
    analyzePhase({ ts, node, moduleDoc }) {
      if (!ts.isCallExpression(node) || !ts.isPropertyAccessExpression(node.expression)) return;
      if (node.expression.name.text !== "define" || node.arguments.length !== 2) return;
      const receiver = node.expression.expression.getText();
      if (/(^|\.)customElements$/.test(receiver)) return; // the analyzer's own plugin handles these
      const [tag, ctor] = node.arguments;
      if (!ts.isStringLiteral(tag) || !ts.isIdentifier(ctor)) return;
      if (moduleDoc.exports?.some((e) => e.kind === "custom-element-definition" && e.name === tag.text)) return;
      moduleDoc.exports = [
        ...(moduleDoc.exports ?? []),
        { kind: "custom-element-definition", name: tag.text, declaration: { name: ctor.text, module: moduleDoc.path } },
      ];
    },
  };
}

function pixelTidy() {
  /** className -> attribute names to leave out (from `@omit-attr name`). */
  const omit = new Map();
  return {
    name: "blip/tidy",
    // One process may analyse several packages with this same plugin (scripts/cem.mjs): start each one clean.
    initialize() {
      omit.clear();
    },
    analyzePhase({ ts, node }) {
      if (!ts.isClassDeclaration(node) || !node.name) return;
      for (const tag of ts.getJSDocTags(node)) {
        if (tag.tagName.text !== "omit-attr") continue;
        const text = typeof tag.comment === "string" ? tag.comment : (tag.comment ?? []).map((c) => c.text).join("");
        const names = text.split(/[\s,]+/).filter(Boolean);
        omit.set(node.name.text, [...(omit.get(node.name.text) ?? []), ...names]);
      }
    },
    packageLinkPhase({ customElementsManifest }) {
      const modules = customElementsManifest.modules;
      const paths = new Set(modules.map((m) => m.path));
      for (const mod of modules) {
        for (const decl of mod.declarations ?? []) {
          if (decl.kind !== "class") continue;
          // A superclass imported as "./_overlay.js" is recorded as "/src/_overlay.js": point it at the module.
          const sup = decl.superclass?.module?.replace(/^\//, "").replace(/\.js$/, ".ts");
          if (sup && paths.has(sup)) decl.superclass.module = sup;
          if (decl.members) {
            decl.members = decl.members.filter(
              (m) => !m.static && !m.name.startsWith("#") && m.privacy !== "private" && m.privacy !== "protected" && !LIFECYCLE.has(m.name),
            );
            if (!decl.members.length) delete decl.members;
          }
          // Blip's own events are pp-* (AUTHORING rule 8). The analyzer also guesses an event from a
          // dispatchEvent(new Event(type)) whose name is a variable (the native input and change a form control
          // re-fires): leave those out.
          if (decl.events) {
            decl.events = decl.events.filter((e) => e.name?.startsWith("pp-"));
            if (!decl.events.length) delete decl.events;
          }
          const dropped = omit.get(decl.name) ?? [];
          if (decl.attributes) {
            decl.attributes = decl.attributes.filter((a) => !dropped.includes(a.name));
            for (const attr of decl.attributes) {
              if (attr.fieldName) continue;
              const field = decl.members?.find((m) => m.kind === "field" && m.name === camel(attr.name));
              if (!field) continue;
              attr.fieldName = field.name;
              if (!attr.type && field.type) attr.type = field.type;
              field.attribute ??= attr.name;
            }
            if (!decl.attributes.length) delete decl.attributes;
          }
        }
      }
      // Private modules (src/_*.ts) stay only while something public points into them: a superclass, an inherited
      // member, or a re-export.
      const text = JSON.stringify(modules.filter((m) => !isPrivate(m.path)));
      customElementsManifest.modules = modules.filter((m) => !isPrivate(m.path) || text.includes(`"${m.path}"`));
    },
  };
}

const isPrivate = (path) => /(^|\/)_[^/]*$/.test(path);

export default {
  globs: ["src/**/*.ts"],
  exclude: ["src/index.ts", "src/**/*.test.ts", "src/**/*.d.ts"],
  outdir: ".",
  packagejson: false,
  plugins: [pixelDefine(), pixelTidy()],
};
