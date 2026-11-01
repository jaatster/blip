// Type-checked as a consumer would write it (pnpm --filter @jaatster/blip-react typecheck, against React 19 and React 18
// types): imports go through the package's own exports, so this checks the published types. The expected errors at
// the end must stay errors: those are the mistakes the types refuse.
import { forwardRef, useRef, useState, type ComponentPropsWithoutRef } from "react";
import {
  Alert,
  AlertBody,
  AlertIcon,
  AlertTitle,
  AppBarBrand,
  AppBarLink,
  BottomBarItem,
  BreadcrumbsLink,
  Button,
  ButtonGroup,
  ButtonLink,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardLink,
  CardMedia,
  CardTitle,
  Checkbox,
  Cluster,
  DataTable,
  Dialog,
  DialogBody,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogTitle,
  Drawer,
  DrawerSheet,
  Field,
  FieldError,
  FieldHelp,
  FieldLabel,
  Grid,
  Input,
  Link,
  Menu,
  MenuItem,
  MenuLabel,
  MenuList,
  PaginationNext,
  PaginationPage,
  PaginationPrev,
  Progress,
  Rating,
  Segment,
  Segmented,
  SidebarItem,
  SkipLink,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TableFrame,
  TableScroll,
  TableSort,
  Tabs,
  Toaster,
  ToggleButton,
  Tooltip,
  Window,
  WindowBar,
  WindowBody,
  WindowControl,
  WindowTitle,
  toast,
  type Tone,
} from "@jaatster/blip-react";
import { Choice, ChoiceList, Choices, Counter, Dialogue, DialogueName, DialogueText, Hearts, HudBar, Inventory, Slot, Sprite } from "@jaatster/blip-react/game";
import { CtaActions, CtaBand, CtaText, CtaTitle, Feature, FeaturesGrid, FeatureTitle, Hero, HeroActions, HeroInner, HeroLead, HeroTitle } from "@jaatster/blip-react/blocks";
import { DropText, Typewriter, World } from "@jaatster/blip-react/effects";
import { Icon, type IconName } from "@jaatster/blip-react/icons";

/** A router's own link (as React Router's): it takes `to` and renders an anchor. Link parts take it with `as`. */
const RouterLink = forwardRef<HTMLAnchorElement, { to: string } & Omit<ComponentPropsWithoutRef<"a">, "href">>(function RouterLink({ to, ...rest }, ref) {
  return <a ref={ref} href={to} {...rest} />;
});

export function Actions() {
  const [bold, setBold] = useState(false);
  const icon: IconName = "heart";
  const tone: Tone = "danger";
  return (
    <Stack gap={4}>
      <Cluster justify="between">
        <Button onClick={() => toast({ title: "Saved", tone: "success" })}>Save game</Button>
        <Button type="button" onClick={() => toast("Saving…").close()}>
          Save quietly
        </Button>
        <Button variant="soft" tone={tone} size="sm" type="button">
          Delete save
        </Button>
        <Button iconOnly aria-label="Add level" id="add">
          <Icon name="plus" />
        </Button>
        <Tooltip htmlFor="add" side="bottom">
          Adds a level after this one
        </Tooltip>
        <ButtonLink href="/play" size="lg">
          Play now
        </ButtonLink>
        <ButtonLink as={RouterLink} to="/play" fullWidth>
          Play now
        </ButtonLink>
      </Cluster>
      <ButtonGroup attached aria-label="Text style">
        <ToggleButton variant="outline" pressed={bold} onClick={() => setBold(!bold)}>
          Bold
        </ToggleButton>
      </ButtonGroup>
      <Grid as="ul" role="list" min={128}>
        <li>
          <Link href="/rules" external>
            House rules <Icon name={icon} label="Liked" size="lg" />
          </Link>
        </li>
      </Grid>
    </Stack>
  );
}

export function Forms() {
  const [view, setView] = useState("grid");
  return (
    <form>
      <Field countText="{left} letters left">
        <FieldLabel htmlFor="name">Player name</FieldLabel>
        <Input id="name" name="name" required maxLength={16} />
        <FieldHelp>Shown on the leaderboard.</FieldHelp>
        <FieldError />
      </Field>
      <Checkbox name="music" defaultChecked>
        Music
      </Checkbox>
      <Segmented name="view" value={view} size="sm" fullWidth aria-label="View" onChange={(e) => setView(e.detail.value)}>
        <Segment value="list">List</Segment>
        <Segment value="grid" checked>
          Grid
        </Segment>
      </Segmented>
      <Rating name="fun" value={4} max={5} aria-label="How fun was it?" onChange={(e) => console.log(e.detail.value.toFixed(0))} />
    </form>
  );
}

export function Overlays() {
  const dialog = useRef<HTMLElementTagNameMap["chu-dialog"]>(null);
  return (
    <>
      <Button type="button" commandFor="save" command="show-modal">
        Save game
      </Button>
      <Dialog ref={dialog} lightDismiss onBeforeClose={(e) => e.detail.reason === "backdrop" && e.preventDefault()} onClose={(e) => console.log(e.detail.returnValue)}>
        <DialogPanel id="save" aria-labelledby="save-title">
          <form method="dialog">
            <DialogHeader>
              <DialogTitle id="save-title">Save game</DialogTitle>
              <DialogClose commandFor="save" value="cancel" />
            </DialogHeader>
            <DialogBody>Slot 2 will be replaced.</DialogBody>
            <DialogFooter>
              <Button value="save">Save</Button>
            </DialogFooter>
          </form>
        </DialogPanel>
      </Dialog>
      <Button type="button" onClick={() => dialog.current?.show()}>
        Open from script
      </Button>
      <Tabs activation="manual" variant="outline" size="lg" value="sound" onChange={(e) => console.log(e.detail.value, e.detail.index, e.detail.tab)}>
        <TabList aria-label="Settings">
          <Tab value="general" selected>
            General
          </Tab>
          <Tab value="sound">Sound</Tab>
        </TabList>
        <TabPanel>…</TabPanel>
        <TabPanel hidden>…</TabPanel>
      </Tabs>
      <Menu open={false} align="end" onAction={(e) => console.log(e.detail.value, e.detail.checked)} onClose={() => console.log("closed")}>
        <Button variant="soft">Level</Button>
        <MenuList aria-label="Level">
          <MenuItem value="duplicate">
            <MenuLabel>Duplicate</MenuLabel>
          </MenuItem>
          <MenuItem kind="checkbox" checked>
            <MenuLabel>Grid</MenuLabel>
          </MenuItem>
        </MenuList>
      </Menu>
      <Toaster side="top" align="center" max={2} />
    </>
  );
}

export function Data() {
  return (
    <>
      <Alert tone="success">
        <AlertIcon />
        <AlertBody>
          <AlertTitle>Saved</AlertTitle>
        </AlertBody>
      </Alert>
      <Progress value={3} max={10} aria-label="Level progress" />
      <Card>
        <CardHeader>
          <CardTitle>Meadow</CardTitle>
        </CardHeader>
        <CardBody>Rolling hills, slow clouds and the first boss.</CardBody>
        <CardFooter>
          <Button size="sm">Play</Button>
        </CardFooter>
      </Card>
      <TableFrame>
        <TableScroll aria-labelledby="scores">
          <DataTable zebra>
            <caption id="scores">Leaderboard</caption>
            <thead>
              <tr>
                <th scope="col" aria-sort="descending">
                  <TableSort>Score</TableSort>
                </th>
              </tr>
            </thead>
          </DataTable>
        </TableScroll>
      </TableFrame>
      <Window>
        <WindowBar>
          <WindowTitle>System</WindowTitle>
          <WindowControl control="close" aria-label="Close System" />
        </WindowBar>
        <WindowBody>…</WindowBody>
      </Window>
    </>
  );
}

export function Game() {
  return (
    <>
      <Counter value={42} pad={3} label="Coins" sound="coin">
        <Sprite name="coin" />
      </Counter>
      <Hearts value={2.5} max={5} label="Health" />
      <HudBar value={7} max={10} tone="blue" aria-label="Magic" />
      <Dialogue voice mood="happy" font="display" onDone={() => console.log("done")}>
        <DialogueName>Pip</DialogueName>
        <DialogueText>
          <p>Ah, a traveller!</p>
        </DialogueText>
      </Dialogue>
      <Choices onAction={(e) => console.log(e.detail.item.value, e.detail.value, e.detail.index, e.detail.label)}>
        <ChoiceList>
          <li>
            <Choice>Yes</Choice>
          </li>
        </ChoiceList>
      </Choices>
      <Inventory aria-label="Backpack" onSelect={(e) => console.log(e.detail.index, e.detail.value)}>
        <Slot rarity="rare" aria-label="Mana potion">
          <Sprite name="potion" tone="blue" />
        </Slot>
      </Inventory>
      <DropText className="chu-display chu-pop" scale={3} tone="pink" pop>
        Blip
      </DropText>
      <Typewriter mood="sleepy" blips onTypewriterDone={() => console.log("typed")}>
        Hello there!
      </Typewriter>
    </>
  );
}

// Every link part renders your router's link with `as`, and takes that link's props.
export function Routed() {
  return (
    <>
      <SkipLink href="#main">Skip to content</SkipLink>
      <AppBarBrand as={RouterLink} to="/">
        Questboard
      </AppBarBrand>
      <AppBarLink as={RouterLink} to="/live" current>
        Live ops
      </AppBarLink>
      <SidebarItem as={RouterLink} to="/players">
        Players
      </SidebarItem>
      <BreadcrumbsLink as={RouterLink} to="/worlds">
        Worlds
      </BreadcrumbsLink>
      <PaginationPrev as={RouterLink} to="?page=4">
        Previous
      </PaginationPrev>
      <PaginationPage as={RouterLink} to="?page=5" aria-label="Page 5" current>
        5
      </PaginationPage>
      <PaginationNext as={RouterLink} to="?page=6">
        Next
      </PaginationNext>
      <BottomBarItem as={RouterLink} to="/">
        Today
      </BottomBarItem>
      <CardLink as={RouterLink} to="/worlds/night-woods">
        Night woods
      </CardLink>
      <CardMedia fit="pixels" artWidth={64} artHeight={36}>
        <img src="meadow.png" alt="" width={64} height={36} />
      </CardMedia>
      <Drawer lightDismiss>
        <DrawerSheet id="settings" side="start" aria-labelledby="settings-title">
          <DialogTitle id="settings-title">Settings</DialogTitle>
        </DrawerSheet>
      </Drawer>
      <Link as={RouterLink} to="/rules" standalone>
        House rules
      </Link>
    </>
  );
}

export function Landing() {
  return (
    <>
      <Hero>
        <World scheme="auto" parallax clouds="drift" avoid=".chu-hero-title, .chu-hero-lead, .chu-hero-actions" />
        <HeroInner>
          <HeroTitle>Blip</HeroTitle>
          <HeroLead>Candy on pastel.</HeroLead>
          <HeroActions>
            <ButtonLink href="/start" size="lg">
              Start
            </ButtonLink>
          </HeroActions>
        </HeroInner>
      </Hero>
      <FeaturesGrid>
        <Feature layout="lead">
          <FeatureTitle>One world</FeatureTitle>
        </Feature>
      </FeaturesGrid>
      <CtaBand variant="soft" tone="purple">
        <CtaTitle boxed>Ready?</CtaTitle>
        <CtaText>It is free.</CtaText>
        <CtaActions>
          <ButtonLink href="/start" variant="outline">
            Start
          </ButtonLink>
        </CtaActions>
      </CtaBand>
    </>
  );
}

// The types refuse what the system does not have.
export function Refused() {
  return (
    <>
      {/* @ts-expect-error: an icon-only button needs aria-label or aria-labelledby */}
      <Button iconOnly>
        <Icon name="plus" />
      </Button>
      {/* @ts-expect-error: no such tier */}
      <Button variant="loud">Save</Button>
      {/* @ts-expect-error: no such invoker command */}
      <Button commandFor="save" command="open">
        Save
      </Button>
      {/* @ts-expect-error: no such icon */}
      <Icon name="not-an-icon" />
      {/* @ts-expect-error: a toggle always says whether it is on */}
      <ToggleButton>Grid</ToggleButton>
      {/* @ts-expect-error: World draws its own content */}
      <World>text</World>
      {/* @ts-expect-error: a side is top, bottom, left or right */}
      <Tooltip side="middle" />
      {/* @ts-expect-error: pixel art needs its size in its own pixels */}
      <CardMedia fit="pixels" />
      {/* @ts-expect-error: a drawer's sides follow the text: end and start, not right and left */}
      <DrawerSheet side="right" aria-label="Settings" />
      {/* @ts-expect-error: a feature's place in the grid is its layout, not a size */}
      <Feature size="lead" />
      {/* @ts-expect-error: a router's link needs what that link needs (here, to) */}
      <AppBarLink as={RouterLink}>Live ops</AppBarLink>
      {/* @ts-expect-error: a page needs its full name */}
      <PaginationPage href="?page=5">5</PaginationPage>
      {/* @ts-expect-error: menus and palettes say an item ran with onAction, not onSelect */}
      <Menu onSelect={(e: CustomEvent<{ value: string }>) => e} />
      {/* @ts-expect-error: chu-change carries a number here */}
      <Rating onChange={(e: CustomEvent<{ value: string }>) => e} />
      {/* @ts-expect-error: a tab list needs a name */}
      <TabList>
        <Tab selected>General</Tab>
      </TabList>
      {/* @ts-expect-error: a dialog needs a name */}
      <DialogPanel id="x">…</DialogPanel>
      {/* @ts-expect-error: a meter needs a name */}
      <HudBar value={3} />
      {/* @ts-expect-error: a window control says what it does */}
      <WindowControl control="close" />
      {/* @ts-expect-error: a menu item's checked state is only for checkbox and radio items */}
      <MenuItem checked>Copy</MenuItem>
    </>
  );
}
