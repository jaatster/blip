# Security policy

## Reporting a vulnerability

Please do not report security problems in a public issue, a pull request or a discussion.

Report them privately through GitHub's security advisories:
[github.com/jaatster/blip/security/advisories/new](https://github.com/jaatster/blip/security/advisories/new)
(the "Report a vulnerability" button on the repository's Security tab). If you cannot use GitHub, write to
**0xjaatster@gmail.com**.

Tell us, as far as you can:

- the package and version (`@jaatster/blip-elements@0.1.0`), or the commit;
- what the problem is and what an attacker could do with it;
- how to reproduce it: the smallest markup, script or token file that shows it;
- whether it is already known or public anywhere.

## What happens next

We will acknowledge your report, work with you to understand it, and keep you told of progress until it is fixed.
Fixes are released as a patch of the affected packages, with a GitHub security advisory that credits you, unless you
would rather not be named. Please give us a reasonable time to release a fix before you disclose the problem
publicly.

## Supported versions

Blip is 0.x. Until 1.0, security fixes go into the latest release of each package only;
upgrade to it to get them. A security fix may change behaviour in a patch release when keeping the old behaviour
would leave people exposed (see [CONTRACT.md](CONTRACT.md)).

## Scope

In scope: the published `@jaatster/blip-*` packages (the CSS, the elements, the React wrappers, the effects and sound
modules), and the build tools that run on your machine when you build from source (`packages/*/scripts`,
`scripts/`).

Out of scope: problems that need an attacker to control your page's own scripts or styles already; content you pass
to Blip as HTML from an untrusted source without sanitising it; the docs site's hosting; and vulnerabilities in
development dependencies that do not reach the published packages (please report those to their maintainers).
Blip's packages have no runtime dependencies outside `@jaatster/blip-*`.
