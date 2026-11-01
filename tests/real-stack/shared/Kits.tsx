// The start page's React example imports one component from each entry. Here each is in use, with the parts it
// needs and the kits' CSS (the start page's CSS, step 5: kits as you need them). Renders on the server too.
import "@blip/game/game.css";
import "@blip/blocks/blocks.css";
import "@blip/effects/effects.css";

import { Button } from "@blip/react";
import { Dialogue, DialogueName, DialogueText, Hud, HudBar, HudLabel, HudStat } from "@blip/react/game";
import { Hero, HeroInner, HeroTitle } from "@blip/react/blocks";
import { World } from "@blip/react/effects";
import { Icon } from "@blip/react/icons";

export function Kits() {
  return (
    <section id="kits">
      <Hero>
        <World scheme="day" />
        <HeroInner>
          <HeroTitle>Blip</HeroTitle>
        </HeroInner>
      </Hero>
      <Hud>
        <HudStat>
          <HudLabel>HP</HudLabel>
          <HudBar value={7} max={10} aria-label="Health" />
        </HudStat>
      </Hud>
      <Dialogue>
        <DialogueName>Pip</DialogueName>
        <DialogueText>
          <p>Ah, a traveller!</p>
        </DialogueText>
      </Dialogue>
      <Button type="button" iconOnly aria-label="Add a level">
        <Icon name="plus" />
      </Button>
    </section>
  );
}
