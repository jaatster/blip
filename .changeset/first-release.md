---
---

The first release publishes every package at the version it has now, with no bump: 0.1.0 for all of them, and
0.2.0 for @blip/font (Pixel Bop's second cut, extended to every European capital). This empty changeset only
records that: `changeset version` removes it without changing a version, and `changeset publish` publishes every
version that is not on npm yet. Each package's CHANGELOG.md starts with that release.
