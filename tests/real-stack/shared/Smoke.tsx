// What every React app renders for the smoke checks (tests/real-stack/smoke.mjs), all of it from state: a dialog
// opened and closed by state, tabs that arrive after load and one added later, a combobox whose options a search
// fills in as you type, and a field whose error comes back after submit. Copied into each React app as shared/.
import { useEffect, useState } from "react";
import {
  Button, Combobox, Dialog, DialogBody, DialogFooter, DialogHeader, DialogPanel, DialogTitle, Field, FieldError,
  FieldHelp, FieldLabel, Input, Tab, TabList, TabPanel, Tabs,
} from "@jaatster/blip-react";

const PLACES = ["Meadow", "Crystal caves", "Castle", "Canyon", "Desert", "Docks"];

export function Smoke() {
  const [open, setOpen] = useState(false);
  const [tabs, setTabs] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState<string[]>([]);
  const [error, setError] = useState<string>();

  // The tabs come with their data, after the first render.
  useEffect(() => {
    const t = setTimeout(() => setTabs(["Alpha", "Beta", "Gamma"]), 150);
    return () => clearTimeout(t);
  }, []);
  // A search answers each query a moment later.
  useEffect(() => {
    const t = setTimeout(() => setPlaces(query ? PLACES.filter((p) => p.toLowerCase().includes(query.toLowerCase())) : []), 50);
    return () => clearTimeout(t);
  }, [query]);
  useEffect(() => document.documentElement.setAttribute("data-mounted", ""), []);

  return (
    <>
      <section id="dialog">
        <Button type="button" id="open-dialog" onClick={() => setOpen(true)}>Load game</Button>
        <p id="dialog-state">{open ? "open" : "closed"}</p>
        <Dialog open={open} onClose={() => setOpen(false)}>
          <DialogPanel id="save" aria-labelledby="save-title">
            <DialogHeader><DialogTitle id="save-title">Load game</DialogTitle></DialogHeader>
            <DialogBody>Slot 2 will be replaced.</DialogBody>
            <DialogFooter><Button type="button" id="close-dialog" onClick={() => setOpen(false)}>Cancel</Button></DialogFooter>
          </DialogPanel>
        </Dialog>
      </section>

      <section id="late-tabs">
        <Tabs>
          <TabList aria-label="Worlds">
            {tabs.map((t, i) => <Tab key={t} selected={i === 0}>{t}</Tab>)}
          </TabList>
          {tabs.map((t, i) => <TabPanel key={t} hidden={i !== 0}>Panel {t}</TabPanel>)}
        </Tabs>
        <Button type="button" id="add-tab" onClick={() => setTabs((ts) => [...ts, "Delta"])}>Add a tab</Button>
      </section>

      <section id="combobox">
        <FieldLabel htmlFor="place">Start in</FieldLabel>
        <Combobox>
          <Input id="place" list="places" value={query} onChange={(e) => setQuery(e.target.value)} aria-autocomplete="list" />
          <datalist id="places">{places.map((p) => <option key={p} value={p} />)}</datalist>
        </Combobox>
        <p id="place-state">{query}</p>
      </section>

      <form id="signup" onSubmit={(e) => { e.preventDefault(); setError("That name is taken."); }}>
        <Field>
          <FieldLabel htmlFor="player">Player name</FieldLabel>
          <Input id="player" name="player" onChange={() => setError(undefined)} />
          <FieldHelp>Shown on the leaderboard.</FieldHelp>
          {error && <FieldError>{error}</FieldError>}
        </Field>
        <Button type="submit" id="submit">Join</Button>
      </form>
    </>
  );
}
