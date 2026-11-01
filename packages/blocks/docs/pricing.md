---
name: Pricing
package: "@blip/blocks"
css: pricing.css
element: null
react: Pricing
status: beta
---

# Pricing

Plans side by side: panels, one raised plan marked best value with a ribbon, prices in Pixel Bop, what each includes
with pixel checks (and what it leaves out with a dash), and a button at the foot of each. Candy stays on what you
press: the plans are panels, and the one to pick stands out by its band, its ribbon and its candy button.

## Usage

```html
<div class="blip-pricing">
  <article class="blip-box blip-plan" data-variant="panel" aria-labelledby="plan-standard">
    <h3 class="blip-plan-name" id="plan-standard">Standard</h3>
    <p class="blip-plan-price"><span class="blip-plan-currency">$</span><span class="blip-plan-amount">14.99</span><span class="blip-plan-period">one time</span></p>
    <p class="blip-plan-text">The whole game, yours to keep.</p>
    <ul class="blip-plan-features" role="list">
      <li>60 levels in four worlds</li>
      <li data-off>The soundtrack</li>
    </ul>
    <a class="blip-box blip-button" data-variant="soft" data-width="full" href="#standard">Buy Standard</a>
  </article>
  <article class="blip-box blip-plan" data-featured data-tone="pink" aria-labelledby="plan-deluxe">
    <p class="blip-box blip-plan-ribbon">Best value</p>
    …
    <a class="blip-box blip-button" data-tone="pink" data-width="full" href="#deluxe">Buy Deluxe</a>
  </article>
</div>
```

## Anatomy

1. **Plan** (`.blip-plan`): a panel, radius 5; rows for the name, price, text, features and the button at the foot,
   so buttons line up across plans. The featured plan is raised (a two-pixel drop) and wears a five-pixel band of its
   tone's light colour along the top, following the corners.
2. **Ribbon** (`.blip-plan-ribbon`): a small candy tab riding the top edge, in Pixel Bop capitals: the featured plan's
   candy on the featured plan, cream elsewhere (or any `data-tone`).
3. **Price** (`.blip-plan-price`): the amount in Pixel Bop at scale 3, the currency smaller and raised, the period small.
4. **Features** (`.blip-plan-features`): a pixel check (success text colour) or, with `data-off`, a dash and muted text.

## Variants

| Attribute | Use |
|---|---|
| `data-featured` with `data-tone` | The plan to pick (the accent if no tone): a raised panel with a band of the tone's light colour along the top and the ribbon in its candy. Its button is the candy one, in the same tone; it is the only candy in the row. |
| `data-variant="panel"` | Every other plan. Their buttons are soft. |

## Accessibility

- Each plan is an `<article>` named by its plan name; the ribbon is plain text inside it ("Best value").
- The price reads in order: "$ 14.99 one time". Say the currency and period in words if they could be unclear.
- Left-out features are text too ("The soundtrack"), shown muted with a dash: not colour alone. The checks and
  dashes print, though browsers leave backgrounds off paper.
- Buttons name the plan: "Buy Deluxe", not "Buy".

## Content

Three plans at most. Name what changes between them; repeat "Everything in Standard" rather than every line.

## Do and don't

- **Do** mark one plan, and only one, as the best value.
- **Don't** fill a plan with candy: a plan is read, not pressed. Its button is what you press.
- **Don't** invent savings or crossed-out prices.
