import { Settings } from "./Settings";
import { Kits } from "../shared/Kits";
import { Smoke } from "../shared/Smoke";

export function App() {
  return (
    <main>
      <h1 className="chu-display chu-pop" data-scale="3" data-pop="Level 2">Level 2</h1>
      <section id="readme" data-smoke="tabs">
        <Settings />
      </section>
      <Smoke />
      <Kits />
    </main>
  );
}
