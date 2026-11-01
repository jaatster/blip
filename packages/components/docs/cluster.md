---
name: Cluster
package: "@blip/components"
css: cluster.css
element: null
react: Cluster
status: stable
---

# Cluster

A wrapping inline group: tags, buttons, keycaps, avatars. Items keep their own size and wrap onto a new line when
the row is full. A layout primitive: no colour, no box.

## Usage

```html
<div class="blip-cluster">…</div>
<div class="blip-cluster" data-justify="between">…</div>
<div class="blip-cluster" data-switch><button …>Cancel</button><button …>Save game</button></div>
```

## Anatomy

A wrapping flex row with a token gap, centred across. Candy things keep a pixel for their drop on the right and
below, so a cluster never clips a shadow.

## Variants

| Attribute | Values | Use |
|---|---|---|
| `data-gap` | `0`, `1`, `2`, `3`, `4` (default), `6`, `8`, `12`, `16`, `24`, `32` | Pixels between items (`--blip-space-N`). |
| `data-justify` | `start` (default), `center`, `end`, `between` | Where items sit along the row. `between` splits a toolbar to both ends. |
| `data-align` | `center` (default), `start`, `end`, `baseline`, `stretch` | Where items sit across the row. |
| `data-switch` | | Items share one row, growing to fill it, while the cluster is at least `--blip-cluster-switch` wide (160 pixels); below that each takes a whole line. It follows its container, not the viewport: the same markup is a row in a wide dialog and a column in a narrow card. |

## Accessibility

Layout only. Group related controls with `role="group"` and a label where they need a name ("Filter by weapon").

## Do and don't

- **Do** use `data-switch` for a pair of dialog buttons that must stay big on small screens.
- **Don't** use a cluster for a list of things people read in order: use a list.

## API

| Custom property | Default | |
|---|---|---|
| `--blip-cluster-gap` | `--blip-space-4` | The gap. |
| `--blip-cluster-switch` | 160 pixels | The width below which `data-switch` stacks. |
