// Only Tabs and its parts; the tabs element loads on its own when Tabs mounts.
import { createRoot } from "react-dom/client";
import { Tab, TabList, TabPanel, Tabs } from "@jaatster/blip-react";

createRoot(document.getElementById("root")!).render(
  <Tabs>
    <TabList aria-label="Settings">
      <Tab selected>General</Tab>
      <Tab>Sound</Tab>
    </TabList>
    <TabPanel>Music, screen shake, big text.</TabPanel>
    <TabPanel hidden>Chip sounds are off until you turn them on.</TabPanel>
  </Tabs>,
);
