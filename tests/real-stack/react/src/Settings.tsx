// The README's React example, as it is there.
import "@blip/font/font.css";
import "@blip/tokens/tokens.css";
import "@blip/core/core.css";
import "@blip/components/components.css";
import { Button, Tab, TabList, TabPanel, Tabs, toast } from "@blip/react";

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
