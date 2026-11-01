"use client";
// The README's React example, as it is there (its CSS is in the layout). It handles a click, so it is a Client
// Component.
import { Button, Tab, TabList, TabPanel, Tabs, toast } from "@jaatster/blip-react";

export function Settings() {
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
