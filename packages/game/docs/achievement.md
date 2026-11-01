---
name: Achievement
package: "@jaatster/blip-game"
css: achievement.css
element: null
react: Achievement
status: beta
---

# Achievement

A toast for something earned: a trophy in a dark well, what it is called and what it was for, and an optional reward.
It slides in four pixel steps, bumps, and a sparkle flares on the trophy three times.

## Usage

```html
<div class="pp-achievements" role="status">
  <div class="pp-box pp-achievement">
    <span class="pp-box pp-achievement-icon"><pp-sprite name="trophy"></pp-sprite><span class="pp-achievement-sparkles"></span></span>
    <p class="pp-achievement-label">Achievement unlocked</p>
    <p class="pp-achievement-title">Early bird</p>
    <p class="pp-achievement-text">Catch a falling star before sunrise.</p>
    <p class="pp-achievement-reward"><pp-sprite name="coin"></pp-sprite>+50</p>
  </div>
</div>
```

```js
region.prepend(toast);                       // it animates in by itself
services.sound().play("success");            // from @jaatster/blip-core, if sound is on
setTimeout(() => toast.remove(), 5000);
```

## Anatomy

1. **Toast**: a candy box, slate by default, radius 4.
2. **Icon** (`.pp-achievement-icon`): a dark well with an ink top band, holding a sprite.
3. **Sparkles** (`.pp-achievement-sparkles`): two, small, big, small, gone.
4. **Label**, **title**, **text**, **reward**: Pixel Bop capitals in orange light, then Pixelify. The text and the
   reward each sit two pixels below the line above (4 px at the default pixel), so the lines never crowd.

## Variants

`data-tone` on the toast: slate (default), `neutral` for secrets, any candy for a set.

## States

Slide in (24 pixels in four steps), bump (up 6, 3, then down), sparkle after it lands. The motion plays once.
Reduced motion: it appears in place with a still sparkle. On paper and in Windows high contrast, no sparkles.

## Accessibility

- The region is `role="status"`: the toast's text is announced politely when it arrives.
- Toasts are short-lived: never put the only copy of something important in one, and keep them long enough to read
  (five seconds or more).
- Slate with white text is above 9:1; orange light on slate passes AA.

## Content

Title: the achievement's name. Text: what you did, in the past or as the goal, one sentence.

## Do and don't

- **Do** stack several in the region, the newest first.
- **Don't** interrupt play with a dialog for an achievement.
