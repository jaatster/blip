// A Server Component: Blip's components render on the server here, and the client parts hydrate.
import { Tab, TabList, TabPanel, Tabs } from "@jaatster/blip-react";
import { Kits } from "../shared/Kits";
import { Settings } from "./settings";
import { Smoke } from "./smoke";

export default function Home() {
  return (
    <main>
      <h1 className="blip-display blip-pop" data-scale="3" data-pop="Level 2">Level 2</h1>
      <section id="readme" data-smoke="tabs">
        <Settings />
      </section>
      <section id="server-tabs" data-smoke="tabs">
        <Tabs>
          <TabList aria-label="From the server">
            <Tab selected>One</Tab>
            <Tab>Two</Tab>
          </TabList>
          <TabPanel>Rendered by a Server Component.</TabPanel>
          <TabPanel hidden>And upgraded in the browser.</TabPanel>
        </Tabs>
      </section>
      <Smoke />
      <Kits />
    </main>
  );
}
