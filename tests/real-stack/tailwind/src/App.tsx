import { Button, Tab, TabList, TabPanel, Tabs, toast } from "@jaatster/blip-react";
import { Smoke } from "../shared/Smoke";

/** The README's Settings (its CSS is app.css, the start page's recipe for Tailwind). */
function Settings() {
  return (
    <Tabs>
      <TabList aria-label="Settings">
        <Tab selected>General</Tab>
        <Tab>Sound</Tab>
      </TabList>
      <TabPanel>
        <Button type="button" onClick={() => toast({ title: "Saved", tone: "success" })}>Save game</Button>
      </TabPanel>
      <TabPanel hidden>Chip sounds are off until you turn them on.</TabPanel>
    </Tabs>
  );
}

/** Blip with Tailwind's utilities on it, and a button with none, to compare with reference.html. */
export function Utilities() {
  return (
    <section id="tailwind">
      <Button type="button" id="tw-plain">Press start</Button>
      <Button type="button" id="tw-button" className="mt-8 px-12">Wide</Button>
      <p id="tw-text" className="mt-8 text-red-600">Tailwind's utilities win.</p>
    </section>
  );
}

export function App() {
  return (
    <main className="p-4">
      <Utilities />
      <h1 className="pp-display pp-pop" data-scale="3" data-pop="Level 2">Level 2</h1>
      <section id="readme" data-smoke="tabs">
        <Settings />
      </section>
      <Smoke />
    </main>
  );
}
