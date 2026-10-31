# Changesets

Every package has its own version (no fixed or linked groups) and is published publicly. When a change should
reach users, add a changeset with it:

```sh
pnpm changeset            # pick the packages, the bump (patch, minor, major) and write one line for the changelog
```

On `main`, the release workflow (`.github/workflows/release.yml`) turns pending changesets into a "Version packages"
pull request (`pnpm version-packages`: new versions, changelogs, an updated lockfile). Merging it publishes what is
not on npm yet (`pnpm release`), and only when the repository has an `NPM_TOKEN` secret.

Anything in the public contract (token names, CSS custom properties, building-block classes, part names,
attributes, events) changing incompatibly is a major bump, as in `PLAN.md`. While a package is 0.x, use minor for
those.
