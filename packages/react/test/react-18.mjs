// Runs the tests against React 18: `node --import ./test/react-18.mjs --test …` resolves react and react-dom (and
// their subpaths, from the tests and from the built package alike) to the react-18 and react-dom-18 aliases.
import { registerHooks } from "node:module";

const ALIAS = { react: "react-18", "react-dom": "react-dom-18" };
registerHooks({
  resolve(specifier, context, next) {
    const [name, ...rest] = specifier.split("/");
    return next(ALIAS[name] ? [ALIAS[name], ...rest].join("/") : specifier, context);
  },
});
