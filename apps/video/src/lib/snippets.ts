// Generated from the docs' live examples (apps/docs/dist/components/<slug>/index.html, after the page's elements have
// run; canvases kept as images): the parts of Blip that read well whole and compact in a row, each one compact, whole
// example that fits a 44 x 240 pixel cell, taken from the page's own markup (or trimmed from it: one item, one line).
// w and h are its drawn size, in Blip pixels.
export type Snippet = { readonly pkg: string; readonly slug: string; readonly name: string; readonly w: number; readonly h: number; readonly html: string };
export const SNIPPETS: readonly Snippet[] = [
 {
  "pkg": "components",
  "slug": "button",
  "name": "Button",
  "w": 68,
  "h": 20,
  "html": "<button class=\"blip-box blip-button\" data-tone=\"success\">Claim reward</button>"
 },
 {
  "pkg": "components",
  "slug": "tag",
  "name": "Tag",
  "w": 61,
  "h": 16,
  "html": "<span class=\"blip-box blip-tag\" data-size=\"lg\" data-tone=\"orange\"><svg class=\"blip-icon\" viewBox=\"0 0 12 12\" aria-hidden=\"true\"><path d=\"M1 2h1v1h1v1h1V3h1V2h2v1h1v1h1V3h1V2h1v5H1zm2 3v1h1V5zm5 0v1h1V5zM1 8h10v2H1z\"></path></svg>Level 42</span>"
 },
 {
  "pkg": "components",
  "slug": "switch",
  "name": "Switch",
  "w": 24,
  "h": 15,
  "html": "<span class=\"blip-box blip-switch\"><input type=\"checkbox\" role=\"switch\" class=\"blip-box\" checked=\"\"></span>"
 },
 {
  "pkg": "components",
  "slug": "rating",
  "name": "Rating",
  "w": 90,
  "h": 17,
  "html": "<span class=\"blip-rating\" role=\"img\" aria-label=\"Rated 5 out of 5\" style=\"--blip-rating-value:5\"></span>"
 },
 {
  "pkg": "game",
  "slug": "hud",
  "name": "HUD",
  "w": 141,
  "h": 15,
  "html": "<div class=\"blip-hud-group\"> <blip-hearts value=\"3.5\" max=\"5\" label=\"Health\" class=\"blip-hearts\"><blip-sprite name=\"heart\" aria-hidden=\"true\"><svg class=\"blip-sprite\" data-sprite=\"heart\" viewBox=\"0 0 11 10\" width=\"22\" height=\"20\" style=\"--_w:11;--_h:10\" shape-rendering=\"crispEdges\" focusable=\"false\" aria-hidden=\"true\"><path fill=\"var(--blip-ink)\" d=\"M1 0h3v1h-3zM7 0h3v1h-3zM0 1h1v1h-1zM4 1h1v1h-1zM6 1h1v1h-1zM10 1h1v1h-1zM0 2h1v1h-1zM5 2h1v1h-1zM10 2h1v1h-1zM0 3h1v1h-1zM10 3h1v1h-1zM0 4h1v1h-1zM10 4h1v1h-1zM1 5h1v1h-1zM9 5h1v1h-1zM2 6h1v1h-1zM8 6h1v1h-1zM3 7h1v1h-1zM7 7h1v1h-1zM4 8h1v1h-1zM6 8h1v1h-1zM5 9h1v1h-1z\"></path><path fill=\"var(--blip-sprite-light, var(--blip-candy-red-light))\" d=\"M1 1h1v1h-1zM3 1h1v1h-1zM7 1h2v1h-2zM2 2h1v1h-1zM1 3h1v1h-1z\"></path><path fill=\"var(--blip-white)\" d=\"M2 1h1v1h-1zM1 2h1v1h-1z\"></path><path fill=\"var(--blip-sprite-base, var(--blip-candy-red))\" d=\"M9 1h1v1h-1zM3 2h2v1h-2zM6 2h3v1h-3zM2 3h7v1h-7zM1 4h8v1h-8zM2 5h6v1h-6zM3 6h3v1h-3z\"></path><path fill=\"var(--blip-sprite-shade, var(--blip-candy-red-shade))\" d=\"M9 2h1v1h-1zM9 3h1v1h-1zM9 4h1v1h-1zM8 5h1v1h-1zM6 6h2v1h-2zM4 7h3v1h-3zM5 8h1v1h-1z\"></path></svg></blip-sprite><blip-sprite name=\"heart\" aria-hidden=\"true\"><svg class=\"blip-sprite\" data-sprite=\"heart\" viewBox=\"0 0 11 10\" width=\"22\" height=\"20\" style=\"--_w:11;--_h:10\" shape-rendering=\"crispEdges\" focusable=\"false\" aria-hidden=\"true\"><path fill=\"var(--blip-ink)\" d=\"M1 0h3v1h-3zM7 0h3v1h-3zM0 1h1v1h-1zM4 1h1v1h-1zM6 1h1v1h-1zM10 1h1v1h-1zM0 2h1v1h-1zM5 2h1v1h-1zM10 2h1v1h-1zM0 3h1v1h-1zM10 3h1v1h-1zM0 4h1v1h-1zM10 4h1v1h-1zM1 5h1v1h-1zM9 5h1v1h-1zM2 6h1v1h-1zM8 6h1v1h-1zM3 7h1v1h-1zM7 7h1v1h-1zM4 8h1v1h-1zM6 8h1v1h-1zM5 9h1v1h-1z\"></path><path fill=\"var(--blip-sprite-light, var(--blip-candy-red-light))\" d=\"M1 1h1v1h-1zM3 1h1v1h-1zM7 1h2v1h-2zM2 2h1v1h-1zM1 3h1v1h-1z\"></path><path fill=\"var(--blip-white)\" d=\"M2 1h1v1h-1zM1 2h1v1h-1z\"></path><path fill=\"var(--blip-sprite-base, var(--blip-candy-red))\" d=\"M9 1h1v1h-1zM3 2h2v1h-2zM6 2h3v1h-3zM2 3h7v1h-7zM1 4h8v1h-8zM2 5h6v1h-6zM3 6h3v1h-3z\"></path><path fill=\"var(--blip-sprite-shade, var(--blip-candy-red-shade))\" d=\"M9 2h1v1h-1zM9 3h1v1h-1zM9 4h1v1h-1zM8 5h1v1h-1zM6 6h2v1h-2zM4 7h3v1h-3zM5 8h1v1h-1z\"></path></svg></blip-sprite><blip-sprite name=\"heart\" aria-hidden=\"true\"><svg class=\"blip-sprite\" data-sprite=\"heart\" viewBox=\"0 0 11 10\" width=\"22\" height=\"20\" style=\"--_w:11;--_h:10\" shape-rendering=\"crispEdges\" focusable=\"false\" aria-hidden=\"true\"><path fill=\"var(--blip-ink)\" d=\"M1 0h3v1h-3zM7 0h3v1h-3zM0 1h1v1h-1zM4 1h1v1h-1zM6 1h1v1h-1zM10 1h1v1h-1zM0 2h1v1h-1zM5 2h1v1h-1zM10 2h1v1h-1zM0 3h1v1h-1zM10 3h1v1h-1zM0 4h1v1h-1zM10 4h1v1h-1zM1 5h1v1h-1zM9 5h1v1h-1zM2 6h1v1h-1zM8 6h1v1h-1zM3 7h1v1h-1zM7 7h1v1h-1zM4 8h1v1h-1zM6 8h1v1h-1zM5 9h1v1h-1z\"></path><path fill=\"var(--blip-sprite-light, var(--blip-candy-red-light))\" d=\"M1 1h1v1h-1zM3 1h1v1h-1zM7 1h2v1h-2zM2 2h1v1h-1zM1 3h1v1h-1z\"></path><path fill=\"var(--blip-white)\" d=\"M2 1h1v1h-1zM1 2h1v1h-1z\"></path><path fill=\"var(--blip-sprite-base, var(--blip-candy-red))\" d=\"M9 1h1v1h-1zM3 2h2v1h-2zM6 2h3v1h-3zM2 3h7v1h-7zM1 4h8v1h-8zM2 5h6v1h-6zM3 6h3v1h-3z\"></path><path fill=\"var(--blip-sprite-shade, var(--blip-candy-red-shade))\" d=\"M9 2h1v1h-1zM9 3h1v1h-1zM9 4h1v1h-1zM8 5h1v1h-1zM6 6h2v1h-2zM4 7h3v1h-3zM5 8h1v1h-1z\"></path></svg></blip-sprite><blip-sprite name=\"heart-half\" aria-hidden=\"true\"><svg class=\"blip-sprite\" data-sprite=\"heart-half\" viewBox=\"0 0 11 10\" width=\"22\" height=\"20\" style=\"--_w:11;--_h:10\" shape-rendering=\"crispEdges\" focusable=\"false\" aria-hidden=\"true\"><path fill=\"var(--blip-ink)\" d=\"M1 0h3v1h-3zM7 0h3v1h-3zM0 1h1v1h-1zM4 1h1v1h-1zM6 1h1v1h-1zM10 1h1v1h-1zM0 2h1v1h-1zM5 2h1v1h-1zM10 2h1v1h-1zM0 3h1v1h-1zM10 3h1v1h-1zM0 4h1v1h-1zM10 4h1v1h-1zM1 5h1v1h-1zM9 5h1v1h-1zM2 6h1v1h-1zM8 6h1v1h-1zM3 7h1v1h-1zM7 7h1v1h-1zM4 8h1v1h-1zM6 8h1v1h-1zM5 9h1v1h-1z\"></path><path fill=\"var(--blip-sprite-light, var(--blip-candy-red-light))\" d=\"M1 1h1v1h-1zM3 1h1v1h-1zM2 2h1v1h-1zM1 3h1v1h-1z\"></path><path fill=\"var(--blip-white)\" d=\"M2 1h1v1h-1zM1 2h1v1h-1z\"></path><path fill=\"var(--blip-candy-slate-light)\" d=\"M7 1h2v1h-2z\"></path><path fill=\"var(--blip-candy-slate)\" d=\"M9 1h1v1h-1zM6 2h3v1h-3zM6 3h3v1h-3zM6 4h3v1h-3zM6 5h2v1h-2z\"></path><path fill=\"var(--blip-sprite-base, var(--blip-candy-red))\" d=\"M3 2h2v1h-2zM2 3h4v1h-4zM1 4h5v1h-5zM2 5h4v1h-4zM3 6h3v1h-3z\"></path><path fill=\"var(--blip-candy-slate-shade)\" d=\"M9 2h1v1h-1zM9 3h1v1h-1zM9 4h1v1h-1zM8 5h1v1h-1zM6 6h2v1h-2zM6 7h1v1h-1z\"></path><path fill=\"var(--blip-sprite-shade, var(--blip-candy-red-shade))\" d=\"M4 7h2v1h-2zM5 8h1v1h-1z\"></path></svg></blip-sprite><blip-sprite name=\"heart-empty\" aria-hidden=\"true\"><svg class=\"blip-sprite\" data-sprite=\"heart-empty\" viewBox=\"0 0 11 10\" width=\"22\" height=\"20\" style=\"--_w:11;--_h:10\" shape-rendering=\"crispEdges\" focusable=\"false\" aria-hidden=\"true\"><path fill=\"var(--blip-ink)\" d=\"M1 0h3v1h-3zM7 0h3v1h-3zM0 1h1v1h-1zM4 1h1v1h-1zM6 1h1v1h-1zM10 1h1v1h-1zM0 2h1v1h-1zM5 2h1v1h-1zM10 2h1v1h-1zM0 3h1v1h-1zM10 3h1v1h-1zM0 4h1v1h-1zM10 4h1v1h-1zM1 5h1v1h-1zM9 5h1v1h-1zM2 6h1v1h-1zM8 6h1v1h-1zM3 7h1v1h-1zM7 7h1v1h-1zM4 8h1v1h-1zM6 8h1v1h-1zM5 9h1v1h-1z\"></path><path fill=\"var(--blip-candy-slate-light)\" d=\"M1 1h3v1h-3zM7 1h2v1h-2zM1 2h2v1h-2zM1 3h1v1h-1z\"></path><path fill=\"var(--blip-candy-slate)\" d=\"M9 1h1v1h-1zM3 2h2v1h-2zM6 2h3v1h-3zM2 3h7v1h-7zM1 4h8v1h-8zM2 5h6v1h-6zM3 6h3v1h-3z\"></path><path fill=\"var(--blip-candy-slate-shade)\" d=\"M9 2h1v1h-1zM9 3h1v1h-1zM9 4h1v1h-1zM8 5h1v1h-1zM6 6h2v1h-2zM4 7h3v1h-3zM5 8h1v1h-1z\"></path></svg></blip-sprite><span class=\"blip-sr-only\" aria-live=\"polite\">Health 3.5/5</span><span class=\"blip-sr-only\" aria-live=\"polite\">Health 3.5/5</span></blip-hearts> <div class=\"blip-hud-stat\"> <span class=\"blip-hud-label blip-display blip-pop\" data-scale=\"1\" aria-hidden=\"true\">MP</span> <div class=\"blip-box blip-hud-bar\" data-tone=\"blue\" role=\"meter\" aria-label=\"Magic\" aria-valuemin=\"0\" aria-valuemax=\"8\" aria-valuenow=\"5\" style=\"--blip-hud-value:5;--blip-hud-max:8;--blip-hud-segments:8\"><span class=\"blip-hud-bar-fill\"></span></div> </div> </div>"
 },
 {
  "pkg": "components",
  "slug": "segmented",
  "name": "Segmented control",
  "w": 200,
  "h": 20,
  "html": "<blip-segmented class=\"blip-box blip-segmented\" data-width=\"full\" value=\"weekly\" aria-label=\"Leaderboard\" style=\"inline-size:min(100%,calc(200*var(--blip-pixel)))\" role=\"radiogroup\"> <button class=\"blip-box\" type=\"button\" value=\"daily\" role=\"radio\" aria-checked=\"false\" tabindex=\"-1\">Today</button> <button class=\"blip-box\" type=\"button\" value=\"weekly\" aria-checked=\"true\" role=\"radio\" tabindex=\"0\">This week</button> <button class=\"blip-box\" type=\"button\" value=\"ever\" role=\"radio\" aria-checked=\"false\" tabindex=\"-1\">All time</button> </blip-segmented>"
 },
 {
  "pkg": "components",
  "slug": "avatar",
  "name": "Avatar",
  "w": 38,
  "h": 38,
  "html": "<span class=\"blip-box blip-avatar\" data-size=\"xl\" data-tone=\"pink\"><svg viewBox=\"0 0 8 8\" role=\"img\" aria-label=\"Pip Bloom\"><path style=\"fill:var(--blip-candy-pink-light)\" d=\"M0 0h8v8H0z\"></path><path style=\"fill:var(--blip-candy-purple)\" d=\"M1 0h6v1H1zM0 1h8v1H0zM0 2h1v2H0zM7 2h1v2H7z\"></path><path style=\"fill:var(--blip-world-day-dirt-pebble)\" d=\"M1 2h6v1H1zM1 3h1v1H1zM3 3h2v1H3zM6 3h1v1H6zM1 4h6v1H1zM1 5h2v1H1zM5 5h2v1H5z\"></path><path style=\"fill:var(--blip-ink)\" d=\"M2 3h1v1H2zM5 3h1v1H5z\"></path><path style=\"fill:var(--blip-candy-red-light)\" d=\"M3 5h2v1H3z\"></path><path style=\"fill:var(--blip-candy-teal)\" d=\"M1 6h6v1H1zM0 7h8v1H0z\"></path></svg><span class=\"blip-box blip-avatar-status\" data-tone=\"success\" role=\"img\" aria-label=\"Online\"></span></span>"
 },
 {
  "pkg": "components",
  "slug": "toast",
  "name": "Toast",
  "w": 132,
  "h": 26,
  "html": "<div class=\"blip-box blip-toast\" data-tone=\"success\" role=\"group\" aria-label=\"Achievement unlocked\" style=\"inline-size: calc(130 * var(--blip-pixel));\"> <span class=\"blip-toast-icon\" aria-hidden=\"true\"></span> <div class=\"blip-toast-body\"> <p class=\"blip-toast-title\">Achievement unlocked</p> </div> <button class=\"blip-box blip-button blip-toast-close\" type=\"button\" data-variant=\"ghost\" data-size=\"sm\" data-icon-only=\"\" aria-label=\"Dismiss\"><span class=\"blip-icon\" data-glyph=\"close\" aria-hidden=\"true\"></span></button> <span class=\"blip-toast-timer\" style=\"--_blip-toast-left:6\" aria-hidden=\"true\"></span> </div>"
 },
 {
  "pkg": "components",
  "slug": "keycap",
  "name": "Keycap",
  "w": 32,
  "h": 16,
  "html": "<kbd class=\"blip-box blip-keycap\" data-size=\"lg\">Enter</kbd>"
 },
 {
  "pkg": "components",
  "slug": "progress",
  "name": "Progress",
  "w": 136,
  "h": 12,
  "html": "<div class=\"blip-box blip-progress\" data-size=\"lg\" data-tone=\"pink\"><progress max=\"100\" value=\"40\" aria-label=\"Large, 40%\"></progress></div>"
 },
 {
  "pkg": "game",
  "slug": "achievement",
  "name": "Achievement",
  "w": 183,
  "h": 37,
  "html": "<div class=\"blip-box blip-achievement\" data-tone=\"purple\"> <span class=\"blip-box blip-achievement-icon\"><blip-sprite name=\"gem\" aria-hidden=\"true\"><svg class=\"blip-sprite\" data-sprite=\"gem\" viewBox=\"0 0 11 10\" width=\"22\" height=\"20\" style=\"--_w:11;--_h:10\" shape-rendering=\"crispEdges\" focusable=\"false\" aria-hidden=\"true\"><path fill=\"var(--blip-ink)\" d=\"M3 0h5v1h-5zM2 1h1v1h-1zM8 1h2v1h-2zM1 2h1v1h-1zM10 2h1v1h-1zM0 3h1v1h-1zM10 3h1v1h-1zM0 4h1v1h-1zM10 4h1v1h-1zM1 5h1v1h-1zM9 5h1v1h-1zM2 6h1v1h-1zM8 6h1v1h-1zM3 7h1v1h-1zM7 7h1v1h-1zM4 8h1v1h-1zM6 8h1v1h-1zM5 9h1v1h-1z\"></path><path fill=\"var(--blip-white)\" d=\"M3 1h1v1h-1zM2 2h1v1h-1z\"></path><path fill=\"var(--blip-sprite-light, var(--blip-candy-purple-light))\" d=\"M4 1h3v1h-3zM3 2h3v1h-3zM1 3h4v1h-4zM1 4h1v1h-1zM2 5h1v1h-1zM3 6h1v1h-1zM4 7h1v1h-1z\"></path><path fill=\"var(--blip-sprite-base, var(--blip-candy-purple))\" d=\"M7 1h1v1h-1zM6 2h3v1h-3zM5 3h4v1h-4zM2 4h3v1h-3zM9 4h1v1h-1zM3 5h2v1h-2zM4 6h1v1h-1zM5 7h1v1h-1z\"></path><path fill=\"var(--blip-sprite-shade, var(--blip-candy-purple-shade))\" d=\"M9 2h1v1h-1zM9 3h1v1h-1zM5 4h4v1h-4zM5 5h4v1h-4zM5 6h3v1h-3zM6 7h1v1h-1zM5 8h1v1h-1z\"></path></svg></blip-sprite><span class=\"blip-achievement-sparkles\"></span></span> <p class=\"blip-achievement-label\">Achievement unlocked</p> <p class=\"blip-achievement-title\">Gem hoarder</p> </div>"
 },
 {
  "pkg": "components",
  "slug": "checkbox",
  "name": "Checkbox",
  "w": 15,
  "h": 15,
  "html": "<span class=\"blip-box blip-checkbox\"><input type=\"checkbox\" checked=\"\"></span>"
 },
 {
  "pkg": "components",
  "slug": "tabs",
  "name": "Tabs",
  "w": 158,
  "h": 27,
  "html": "<div class=\"blip-tabs\" data-variant=\"outline\"><div class=\"blip-tabs-list\" role=\"tablist\" aria-label=\"Settings\"> <button class=\"blip-box blip-tab\" data-variant=\"outline\" role=\"tab\" aria-selected=\"true\" tabindex=\"0\" id=\"blip-tabs-1-tab-0\" aria-controls=\"blip-tabs-1-panel-1\">General</button> <button class=\"blip-box blip-tab\" data-variant=\"outline\" role=\"tab\" aria-selected=\"false\" tabindex=\"-1\" id=\"blip-tabs-1-tab-2\" aria-controls=\"blip-tabs-1-panel-3\">Sound</button> <button class=\"blip-box blip-tab\" data-variant=\"outline\" role=\"tab\" aria-selected=\"false\" tabindex=\"-1\" id=\"blip-tabs-1-tab-4\" aria-controls=\"blip-tabs-1-panel-5\">Display</button> </div></div>"
 },
 {
  "pkg": "components",
  "slug": "badge",
  "name": "Badge",
  "w": 30,
  "h": 10,
  "html": "<span class=\"blip-box blip-badge\" data-tone=\"success\">New</span>"
 },
 {
  "pkg": "effects",
  "slug": "glint",
  "name": "Glint",
  "w": 68,
  "h": 24,
  "html": "<span class=\"blip-glint\" aria-hidden=\"true\" style=\"--blip-glint-delay:800ms\"></span>"
 },
 {
  "pkg": "components",
  "slug": "slider",
  "name": "Slider",
  "w": 110,
  "h": 24,
  "html": "<div class=\"blip-slider-group\" style=\"inline-size: calc(110 * var(--blip-pixel));\"> <input class=\"blip-slider\" id=\"sl-music\" name=\"music\" type=\"range\" min=\"0\" max=\"10\" value=\"7\" list=\"sl-music-ticks\" style=\"--blip-slider-value: 0.7;\"> <output class=\"blip-box blip-slider-value\" data-variant=\"panel\" for=\"sl-music\" aria-hidden=\"true\">7</output> <datalist class=\"blip-slider-ticks\" id=\"sl-music-ticks\"><option value=\"0\">0</option><option value=\"1\"></option><option value=\"2\"></option><option value=\"3\"></option><option value=\"4\"></option><option value=\"5\">5</option><option value=\"6\"></option><option value=\"7\"></option><option value=\"8\"></option><option value=\"9\"></option><option value=\"10\">10</option></datalist> </div>"
 },
 {
  "pkg": "components",
  "slug": "loader",
  "name": "Loader",
  "w": 62,
  "h": 39,
  "html": "<span class=\"blip-loader\" data-size=\"lg\" role=\"status\" style=\"flex-direction:column\">Loading level 3-2</span>"
 },
 {
  "pkg": "game",
  "slug": "tally",
  "name": "Tally",
  "w": 186,
  "h": 31,
  "html": "<blip-tally class=\"blip-tally\" stars=\"2\" max=\"3\" best=\"\" style=\"display: flex; align-items: center; gap: calc(8 * var(--blip-pixel));\"><p class=\"blip-tally-stars\" role=\"img\" aria-label=\"2 of 3 stars\"><blip-sprite name=\"star\"><svg class=\"blip-sprite\" data-sprite=\"star\" viewBox=\"0 0 13 12\" width=\"26\" height=\"24\" style=\"--_w:13;--_h:12\" shape-rendering=\"crispEdges\" focusable=\"false\" aria-hidden=\"true\"><path fill=\"var(--blip-ink)\" d=\"M6 0h1v1h-1zM5 1h1v1h-1zM7 1h1v1h-1zM4 2h1v1h-1zM8 2h1v1h-1zM1 3h4v1h-4zM8 3h4v1h-4zM0 4h1v1h-1zM12 4h1v1h-1zM1 5h1v1h-1zM11 5h1v1h-1zM2 6h1v1h-1zM10 6h1v1h-1zM3 7h1v1h-1zM9 7h1v1h-1zM2 8h1v1h-1zM10 8h1v1h-1zM2 9h1v1h-1zM6 9h1v1h-1zM10 9h1v1h-1zM1 10h1v1h-1zM4 10h2v1h-2zM7 10h2v1h-2zM11 10h1v1h-1zM2 11h2v1h-2zM9 11h2v1h-2z\"></path><path fill=\"var(--blip-sprite-light, var(--blip-candy-yellow-light))\" d=\"M6 1h1v1h-1zM5 2h1v1h-1zM7 2h1v1h-1zM5 3h2v1h-2zM1 4h5v1h-5zM2 5h2v1h-2zM3 6h1v1h-1z\"></path><path fill=\"var(--blip-white)\" d=\"M6 2h1v1h-1z\"></path><path fill=\"var(--blip-sprite-base, var(--blip-candy-yellow))\" d=\"M7 3h1v1h-1zM6 4h5v1h-5zM4 5h5v1h-5zM4 6h5v1h-5zM4 7h4v1h-4zM3 8h4v1h-4zM3 9h2v1h-2zM2 10h1v1h-1z\"></path><path fill=\"var(--blip-sprite-shade, var(--blip-candy-yellow-shade))\" d=\"M11 4h1v1h-1zM9 5h2v1h-2zM9 6h1v1h-1zM8 7h1v1h-1zM7 8h3v1h-3zM5 9h1v1h-1zM7 9h3v1h-3zM3 10h1v1h-1zM9 10h2v1h-2z\"></path></svg></blip-sprite><blip-sprite name=\"star\"><svg class=\"blip-sprite\" data-sprite=\"star\" viewBox=\"0 0 13 12\" width=\"26\" height=\"24\" style=\"--_w:13;--_h:12\" shape-rendering=\"crispEdges\" focusable=\"false\" aria-hidden=\"true\"><path fill=\"var(--blip-ink)\" d=\"M6 0h1v1h-1zM5 1h1v1h-1zM7 1h1v1h-1zM4 2h1v1h-1zM8 2h1v1h-1zM1 3h4v1h-4zM8 3h4v1h-4zM0 4h1v1h-1zM12 4h1v1h-1zM1 5h1v1h-1zM11 5h1v1h-1zM2 6h1v1h-1zM10 6h1v1h-1zM3 7h1v1h-1zM9 7h1v1h-1zM2 8h1v1h-1zM10 8h1v1h-1zM2 9h1v1h-1zM6 9h1v1h-1zM10 9h1v1h-1zM1 10h1v1h-1zM4 10h2v1h-2zM7 10h2v1h-2zM11 10h1v1h-1zM2 11h2v1h-2zM9 11h2v1h-2z\"></path><path fill=\"var(--blip-sprite-light, var(--blip-candy-yellow-light))\" d=\"M6 1h1v1h-1zM5 2h1v1h-1zM7 2h1v1h-1zM5 3h2v1h-2zM1 4h5v1h-5zM2 5h2v1h-2zM3 6h1v1h-1z\"></path><path fill=\"var(--blip-white)\" d=\"M6 2h1v1h-1z\"></path><path fill=\"var(--blip-sprite-base, var(--blip-candy-yellow))\" d=\"M7 3h1v1h-1zM6 4h5v1h-5zM4 5h5v1h-5zM4 6h5v1h-5zM4 7h4v1h-4zM3 8h4v1h-4zM3 9h2v1h-2zM2 10h1v1h-1z\"></path><path fill=\"var(--blip-sprite-shade, var(--blip-candy-yellow-shade))\" d=\"M11 4h1v1h-1zM9 5h2v1h-2zM9 6h1v1h-1zM8 7h1v1h-1zM7 8h3v1h-3zM5 9h1v1h-1zM7 9h3v1h-3zM3 10h1v1h-1zM9 10h2v1h-2z\"></path></svg></blip-sprite><blip-sprite name=\"star-empty\"><svg class=\"blip-sprite\" data-sprite=\"star-empty\" viewBox=\"0 0 13 12\" width=\"26\" height=\"24\" style=\"--_w:13;--_h:12\" shape-rendering=\"crispEdges\" focusable=\"false\" aria-hidden=\"true\"><path fill=\"var(--blip-ink)\" d=\"M6 0h1v1h-1zM5 1h1v1h-1zM7 1h1v1h-1zM4 2h1v1h-1zM8 2h1v1h-1zM1 3h4v1h-4zM8 3h4v1h-4zM0 4h1v1h-1zM12 4h1v1h-1zM1 5h1v1h-1zM11 5h1v1h-1zM2 6h1v1h-1zM10 6h1v1h-1zM3 7h1v1h-1zM9 7h1v1h-1zM2 8h1v1h-1zM10 8h1v1h-1zM2 9h1v1h-1zM6 9h1v1h-1zM10 9h1v1h-1zM1 10h1v1h-1zM4 10h2v1h-2zM7 10h2v1h-2zM11 10h1v1h-1zM2 11h2v1h-2zM9 11h2v1h-2z\"></path><path fill=\"var(--blip-candy-slate-light)\" d=\"M6 1h1v1h-1zM5 2h3v1h-3zM5 3h2v1h-2zM1 4h5v1h-5zM2 5h2v1h-2zM3 6h1v1h-1z\"></path><path fill=\"var(--blip-candy-slate)\" d=\"M7 3h1v1h-1zM6 4h5v1h-5zM4 5h5v1h-5zM4 6h5v1h-5zM4 7h4v1h-4zM3 8h4v1h-4zM3 9h2v1h-2zM2 10h1v1h-1z\"></path><path fill=\"var(--blip-candy-slate-shade)\" d=\"M11 4h1v1h-1zM9 5h2v1h-2zM9 6h1v1h-1zM8 7h1v1h-1zM7 8h3v1h-3zM5 9h1v1h-1zM7 9h3v1h-3zM3 10h1v1h-1zM9 10h2v1h-2z\"></path></svg></blip-sprite></p> <dl class=\"blip-tally-rows\"> <div class=\"blip-tally-row\" data-total=\"\"><dt>Score</dt><dd class=\"blip-tally-value blip-display blip-pop\" data-scale=\"2\" data-value=\"4600\" data-pop=\"4,600\">4,600</dd></div> </dl> <span class=\"blip-sr-only\" role=\"status\"></span><span class=\"blip-sr-only\" role=\"status\"></span></blip-tally>"
 },
 {
  "pkg": "components",
  "slug": "radio",
  "name": "Radio group",
  "w": 15,
  "h": 15,
  "html": "<span class=\"blip-box blip-radio\"><input type=\"radio\" name=\"ex-size3\" checked=\"\"></span>"
 },
 {
  "pkg": "components",
  "slug": "select",
  "name": "Select",
  "w": 100,
  "h": 20,
  "html": "<span class=\"blip-box blip-select\" style=\"inline-size: calc(100 * var(--blip-pixel));\"> <select id=\"sel-world\" name=\"world\"> <option class=\"blip-box\" value=\"meadow\">Meadow</option> <option class=\"blip-box\" value=\"caves\" selected=\"\">Crystal caves</option> <option class=\"blip-box\" value=\"sky\">Sky islands</option> <option class=\"blip-box\" value=\"night\">Night market</option> <option class=\"blip-box\" value=\"moon\" disabled=\"\">Moon base (locked)</option> </select> </span>"
 },
 {
  "pkg": "components",
  "slug": "tooltip",
  "name": "Tooltip",
  "w": 46,
  "h": 13,
  "html": "<span class=\"blip-box blip-tooltip\" role=\"tooltip\" data-side=\"left\" data-blip-static=\"\">Mute music<span class=\"blip-tooltip-nub\" aria-hidden=\"true\"></span></span>"
 },
 {
  "pkg": "game",
  "slug": "level",
  "name": "Level tile",
  "w": 46,
  "h": 44,
  "html": "<button type=\"button\" class=\"blip-box blip-level\" aria-label=\"Level 1, Sprout Steps: 3 of 3 stars\"> <span class=\"blip-level-number\">1</span> <span class=\"blip-level-stars\"><blip-sprite name=\"star\" aria-hidden=\"true\"><svg class=\"blip-sprite\" data-sprite=\"star\" viewBox=\"0 0 13 12\" width=\"26\" height=\"24\" style=\"--_w:13;--_h:12\" shape-rendering=\"crispEdges\" focusable=\"false\" aria-hidden=\"true\"><path fill=\"var(--blip-ink)\" d=\"M6 0h1v1h-1zM5 1h1v1h-1zM7 1h1v1h-1zM4 2h1v1h-1zM8 2h1v1h-1zM1 3h4v1h-4zM8 3h4v1h-4zM0 4h1v1h-1zM12 4h1v1h-1zM1 5h1v1h-1zM11 5h1v1h-1zM2 6h1v1h-1zM10 6h1v1h-1zM3 7h1v1h-1zM9 7h1v1h-1zM2 8h1v1h-1zM10 8h1v1h-1zM2 9h1v1h-1zM6 9h1v1h-1zM10 9h1v1h-1zM1 10h1v1h-1zM4 10h2v1h-2zM7 10h2v1h-2zM11 10h1v1h-1zM2 11h2v1h-2zM9 11h2v1h-2z\"></path><path fill=\"var(--blip-sprite-light, var(--blip-candy-yellow-light))\" d=\"M6 1h1v1h-1zM5 2h1v1h-1zM7 2h1v1h-1zM5 3h2v1h-2zM1 4h5v1h-5zM2 5h2v1h-2zM3 6h1v1h-1z\"></path><path fill=\"var(--blip-white)\" d=\"M6 2h1v1h-1z\"></path><path fill=\"var(--blip-sprite-base, var(--blip-candy-yellow))\" d=\"M7 3h1v1h-1zM6 4h5v1h-5zM4 5h5v1h-5zM4 6h5v1h-5zM4 7h4v1h-4zM3 8h4v1h-4zM3 9h2v1h-2zM2 10h1v1h-1z\"></path><path fill=\"var(--blip-sprite-shade, var(--blip-candy-yellow-shade))\" d=\"M11 4h1v1h-1zM9 5h2v1h-2zM9 6h1v1h-1zM8 7h1v1h-1zM7 8h3v1h-3zM5 9h1v1h-1zM7 9h3v1h-3zM3 10h1v1h-1zM9 10h2v1h-2z\"></path></svg></blip-sprite><blip-sprite name=\"star\" aria-hidden=\"true\"><svg class=\"blip-sprite\" data-sprite=\"star\" viewBox=\"0 0 13 12\" width=\"26\" height=\"24\" style=\"--_w:13;--_h:12\" shape-rendering=\"crispEdges\" focusable=\"false\" aria-hidden=\"true\"><path fill=\"var(--blip-ink)\" d=\"M6 0h1v1h-1zM5 1h1v1h-1zM7 1h1v1h-1zM4 2h1v1h-1zM8 2h1v1h-1zM1 3h4v1h-4zM8 3h4v1h-4zM0 4h1v1h-1zM12 4h1v1h-1zM1 5h1v1h-1zM11 5h1v1h-1zM2 6h1v1h-1zM10 6h1v1h-1zM3 7h1v1h-1zM9 7h1v1h-1zM2 8h1v1h-1zM10 8h1v1h-1zM2 9h1v1h-1zM6 9h1v1h-1zM10 9h1v1h-1zM1 10h1v1h-1zM4 10h2v1h-2zM7 10h2v1h-2zM11 10h1v1h-1zM2 11h2v1h-2zM9 11h2v1h-2z\"></path><path fill=\"var(--blip-sprite-light, var(--blip-candy-yellow-light))\" d=\"M6 1h1v1h-1zM5 2h1v1h-1zM7 2h1v1h-1zM5 3h2v1h-2zM1 4h5v1h-5zM2 5h2v1h-2zM3 6h1v1h-1z\"></path><path fill=\"var(--blip-white)\" d=\"M6 2h1v1h-1z\"></path><path fill=\"var(--blip-sprite-base, var(--blip-candy-yellow))\" d=\"M7 3h1v1h-1zM6 4h5v1h-5zM4 5h5v1h-5zM4 6h5v1h-5zM4 7h4v1h-4zM3 8h4v1h-4zM3 9h2v1h-2zM2 10h1v1h-1z\"></path><path fill=\"var(--blip-sprite-shade, var(--blip-candy-yellow-shade))\" d=\"M11 4h1v1h-1zM9 5h2v1h-2zM9 6h1v1h-1zM8 7h1v1h-1zM7 8h3v1h-3zM5 9h1v1h-1zM7 9h3v1h-3zM3 10h1v1h-1zM9 10h2v1h-2z\"></path></svg></blip-sprite><blip-sprite name=\"star\" aria-hidden=\"true\"><svg class=\"blip-sprite\" data-sprite=\"star\" viewBox=\"0 0 13 12\" width=\"26\" height=\"24\" style=\"--_w:13;--_h:12\" shape-rendering=\"crispEdges\" focusable=\"false\" aria-hidden=\"true\"><path fill=\"var(--blip-ink)\" d=\"M6 0h1v1h-1zM5 1h1v1h-1zM7 1h1v1h-1zM4 2h1v1h-1zM8 2h1v1h-1zM1 3h4v1h-4zM8 3h4v1h-4zM0 4h1v1h-1zM12 4h1v1h-1zM1 5h1v1h-1zM11 5h1v1h-1zM2 6h1v1h-1zM10 6h1v1h-1zM3 7h1v1h-1zM9 7h1v1h-1zM2 8h1v1h-1zM10 8h1v1h-1zM2 9h1v1h-1zM6 9h1v1h-1zM10 9h1v1h-1zM1 10h1v1h-1zM4 10h2v1h-2zM7 10h2v1h-2zM11 10h1v1h-1zM2 11h2v1h-2zM9 11h2v1h-2z\"></path><path fill=\"var(--blip-sprite-light, var(--blip-candy-yellow-light))\" d=\"M6 1h1v1h-1zM5 2h1v1h-1zM7 2h1v1h-1zM5 3h2v1h-2zM1 4h5v1h-5zM2 5h2v1h-2zM3 6h1v1h-1z\"></path><path fill=\"var(--blip-white)\" d=\"M6 2h1v1h-1z\"></path><path fill=\"var(--blip-sprite-base, var(--blip-candy-yellow))\" d=\"M7 3h1v1h-1zM6 4h5v1h-5zM4 5h5v1h-5zM4 6h5v1h-5zM4 7h4v1h-4zM3 8h4v1h-4zM3 9h2v1h-2zM2 10h1v1h-1z\"></path><path fill=\"var(--blip-sprite-shade, var(--blip-candy-yellow-shade))\" d=\"M11 4h1v1h-1zM9 5h2v1h-2zM9 6h1v1h-1zM8 7h1v1h-1zM7 8h3v1h-3zM5 9h1v1h-1zM7 9h3v1h-3zM3 10h1v1h-1zM9 10h2v1h-2z\"></path></svg></blip-sprite></span> </button>"
 },
 {
  "pkg": "components",
  "slug": "toggle",
  "name": "Toggle button",
  "w": 54,
  "h": 21,
  "html": "<button class=\"blip-box blip-button\" aria-pressed=\"true\">Show grid</button>"
 },
 {
  "pkg": "components",
  "slug": "stat",
  "name": "Stat",
  "w": 79,
  "h": 36,
  "html": "<div class=\"blip-stat\"> <dt class=\"blip-stat-label\">High score</dt> <dd class=\"blip-stat-value blip-display blip-pop\" data-scale=\"2\" data-pop=\"98,120\">98,120</dd> </div>"
 },
 {
  "pkg": "components",
  "slug": "breadcrumbs",
  "name": "Breadcrumbs",
  "w": 111,
  "h": 14,
  "html": "<nav class=\"blip-breadcrumbs\" aria-label=\"Breadcrumb\"> <ol class=\"blip-breadcrumbs-list\"> <li><a class=\"blip-box blip-breadcrumbs-link\" data-variant=\"ghost\" href=\"#home\">Home</a></li> <li><a class=\"blip-box blip-breadcrumbs-link\" data-variant=\"ghost\" href=\"#worlds\">Worlds</a></li> <li><a class=\"blip-box blip-breadcrumbs-link\" data-variant=\"ghost\" href=\"#level-2-3\" aria-current=\"page\">Level 2-3</a></li> </ol> </nav>"
 },
 {
  "pkg": "game",
  "slug": "inventory",
  "name": "Inventory",
  "w": 133,
  "h": 25,
  "html": "<blip-inventory class=\"blip-inventory\" aria-labelledby=\"bag-title\" style=\"--blip-inventory-columns: 5; inline-size: max-content;\" role=\"listbox\"> <button type=\"button\" class=\"blip-box blip-slot\" data-variant=\"soft\" aria-label=\"Red potion, 3\" role=\"option\" aria-selected=\"false\" tabindex=\"0\"><blip-sprite name=\"potion\" aria-hidden=\"true\"><svg class=\"blip-sprite\" data-sprite=\"potion\" viewBox=\"0 0 11 13\" width=\"22\" height=\"26\" style=\"--_w:11;--_h:13\" shape-rendering=\"crispEdges\" focusable=\"false\" aria-hidden=\"true\"><path fill=\"var(--blip-ink)\" d=\"M3 0h5v1h-5zM2 1h1v1h-1zM8 1h1v1h-1zM2 2h1v1h-1zM8 2h1v1h-1zM3 3h1v1h-1zM7 3h1v1h-1zM3 4h1v1h-1zM7 4h1v1h-1zM2 5h1v1h-1zM8 5h1v1h-1zM1 6h1v1h-1zM9 6h1v1h-1zM0 7h1v1h-1zM10 7h1v1h-1zM0 8h1v1h-1zM10 8h1v1h-1zM0 9h1v1h-1zM10 9h1v1h-1zM1 10h1v1h-1zM9 10h1v1h-1zM2 11h1v1h-1zM8 11h1v1h-1zM3 12h5v1h-5z\"></path><path fill=\"var(--blip-candy-orange-light)\" d=\"M3 1h1v1h-1z\"></path><path fill=\"var(--blip-candy-orange)\" d=\"M4 1h3v1h-3z\"></path><path fill=\"var(--blip-candy-orange-shade)\" d=\"M7 1h1v1h-1zM3 2h5v1h-5z\"></path><path fill=\"var(--blip-candy-cream)\" d=\"M4 3h1v1h-1zM6 3h1v1h-1zM4 4h1v1h-1zM6 4h1v1h-1z\"></path><path fill=\"var(--blip-white)\" d=\"M5 3h1v1h-1zM5 4h1v1h-1zM3 5h1v1h-1zM2 6h2v1h-2zM2 7h1v1h-1zM2 8h1v1h-1z\"></path><path fill=\"var(--blip-sprite-light, var(--blip-candy-red-light))\" d=\"M4 5h4v1h-4zM4 6h1v1h-1zM1 7h1v1h-1zM3 7h1v1h-1zM1 8h1v1h-1zM1 9h1v1h-1z\"></path><path fill=\"var(--blip-sprite-base, var(--blip-candy-red))\" d=\"M5 6h3v1h-3zM4 7h4v1h-4zM3 8h5v1h-5zM2 9h6v1h-6zM2 10h4v1h-4z\"></path><path fill=\"var(--blip-sprite-shade, var(--blip-candy-red-shade))\" d=\"M8 6h1v1h-1zM8 7h2v1h-2zM8 8h2v1h-2zM8 9h2v1h-2zM6 10h3v1h-3zM3 11h5v1h-5z\"></path></svg></blip-sprite><span class=\"blip-slot-count blip-display blip-pop\" data-scale=\"1\" aria-hidden=\"true\">3</span></button> <button type=\"button\" class=\"blip-box blip-slot\" data-variant=\"soft\" data-rarity=\"uncommon\" aria-label=\"Blue potion, uncommon\" role=\"option\" aria-selected=\"false\" tabindex=\"-1\"><blip-sprite name=\"potion\" data-tone=\"blue\" aria-hidden=\"true\"><svg class=\"blip-sprite\" data-sprite=\"potion\" viewBox=\"0 0 11 13\" width=\"22\" height=\"26\" style=\"--_w:11;--_h:13\" shape-rendering=\"crispEdges\" focusable=\"false\" aria-hidden=\"true\"><path fill=\"var(--blip-ink)\" d=\"M3 0h5v1h-5zM2 1h1v1h-1zM8 1h1v1h-1zM2 2h1v1h-1zM8 2h1v1h-1zM3 3h1v1h-1zM7 3h1v1h-1zM3 4h1v1h-1zM7 4h1v1h-1zM2 5h1v1h-1zM8 5h1v1h-1zM1 6h1v1h-1zM9 6h1v1h-1zM0 7h1v1h-1zM10 7h1v1h-1zM0 8h1v1h-1zM10 8h1v1h-1zM0 9h1v1h-1zM10 9h1v1h-1zM1 10h1v1h-1zM9 10h1v1h-1zM2 11h1v1h-1zM8 11h1v1h-1zM3 12h5v1h-5z\"></path><path fill=\"var(--blip-candy-orange-light)\" d=\"M3 1h1v1h-1z\"></path><path fill=\"var(--blip-candy-orange)\" d=\"M4 1h3v1h-3z\"></path><path fill=\"var(--blip-candy-orange-shade)\" d=\"M7 1h1v1h-1zM3 2h5v1h-5z\"></path><path fill=\"var(--blip-candy-cream)\" d=\"M4 3h1v1h-1zM6 3h1v1h-1zM4 4h1v1h-1zM6 4h1v1h-1z\"></path><path fill=\"var(--blip-white)\" d=\"M5 3h1v1h-1zM5 4h1v1h-1zM3 5h1v1h-1zM2 6h2v1h-2zM2 7h1v1h-1zM2 8h1v1h-1z\"></path><path fill=\"var(--blip-sprite-light, var(--blip-candy-red-light))\" d=\"M4 5h4v1h-4zM4 6h1v1h-1zM1 7h1v1h-1zM3 7h1v1h-1zM1 8h1v1h-1zM1 9h1v1h-1z\"></path><path fill=\"var(--blip-sprite-base, var(--blip-candy-red))\" d=\"M5 6h3v1h-3zM4 7h4v1h-4zM3 8h5v1h-5zM2 9h6v1h-6zM2 10h4v1h-4z\"></path><path fill=\"var(--blip-sprite-shade, var(--blip-candy-red-shade))\" d=\"M8 6h1v1h-1zM8 7h2v1h-2zM8 8h2v1h-2zM8 9h2v1h-2zM6 10h3v1h-3zM3 11h5v1h-5z\"></path></svg></blip-sprite></button> <button type=\"button\" class=\"blip-box blip-slot\" data-variant=\"soft\" data-rarity=\"rare\" aria-selected=\"true\" aria-label=\"Moon key, rare\" role=\"option\" tabindex=\"-1\"><blip-sprite name=\"key\" data-tone=\"blue\" aria-hidden=\"true\"><svg class=\"blip-sprite\" data-sprite=\"key\" viewBox=\"0 0 14 8\" width=\"28\" height=\"16\" style=\"--_w:14;--_h:8\" shape-rendering=\"crispEdges\" focusable=\"false\" aria-hidden=\"true\"><path fill=\"var(--blip-ink)\" d=\"M2 0h3v1h-3zM1 1h1v1h-1zM5 1h1v1h-1zM0 2h1v1h-1zM6 2h7v1h-7zM0 3h1v1h-1zM3 3h1v1h-1zM13 3h1v1h-1zM0 4h1v1h-1zM13 4h1v1h-1zM1 5h1v1h-1zM5 5h3v1h-3zM10 5h1v1h-1zM13 5h1v1h-1zM2 6h3v1h-3zM7 6h1v1h-1zM10 6h3v1h-3zM8 7h2v1h-2z\"></path><path fill=\"var(--blip-sprite-light, var(--blip-candy-orange-light))\" d=\"M2 1h3v1h-3zM1 2h1v1h-1zM5 2h1v1h-1zM1 3h1v1h-1zM5 3h8v1h-8zM1 4h1v1h-1z\"></path><path fill=\"var(--blip-white)\" d=\"M2 2h1v1h-1z\"></path><path fill=\"var(--blip-sprite-base, var(--blip-candy-orange))\" d=\"M3 2h2v1h-2zM2 3h1v1h-1zM4 3h1v1h-1zM2 4h10v1h-10z\"></path><path fill=\"var(--blip-sprite-shade, var(--blip-candy-orange-shade))\" d=\"M12 4h1v1h-1zM2 5h3v1h-3zM8 5h2v1h-2zM11 5h2v1h-2zM8 6h2v1h-2z\"></path></svg></blip-sprite></button> <button type=\"button\" class=\"blip-box blip-slot\" data-variant=\"soft\" data-rarity=\"epic\" data-blip-state=\"focus\" aria-label=\"Dusk gem, epic, 2\" role=\"option\" aria-selected=\"false\" tabindex=\"-1\"><blip-sprite name=\"gem\" aria-hidden=\"true\"><svg class=\"blip-sprite\" data-sprite=\"gem\" viewBox=\"0 0 11 10\" width=\"22\" height=\"20\" style=\"--_w:11;--_h:10\" shape-rendering=\"crispEdges\" focusable=\"false\" aria-hidden=\"true\"><path fill=\"var(--blip-ink)\" d=\"M3 0h5v1h-5zM2 1h1v1h-1zM8 1h2v1h-2zM1 2h1v1h-1zM10 2h1v1h-1zM0 3h1v1h-1zM10 3h1v1h-1zM0 4h1v1h-1zM10 4h1v1h-1zM1 5h1v1h-1zM9 5h1v1h-1zM2 6h1v1h-1zM8 6h1v1h-1zM3 7h1v1h-1zM7 7h1v1h-1zM4 8h1v1h-1zM6 8h1v1h-1zM5 9h1v1h-1z\"></path><path fill=\"var(--blip-white)\" d=\"M3 1h1v1h-1zM2 2h1v1h-1z\"></path><path fill=\"var(--blip-sprite-light, var(--blip-candy-purple-light))\" d=\"M4 1h3v1h-3zM3 2h3v1h-3zM1 3h4v1h-4zM1 4h1v1h-1zM2 5h1v1h-1zM3 6h1v1h-1zM4 7h1v1h-1z\"></path><path fill=\"var(--blip-sprite-base, var(--blip-candy-purple))\" d=\"M7 1h1v1h-1zM6 2h3v1h-3zM5 3h4v1h-4zM2 4h3v1h-3zM9 4h1v1h-1zM3 5h2v1h-2zM4 6h1v1h-1zM5 7h1v1h-1z\"></path><path fill=\"var(--blip-sprite-shade, var(--blip-candy-purple-shade))\" d=\"M9 2h1v1h-1zM9 3h1v1h-1zM5 4h4v1h-4zM5 5h4v1h-4zM5 6h3v1h-3zM6 7h1v1h-1zM5 8h1v1h-1z\"></path></svg></blip-sprite><span class=\"blip-slot-count blip-display blip-pop\" data-scale=\"1\" aria-hidden=\"true\">2</span></button> <button type=\"button\" class=\"blip-box blip-slot\" data-variant=\"soft\" aria-label=\"Coins, 99\" role=\"option\" aria-selected=\"false\" tabindex=\"-1\"><blip-sprite name=\"coin\" aria-hidden=\"true\"><svg class=\"blip-sprite\" data-sprite=\"coin\" viewBox=\"0 0 8 10\" width=\"16\" height=\"20\" style=\"--_w:8;--_h:10\" shape-rendering=\"crispEdges\" focusable=\"false\" aria-hidden=\"true\"><path fill=\"var(--blip-ink)\" d=\"M2 0h4v1h-4zM1 1h1v1h-1zM6 1h1v1h-1zM0 2h1v1h-1zM7 2h1v1h-1zM0 3h1v1h-1zM7 3h1v1h-1zM0 4h1v1h-1zM7 4h1v1h-1zM0 5h1v1h-1zM7 5h1v1h-1zM0 6h1v1h-1zM7 6h1v1h-1zM0 7h1v1h-1zM7 7h1v1h-1zM1 8h1v1h-1zM6 8h1v1h-1zM2 9h4v1h-4z\"></path><path fill=\"var(--blip-candy-yellow-light)\" d=\"M2 1h4v1h-4zM1 2h1v1h-1zM1 3h1v1h-1zM1 4h1v1h-1zM1 5h1v1h-1z\"></path><path fill=\"var(--blip-white)\" d=\"M2 2h1v1h-1zM2 3h1v1h-1zM2 4h1v1h-1z\"></path><path fill=\"var(--blip-candy-yellow)\" d=\"M3 2h4v1h-4zM3 3h2v1h-2zM6 3h1v1h-1zM3 4h2v1h-2zM6 4h1v1h-1zM2 5h3v1h-3zM6 5h1v1h-1zM1 6h4v1h-4zM6 6h1v1h-1zM1 7h5v1h-5z\"></path><path fill=\"var(--blip-candy-yellow-shade)\" d=\"M5 3h1v1h-1zM5 4h1v1h-1zM5 5h1v1h-1zM5 6h1v1h-1zM6 7h1v1h-1zM2 8h4v1h-4z\"></path></svg></blip-sprite><span class=\"blip-slot-count blip-display blip-pop\" data-scale=\"1\" aria-hidden=\"true\">99</span></button> </blip-inventory>"
 },
 {
  "pkg": "components",
  "slug": "alert",
  "name": "Alert",
  "w": 131,
  "h": 36,
  "html": "<div class=\"blip-box blip-alert\" data-tone=\"danger\" style=\"inline-size: calc(130 * var(--blip-pixel));\"> <span class=\"blip-alert-icon\" aria-hidden=\"true\"></span> <div class=\"blip-alert-body\"> <p class=\"blip-alert-title\"><span class=\"blip-sr-only\">Error: </span>Can't reach the save server</p> </div> <button class=\"blip-box blip-button blip-alert-close\" type=\"button\" data-variant=\"ghost\" data-size=\"sm\" data-icon-only=\"\" aria-label=\"Dismiss\"><span class=\"blip-icon\" data-glyph=\"close\" aria-hidden=\"true\"></span></button> </div>"
 },
 {
  "pkg": "components",
  "slug": "number",
  "name": "Number stepper",
  "w": 62,
  "h": 24,
  "html": "<blip-number class=\"blip-number\"><span class=\"blip-box blip-input\" data-size=\"lg\"><button type=\"button\" class=\"blip-box blip-number-step\" data-variant=\"ghost\" data-step=\"down\" tabindex=\"-1\" aria-label=\"Decrease\"><span></span></button><input type=\"number\" value=\"3\" min=\"0\" aria-label=\"Large\"><button type=\"button\" class=\"blip-box blip-number-step\" data-variant=\"ghost\" data-step=\"up\" tabindex=\"-1\" aria-label=\"Increase\"><span></span></button></span></blip-number>"
 },
 {
  "pkg": "components",
  "slug": "fab",
  "name": "Action button",
  "w": 79,
  "h": 24,
  "html": "<button class=\"blip-box blip-fab\" type=\"button\" data-position=\"static\"><svg class=\"blip-icon\" viewBox=\"0 0 12 12\" aria-hidden=\"true\"><path d=\"M5 2h2v3h3v2H7v3H5V7H2V5h3z\"></path></svg>New level</button>"
 },
 {
  "pkg": "effects",
  "slug": "drop-text",
  "name": "Drop text",
  "w": 201,
  "h": 27,
  "html": "<blip-drop-text class=\"blip-display blip-pop\" data-scale=\"2\" data-tone=\"purple\" data-pop=\"Level complete!\"><span class=\"blip-sr-only\">Level complete!</span><span aria-hidden=\"true\"><span class=\"blip-drop-text-word\"><span class=\"blip-drop-text-letter\" data-pop=\"L\" style=\"--_i: 0;\">L</span><span class=\"blip-drop-text-letter\" data-pop=\"e\" style=\"--_i: 1;\">e</span><span class=\"blip-drop-text-letter\" data-pop=\"v\" style=\"--_i: 2;\">v</span><span class=\"blip-drop-text-letter\" data-pop=\"e\" style=\"--_i: 3;\">e</span><span class=\"blip-drop-text-letter\" data-pop=\"l\" style=\"--_i: 4;\">l</span></span> <span class=\"blip-drop-text-word\"><span class=\"blip-drop-text-letter\" data-pop=\"c\" style=\"--_i: 6;\">c</span><span class=\"blip-drop-text-letter\" data-pop=\"o\" style=\"--_i: 7;\">o</span><span class=\"blip-drop-text-letter\" data-pop=\"m\" style=\"--_i: 8;\">m</span><span class=\"blip-drop-text-letter\" data-pop=\"p\" style=\"--_i: 9;\">p</span><span class=\"blip-drop-text-letter\" data-pop=\"l\" style=\"--_i: 10;\">l</span><span class=\"blip-drop-text-letter\" data-pop=\"e\" style=\"--_i: 11;\">e</span><span class=\"blip-drop-text-letter\" data-pop=\"t\" style=\"--_i: 12;\">t</span><span class=\"blip-drop-text-letter\" data-pop=\"e\" style=\"--_i: 13;\">e</span><span class=\"blip-drop-text-letter\" data-pop=\"!\" style=\"--_i: 14;\">!</span></span></span></blip-drop-text>"
 },
 {
  "pkg": "components",
  "slug": "search",
  "name": "Search",
  "w": 122,
  "h": 21,
  "html": "<search style=\"display:block;max-inline-size:calc(160*var(--blip-pixel))\"> <form method=\"dialog\"> <label class=\"blip-sr-only\" for=\"se-levels\">Search levels</label> <span class=\"blip-box blip-input\"> <svg class=\"blip-icon\" viewBox=\"0 0 12 12\" aria-hidden=\"true\"><path d=\"M3 1h4v1h1v1h1v5h1v1h1v2H8v-1H7V9H3V8H2V7H1V3h1V2h1zm1 2v1H3v2h1v1h2V6h1V4H6V3z\"></path></svg> <input id=\"se-levels\" name=\"q\" type=\"search\" value=\"ghost house\" placeholder=\"Search levels\" enterkeyhint=\"search\"> </span> </form> </search>"
 },
 {
  "pkg": "components",
  "slug": "button-group",
  "name": "Button group",
  "w": 54,
  "h": 21,
  "html": "<div class=\"blip-button-group\" data-attached=\"\" role=\"group\" aria-label=\"Play\"> <button class=\"blip-box blip-button\">Play</button> <button class=\"blip-box blip-button\" data-icon-only=\"\" aria-label=\"More ways to play\"><svg class=\"blip-icon\" viewBox=\"0 0 12 12\" aria-hidden=\"true\"><path d=\"M2 4h8v1H9v1H8v1H7v1H5V7H4V6H3V5H2z\"></path></svg></button> </div>"
 },
 {
  "pkg": "game",
  "slug": "prompt",
  "name": "Prompts",
  "w": 96,
  "h": 17,
  "html": "<p class=\"blip-prompt\"><kbd class=\"blip-box blip-prompt-key\">Esc</kbd> Pause <kbd class=\"blip-box blip-prompt-button\" data-button=\"b\">B</kbd> Back</p>"
 },
 {
  "pkg": "components",
  "slug": "link",
  "name": "Link",
  "w": 67,
  "h": 10,
  "html": "<a class=\"blip-link\" href=\"https://example.com/wiki\" target=\"_blank\" rel=\"noopener\" data-external=\"opens in a new tab\">community wiki</a>"
 },
 {
  "pkg": "components",
  "slug": "progress-steps",
  "name": "Progress steps",
  "w": 140,
  "h": 26,
  "html": "<div class=\"blip-progress-steps\"> <ol class=\"blip-progress-steps-list\" aria-label=\"Checkout\"> <li class=\"blip-progress-steps-item\" data-state=\"done\"><span class=\"blip-box blip-progress-steps-marker\">1</span><span class=\"blip-progress-steps-label\">Basket<span class=\"blip-sr-only\">, done</span></span></li> <li class=\"blip-progress-steps-item\" aria-current=\"step\"><span class=\"blip-box blip-progress-steps-marker\">2</span><span class=\"blip-progress-steps-label\">Delivery</span></li> <li class=\"blip-progress-steps-item\"><span class=\"blip-box blip-progress-steps-marker\">3</span><span class=\"blip-progress-steps-label\">Payment</span></li> <li class=\"blip-progress-steps-item\"><span class=\"blip-box blip-progress-steps-marker\">4</span><span class=\"blip-progress-steps-label\">Review</span></li> </ol> </div>"
 },
 {
  "pkg": "game",
  "slug": "shout",
  "name": "Shout",
  "w": 129,
  "h": 39,
  "html": "<p class=\"blip-shout-line blip-display blip-pop\" data-pop=\"Ready?\">Ready?</p>"
 },
 {
  "pkg": "components",
  "slug": "menu",
  "name": "Menu",
  "w": 54,
  "h": 21,
  "html": "<blip-menu class=\"blip-menu\"> <button class=\"blip-box blip-button\" data-variant=\"soft\" aria-haspopup=\"menu\" aria-controls=\"blip-menu-3\" aria-expanded=\"false\" popovertarget=\"\" style=\"anchor-name: --blip-menu-3;\">Level<svg class=\"blip-icon\" viewBox=\"0 0 12 12\" aria-hidden=\"true\"><path d=\"M2 4h2v1h1v1h2V5h1V4h2v1H9v1H8v1H7v1H5V7H4V6H3V5H2z\"></path></svg></button> <div class=\"blip-box blip-menu-list blip-pop-in\" role=\"menu\" aria-label=\"Level\" popover=\"\" id=\"blip-menu-3\" style=\"position-anchor: --blip-menu-3;\"> <button class=\"blip-box blip-menu-item\" role=\"menuitem\" aria-keyshortcuts=\"Control+N\" data-value=\"new\" tabindex=\"0\"><svg class=\"blip-icon\" viewBox=\"0 0 12 12\" aria-hidden=\"true\"><path d=\"M5 2h2v3h3v2H7v3H5V7H2V5h3z\"></path></svg><span class=\"blip-menu-label\">New level</span><span class=\"blip-menu-shortcut\" aria-hidden=\"true\"><kbd class=\"blip-box blip-keycap\" data-size=\"sm\">Ctrl</kbd><kbd class=\"blip-box blip-keycap\" data-size=\"sm\">N</kbd></span></button> <button class=\"blip-box blip-menu-item\" role=\"menuitem\" aria-keyshortcuts=\"Control+D\" data-value=\"duplicate\" tabindex=\"-1\"><svg class=\"blip-icon\" viewBox=\"0 0 12 12\" aria-hidden=\"true\"><path d=\"M4 1h7v7H9V3H4zM1 4h7v7H1z\"></path></svg><span class=\"blip-menu-label\">Duplicate</span><span class=\"blip-menu-shortcut\" aria-hidden=\"true\"><kbd class=\"blip-box blip-keycap\" data-size=\"sm\">Ctrl</kbd><kbd class=\"blip-box blip-keycap\" data-size=\"sm\">D</kbd></span></button> <blip-menu class=\"blip-menu\"> <button class=\"blip-box blip-menu-item\" role=\"menuitem\" tabindex=\"-1\" aria-haspopup=\"menu\" aria-controls=\"blip-menu-4\" aria-expanded=\"false\" popovertarget=\"\" style=\"anchor-name: --blip-menu-4;\"><svg class=\"blip-icon\" viewBox=\"0 0 12 12\" aria-hidden=\"true\"><path d=\"M5 1h2v4h1V4h2v1H9v1H8v1H7v1H5V7H4V6H3V5H2V4h2v1h1zM1 8h2v1h6V8h2v3H1z\"></path></svg><span class=\"blip-menu-label\">Export</span></button> <div class=\"blip-box blip-menu-list blip-pop-in\" role=\"menu\" aria-label=\"Export\" popover=\"\" id=\"blip-menu-4\" style=\"position-anchor: --blip-menu-4;\"> <button class=\"blip-box blip-menu-item\" role=\"menuitem\" data-value=\"export-png\" tabindex=\"0\"><span class=\"blip-menu-label\">PNG picture</span></button> <button class=\"blip-box blip-menu-item\" role=\"menuitem\" data-value=\"export-json\" tabindex=\"-1\"><span class=\"blip-menu-label\">Tile map (JSON)</span></button> <button class=\"blip-box blip-menu-item\" role=\"menuitem\" data-value=\"share\" tabindex=\"-1\"><span class=\"blip-menu-label\">Share link</span></button> </div> </blip-menu> <div class=\"blip-menu-separator\" role=\"separator\"></div> <div role=\"group\" aria-labelledby=\"menu-live-show\"> <div class=\"blip-menu-heading\" id=\"menu-live-show\">Show</div> <button class=\"blip-box blip-menu-item\" role=\"menuitemcheckbox\" aria-checked=\"true\" data-value=\"grid\" tabindex=\"-1\"><span class=\"blip-menu-label\">Grid</span></button> <button class=\"blip-box blip-menu-item\" role=\"menuitemcheckbox\" aria-checked=\"false\" data-value=\"hitboxes\" tabindex=\"-1\"><span class=\"blip-menu-label\">Hitboxes</span></button> </div> <div class=\"blip-menu-separator\" role=\"separator\"></div> <div role=\"group\" aria-labelledby=\"menu-live-sort\"> <div class=\"blip-menu-heading\" id=\"menu-live-sort\">Sort tiles by</div> <button class=\"blip-box blip-menu-item\" role=\"menuitemradio\" aria-checked=\"true\" data-value=\"name\" tabindex=\"-1\"><span class=\"blip-menu-label\">Name</span></button> <button class=\"blip-box blip-menu-item\" role=\"menuitemradio\" aria-checked=\"false\" data-value=\"recent\" tabindex=\"-1\"><span class=\"blip-menu-label\">Last used</span></button> </div> <div class=\"blip-menu-separator\" role=\"separator\"></div> <button class=\"blip-box blip-menu-item\" role=\"menuitem\" aria-disabled=\"true\" tabindex=\"-1\"><svg class=\"blip-icon\" viewBox=\"0 0 12 12\" aria-hidden=\"true\"><path d=\"M4 1h4v1h1v3h1v6H2V5h1V2h1zm1 2v2h2V3zm0 4v2h2V7z\"></path></svg><span class=\"blip-menu-label\">Publish (finish the level first)</span></button> <button class=\"blip-box blip-menu-item\" role=\"menuitem\" data-tone=\"danger\" aria-keyshortcuts=\"Delete\" data-value=\"delete\" tabindex=\"-1\"><svg class=\"blip-icon\" viewBox=\"0 0 12 12\" aria-hidden=\"true\"><path d=\"M4 1h4v1h3v2H1V2h3zM2 5h8v5H9v1H3v-1H2zm2 1v3h1V6zm3 0v3h1V6z\"></path></svg><span class=\"blip-menu-label\">Delete level</span><span class=\"blip-menu-shortcut\" aria-hidden=\"true\"><kbd class=\"blip-box blip-keycap\" data-size=\"sm\">Del</kbd></span></button> </div> </blip-menu>"
 },
 {
  "pkg": "components",
  "slug": "tile",
  "name": "Tile",
  "w": 36,
  "h": 36,
  "html": "<span class=\"blip-box blip-tile\" data-size=\"lg\" data-tone=\"green\"><svg class=\"blip-icon\" viewBox=\"0 0 12 12\" aria-hidden=\"true\"><path d=\"M1 2h1v1h1v1h1V3h1V2h2v1h1v1h1V3h1V2h1v5H1zm2 3v1h1V5zm5 0v1h1V5zM1 8h10v2H1z\"></path></svg></span>"
 },
 {
  "pkg": "game",
  "slug": "touch-pad",
  "name": "Touch pad",
  "w": 48,
  "h": 36,
  "html": "<span class=\"blip-touch-pad-buttons\"><span class=\"blip-box blip-touch-pad-button\" data-button=\"b\" role=\"button\" aria-keyshortcuts=\"x\">B</span><span class=\"blip-box blip-touch-pad-button\" data-button=\"a\" role=\"button\" aria-keyshortcuts=\"z\">A</span></span>"
 },
 {
  "pkg": "components",
  "slug": "input",
  "name": "Input",
  "w": 110,
  "h": 20,
  "html": "<span class=\"blip-box blip-input\" style=\"inline-size: calc(110 * var(--blip-pixel));\"><input id=\"in-name\" type=\"text\" placeholder=\"Pixel Pal\" autocomplete=\"nickname\"></span>"
 },
 {
  "pkg": "effects",
  "slug": "burst",
  "name": "Burst",
  "w": 68,
  "h": 20,
  "html": "<button class=\"blip-box blip-button\" type=\"button\" data-tone=\"success\" onclick=\"import('@jaatster/blip-effects').then(({ burst }) =&gt; { burst(this, { kind: 'coin', count: 5 }); burst(this, { kind: 'sparkle' }); })\">Claim reward</button>"
 },
 {
  "pkg": "game",
  "slug": "sprites",
  "name": "Sprites",
  "w": 95,
  "h": 12,
  "html": "<div style=\"display:flex;align-items:center;gap:calc(6 * var(--blip-pixel))\"><blip-sprite name=\"coin\" aria-hidden=\"true\"><svg class=\"blip-sprite\" data-sprite=\"coin\" viewBox=\"0 0 8 10\" width=\"16\" height=\"20\" style=\"--_w:8;--_h:10\" shape-rendering=\"crispEdges\" focusable=\"false\" aria-hidden=\"true\"><path fill=\"var(--blip-ink)\" d=\"M2 0h4v1h-4zM1 1h1v1h-1zM6 1h1v1h-1zM0 2h1v1h-1zM7 2h1v1h-1zM0 3h1v1h-1zM7 3h1v1h-1zM0 4h1v1h-1zM7 4h1v1h-1zM0 5h1v1h-1zM7 5h1v1h-1zM0 6h1v1h-1zM7 6h1v1h-1zM0 7h1v1h-1zM7 7h1v1h-1zM1 8h1v1h-1zM6 8h1v1h-1zM2 9h4v1h-4z\"></path><path fill=\"var(--blip-candy-yellow-light)\" d=\"M2 1h4v1h-4zM1 2h1v1h-1zM1 3h1v1h-1zM1 4h1v1h-1zM1 5h1v1h-1z\"></path><path fill=\"var(--blip-white)\" d=\"M2 2h1v1h-1zM2 3h1v1h-1zM2 4h1v1h-1z\"></path><path fill=\"var(--blip-candy-yellow)\" d=\"M3 2h4v1h-4zM3 3h2v1h-2zM6 3h1v1h-1zM3 4h2v1h-2zM6 4h1v1h-1zM2 5h3v1h-3zM6 5h1v1h-1zM1 6h4v1h-4zM6 6h1v1h-1zM1 7h5v1h-5z\"></path><path fill=\"var(--blip-candy-yellow-shade)\" d=\"M5 3h1v1h-1zM5 4h1v1h-1zM5 5h1v1h-1zM5 6h1v1h-1zM6 7h1v1h-1zM2 8h4v1h-4z\"></path></svg></blip-sprite><blip-sprite name=\"gem\" aria-hidden=\"true\"><svg class=\"blip-sprite\" data-sprite=\"gem\" viewBox=\"0 0 11 10\" width=\"22\" height=\"20\" style=\"--_w:11;--_h:10\" shape-rendering=\"crispEdges\" focusable=\"false\" aria-hidden=\"true\"><path fill=\"var(--blip-ink)\" d=\"M3 0h5v1h-5zM2 1h1v1h-1zM8 1h2v1h-2zM1 2h1v1h-1zM10 2h1v1h-1zM0 3h1v1h-1zM10 3h1v1h-1zM0 4h1v1h-1zM10 4h1v1h-1zM1 5h1v1h-1zM9 5h1v1h-1zM2 6h1v1h-1zM8 6h1v1h-1zM3 7h1v1h-1zM7 7h1v1h-1zM4 8h1v1h-1zM6 8h1v1h-1zM5 9h1v1h-1z\"></path><path fill=\"var(--blip-white)\" d=\"M3 1h1v1h-1zM2 2h1v1h-1z\"></path><path fill=\"var(--blip-sprite-light, var(--blip-candy-purple-light))\" d=\"M4 1h3v1h-3zM3 2h3v1h-3zM1 3h4v1h-4zM1 4h1v1h-1zM2 5h1v1h-1zM3 6h1v1h-1zM4 7h1v1h-1z\"></path><path fill=\"var(--blip-sprite-base, var(--blip-candy-purple))\" d=\"M7 1h1v1h-1zM6 2h3v1h-3zM5 3h4v1h-4zM2 4h3v1h-3zM9 4h1v1h-1zM3 5h2v1h-2zM4 6h1v1h-1zM5 7h1v1h-1z\"></path><path fill=\"var(--blip-sprite-shade, var(--blip-candy-purple-shade))\" d=\"M9 2h1v1h-1zM9 3h1v1h-1zM5 4h4v1h-4zM5 5h4v1h-4zM5 6h3v1h-3zM6 7h1v1h-1zM5 8h1v1h-1z\"></path></svg></blip-sprite><blip-sprite name=\"heart\" aria-hidden=\"true\"><svg class=\"blip-sprite\" data-sprite=\"heart\" viewBox=\"0 0 11 10\" width=\"22\" height=\"20\" style=\"--_w:11;--_h:10\" shape-rendering=\"crispEdges\" focusable=\"false\" aria-hidden=\"true\"><path fill=\"var(--blip-ink)\" d=\"M1 0h3v1h-3zM7 0h3v1h-3zM0 1h1v1h-1zM4 1h1v1h-1zM6 1h1v1h-1zM10 1h1v1h-1zM0 2h1v1h-1zM5 2h1v1h-1zM10 2h1v1h-1zM0 3h1v1h-1zM10 3h1v1h-1zM0 4h1v1h-1zM10 4h1v1h-1zM1 5h1v1h-1zM9 5h1v1h-1zM2 6h1v1h-1zM8 6h1v1h-1zM3 7h1v1h-1zM7 7h1v1h-1zM4 8h1v1h-1zM6 8h1v1h-1zM5 9h1v1h-1z\"></path><path fill=\"var(--blip-sprite-light, var(--blip-candy-red-light))\" d=\"M1 1h1v1h-1zM3 1h1v1h-1zM7 1h2v1h-2zM2 2h1v1h-1zM1 3h1v1h-1z\"></path><path fill=\"var(--blip-white)\" d=\"M2 1h1v1h-1zM1 2h1v1h-1z\"></path><path fill=\"var(--blip-sprite-base, var(--blip-candy-red))\" d=\"M9 1h1v1h-1zM3 2h2v1h-2zM6 2h3v1h-3zM2 3h7v1h-7zM1 4h8v1h-8zM2 5h6v1h-6zM3 6h3v1h-3z\"></path><path fill=\"var(--blip-sprite-shade, var(--blip-candy-red-shade))\" d=\"M9 2h1v1h-1zM9 3h1v1h-1zM9 4h1v1h-1zM8 5h1v1h-1zM6 6h2v1h-2zM4 7h3v1h-3zM5 8h1v1h-1z\"></path></svg></blip-sprite><blip-sprite name=\"heart-half\" aria-hidden=\"true\"><svg class=\"blip-sprite\" data-sprite=\"heart-half\" viewBox=\"0 0 11 10\" width=\"22\" height=\"20\" style=\"--_w:11;--_h:10\" shape-rendering=\"crispEdges\" focusable=\"false\" aria-hidden=\"true\"><path fill=\"var(--blip-ink)\" d=\"M1 0h3v1h-3zM7 0h3v1h-3zM0 1h1v1h-1zM4 1h1v1h-1zM6 1h1v1h-1zM10 1h1v1h-1zM0 2h1v1h-1zM5 2h1v1h-1zM10 2h1v1h-1zM0 3h1v1h-1zM10 3h1v1h-1zM0 4h1v1h-1zM10 4h1v1h-1zM1 5h1v1h-1zM9 5h1v1h-1zM2 6h1v1h-1zM8 6h1v1h-1zM3 7h1v1h-1zM7 7h1v1h-1zM4 8h1v1h-1zM6 8h1v1h-1zM5 9h1v1h-1z\"></path><path fill=\"var(--blip-sprite-light, var(--blip-candy-red-light))\" d=\"M1 1h1v1h-1zM3 1h1v1h-1zM2 2h1v1h-1zM1 3h1v1h-1z\"></path><path fill=\"var(--blip-white)\" d=\"M2 1h1v1h-1zM1 2h1v1h-1z\"></path><path fill=\"var(--blip-candy-slate-light)\" d=\"M7 1h2v1h-2z\"></path><path fill=\"var(--blip-candy-slate)\" d=\"M9 1h1v1h-1zM6 2h3v1h-3zM6 3h3v1h-3zM6 4h3v1h-3zM6 5h2v1h-2z\"></path><path fill=\"var(--blip-sprite-base, var(--blip-candy-red))\" d=\"M3 2h2v1h-2zM2 3h4v1h-4zM1 4h5v1h-5zM2 5h4v1h-4zM3 6h3v1h-3z\"></path><path fill=\"var(--blip-candy-slate-shade)\" d=\"M9 2h1v1h-1zM9 3h1v1h-1zM9 4h1v1h-1zM8 5h1v1h-1zM6 6h2v1h-2zM6 7h1v1h-1z\"></path><path fill=\"var(--blip-sprite-shade, var(--blip-candy-red-shade))\" d=\"M4 7h2v1h-2zM5 8h1v1h-1z\"></path></svg></blip-sprite><blip-sprite name=\"heart-empty\" aria-hidden=\"true\"><svg class=\"blip-sprite\" data-sprite=\"heart-empty\" viewBox=\"0 0 11 10\" width=\"22\" height=\"20\" style=\"--_w:11;--_h:10\" shape-rendering=\"crispEdges\" focusable=\"false\" aria-hidden=\"true\"><path fill=\"var(--blip-ink)\" d=\"M1 0h3v1h-3zM7 0h3v1h-3zM0 1h1v1h-1zM4 1h1v1h-1zM6 1h1v1h-1zM10 1h1v1h-1zM0 2h1v1h-1zM5 2h1v1h-1zM10 2h1v1h-1zM0 3h1v1h-1zM10 3h1v1h-1zM0 4h1v1h-1zM10 4h1v1h-1zM1 5h1v1h-1zM9 5h1v1h-1zM2 6h1v1h-1zM8 6h1v1h-1zM3 7h1v1h-1zM7 7h1v1h-1zM4 8h1v1h-1zM6 8h1v1h-1zM5 9h1v1h-1z\"></path><path fill=\"var(--blip-candy-slate-light)\" d=\"M1 1h3v1h-3zM7 1h2v1h-2zM1 2h2v1h-2zM1 3h1v1h-1z\"></path><path fill=\"var(--blip-candy-slate)\" d=\"M9 1h1v1h-1zM3 2h2v1h-2zM6 2h3v1h-3zM2 3h7v1h-7zM1 4h8v1h-8zM2 5h6v1h-6zM3 6h3v1h-3z\"></path><path fill=\"var(--blip-candy-slate-shade)\" d=\"M9 2h1v1h-1zM9 3h1v1h-1zM9 4h1v1h-1zM8 5h1v1h-1zM6 6h2v1h-2zM4 7h3v1h-3zM5 8h1v1h-1z\"></path></svg></blip-sprite><blip-sprite name=\"star\" aria-hidden=\"true\"><svg class=\"blip-sprite\" data-sprite=\"star\" viewBox=\"0 0 13 12\" width=\"26\" height=\"24\" style=\"--_w:13;--_h:12\" shape-rendering=\"crispEdges\" focusable=\"false\" aria-hidden=\"true\"><path fill=\"var(--blip-ink)\" d=\"M6 0h1v1h-1zM5 1h1v1h-1zM7 1h1v1h-1zM4 2h1v1h-1zM8 2h1v1h-1zM1 3h4v1h-4zM8 3h4v1h-4zM0 4h1v1h-1zM12 4h1v1h-1zM1 5h1v1h-1zM11 5h1v1h-1zM2 6h1v1h-1zM10 6h1v1h-1zM3 7h1v1h-1zM9 7h1v1h-1zM2 8h1v1h-1zM10 8h1v1h-1zM2 9h1v1h-1zM6 9h1v1h-1zM10 9h1v1h-1zM1 10h1v1h-1zM4 10h2v1h-2zM7 10h2v1h-2zM11 10h1v1h-1zM2 11h2v1h-2zM9 11h2v1h-2z\"></path><path fill=\"var(--blip-sprite-light, var(--blip-candy-yellow-light))\" d=\"M6 1h1v1h-1zM5 2h1v1h-1zM7 2h1v1h-1zM5 3h2v1h-2zM1 4h5v1h-5zM2 5h2v1h-2zM3 6h1v1h-1z\"></path><path fill=\"var(--blip-white)\" d=\"M6 2h1v1h-1z\"></path><path fill=\"var(--blip-sprite-base, var(--blip-candy-yellow))\" d=\"M7 3h1v1h-1zM6 4h5v1h-5zM4 5h5v1h-5zM4 6h5v1h-5zM4 7h4v1h-4zM3 8h4v1h-4zM3 9h2v1h-2zM2 10h1v1h-1z\"></path><path fill=\"var(--blip-sprite-shade, var(--blip-candy-yellow-shade))\" d=\"M11 4h1v1h-1zM9 5h2v1h-2zM9 6h1v1h-1zM8 7h1v1h-1zM7 8h3v1h-3zM5 9h1v1h-1zM7 9h3v1h-3zM3 10h1v1h-1zM9 10h2v1h-2z\"></path></svg></blip-sprite></div>"
 }
];
