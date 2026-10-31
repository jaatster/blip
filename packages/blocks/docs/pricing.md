---
name: Pricing
package: "@jaatster/blip-blocks"
css: pricing.css
element: null
react: Pricing
status: beta
---

# Pricing

Plans side by side: panels, one candy plan marked best value with a ribbon, prices in Pixel Bop, what each includes
with pixel checks (and what it leaves out with a dash), and a button at the foot of each.

## Usage

```html
<div class="pp-pricing">
  <article class="pp-box pp-plan" data-variant="panel" aria-labelledby="plan-standard">
    <h3 class="pp-plan-name" id="plan-standard">Standard</h3>
    <p class="pp-plan-price"><span class="pp-plan-currency">$</span><span class="pp-plan-amount">14.99</span><span class="pp-plan-period">one time</span></p>
    <p class="pp-plan-text">The whole game, yours to keep.</p>
    <ul class="pp-plan-features" role="list">
      <li>60 levels in four worlds</li>
      <li data-off>The soundtrack</li>
    </ul>
    <a class="pp-box pp-button" data-variant="soft" data-width="full" href="#standard">Buy Standard</a>
  </article>
  <article class="pp-box pp-plan" data-featured data-tone="pink" aria-labelledby="plan-deluxe">
    <p class="pp-box pp-plan-ribbon">Best value</p>
    …
    <a class="pp-box pp-button" data-variant="outline" data-width="full" href="#deluxe">Buy Deluxe</a>
  </article>
</div>
```

## Anatomy

1. **Plan** (`.pp-plan`): a panel, radius 5; rows for the name, price, text, features and the button at the foot,
   so buttons line up across plans.
2. **Ribbon** (`.pp-plan-ribbon`): a cream candy tab on the top edge, Pixel Bop capitals.
3. **Price** (`.pp-plan-price`): the amount in Pixel Bop at scale 3, the currency smaller and raised, the period small.
4. **Features** (`.pp-plan-features`): a pixel check (success text colour) or, with `data-off`, a dash and muted text.

## Variants

| Attribute | Use |
|---|---|
| `data-featured` with `data-tone` | The candy plan (the accent if no tone). Its checks are ink; its button is outline, because candy never stands on candy. |
| `data-variant="panel"` | Every other plan. Their buttons are soft. |

## Accessibility

- Each plan is an `<article>` named by its plan name; the ribbon is plain text inside it ("Best value").
- The price reads in order: "$ 14.99 one time". Say the currency and period in words if they could be unclear.
- Left-out features are text too ("The soundtrack"), shown muted with a dash: not colour alone.
- Buttons name the plan: "Buy Deluxe", not "Buy".

## Content

Three plans at most. Name what changes between them; repeat "Everything in Standard" rather than every line.

## Do and don't

- **Do** mark one plan, and only one, as the best value.
- **Don't** invent savings or crossed-out prices.
