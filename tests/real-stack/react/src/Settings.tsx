// The README's React example, as it is there.
import "@jaatster/blip-font/font.css";
import "@jaatster/blip-tokens/tokens.css";
import "@jaatster/blip-core/core.css";
import "@jaatster/blip-components/components.css";
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
