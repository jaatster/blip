// Prints the probe tree rendered on a server: plain Node, no DOM (run by element.test.mjs).
import { renderToString } from "react-dom/server";
import { tree } from "./probe.mjs";

process.stdout.write(renderToString(tree()));
