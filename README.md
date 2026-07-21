# 2026 EdFuture Summit pocket program

**Open the guide → <https://lpcode808.github.io/MPI-EdFuture-26/>**

It works on any phone or laptop browser — no install, no account. Add it to your home screen and it keeps working offline, which helps on summit wifi.

This is an unofficial, mobile-first companion for the Third Annual Mid-Pacific EdFuture Summit, July 21–22, 2026, at Mid-Pacific Institute in Honolulu. Browse the two-day program, look up who's presenting, and keep private notes — everything stays on your own device.

## What you can do with it

- Browse all 29 published program items across the two days
- Search by title, presenter, room, or program type
- Filter to either day
- Look up every named presenter in the People tab and jump straight to their session
- Add per-session and quick notes, stored only in your browser
- Export a JSON backup of your notes and import it on another device
- Share the guide link, or let someone scan the QR code in the footer
- Install it as an offline-capable app
- Navigate fully by keyboard, with visible focus, 44px touch targets, and reduced-motion support

Night owls who look closely may find one more thing. 🦉

## Source and privacy boundary

The guide uses only:

- the two supplied public program images in `scraped/`; and
- attendee-facing facts from the public [Humanitix listing](https://events.humanitix.com/2026edfuturesummit).

Names appear only when printed in those public program images. The project contains no attendee list, private contact data, predecessor conference content, analytics, account system, or backend. Notes stay in `localStorage` until the attendee exports them or clears site data.

The sources do not publish session end times or descriptions, so the app shows only the published start times. Humanitix also conflicts about event end times and ticket status; those conflicts are recorded in `scraped/humanitix-public-facts.json` and are not silently resolved.

See `docs/privacy-and-sources.md` for the full boundary, and `docs/roadmap.md` for what's planned next.

## Run locally

```sh
npm run serve
```

Open <http://127.0.0.1:4173/>. No package installation is required — the app has zero runtime dependencies.

## Verify and build

```sh
npm test
npm run build
```

`npm test` is read-only. It checks JavaScript syntax, source-linked data rules, storage normalization, accessibility-critical markup, PWA assets, responsive safeguards, and the presence of both source images.

`npm run build` creates `dist/` from a fixed attendee-facing allowlist. It excludes screenshots, source captures, documentation, and internal handoff files.

## Project map

```text
index.html                     semantic app shell
how-this-works.html            behind-the-scenes explainer, linked from the footer
styles.css                     brand-derived responsive visual system
app.js                         tabs, search, filters, people directory, notes, sharing
owl.js                         a small surprise, loaded only if summoned
storage.js                     versioned local persistence and normalization
sw.js                          offline app-shell service worker
manifest.webmanifest           installable-app metadata
data/event.js                  public event facts and source status
data/schedule.js               screenshot-transcribed program data
scraped/                       public source evidence; never deployed
scripts/validate-data.mjs      provenance and no-invention checks
scripts/storage-roundtrip.mjs  backup-state normalization regression
scripts/static-smoke.mjs       shell, accessibility, and PWA checks
scripts/build-pages.mjs        allowlisted static release to dist/
docs/                          architecture, privacy, and roadmap notes
AGENT_HANDOFF.md               continuation state for future agents
```

The app follows the modular, dependency-free architecture of `HIDOE-AI-26-app` and carries forward attendee patterns from the PCATT and KSEDTECH guides without copying their event content. Its night-mode visual system is drawn from the public EdFuture banner and program flyers: pale teal and sage accents on a deep evergreen ground. See `docs/architecture.md` for details.

## Deployment

The repository is <https://github.com/lpcode808/MPI-EdFuture-26> and the live guide is <https://lpcode808.github.io/MPI-EdFuture-26/>.

Pushes to `main` run a SHA-pinned GitHub Pages workflow that publishes only `dist/`.

## Rights

No open-source license is granted by this repository. Event copy and artwork remain attributable to their source owners; source URLs and capture provenance are retained in the project.
