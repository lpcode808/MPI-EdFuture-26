# 2026 EdFuture Summit pocket program

An unofficial, mobile-first guide for the Mid-Pacific EdFuture Summit on July 21–22, 2026, at Mid-Pacific Institute in Honolulu.

The app follows the modular, dependency-free architecture of `HIDOE-AI-26-app` and carries forward useful attendee patterns from the PCATT and KSEDTECH guides without copying their event content. Its visual system comes from the public EdFuture banner and program flyers: deep evergreen, muted sage, pale aqua, and white.

## What works

- Browse all 29 published program items across two days
- Search by title, printed presenter, room, or program type
- Filter to either day
- Save a private personal plan
- Add per-session and quick notes stored only in the current browser
- Export and validate a JSON backup
- Share the guide link
- Install the offline-capable app shell
- Navigate tabs with Arrow, Home, and End keys
- Use the guide with visible focus, 44px controls, reduced motion, and narrow mobile layouts

## Source and privacy boundary

The guide uses only:

- the two supplied public program images in `scraped/`; and
- attendee-facing facts from the public [Humanitix listing](https://events.humanitix.com/2026edfuturesummit).

Names appear only when printed in those public program images. The project contains no attendee list, private contact data, predecessor conference content, analytics, account system, or backend. Saved items and notes stay in `localStorage` until the attendee exports them or clears site data.

The sources do not publish session end times or descriptions, so the app shows only the published start times. Humanitix also conflicts about event end times and ticket status; those conflicts are recorded in `scraped/humanitix-public-facts.json` and are not silently resolved.

See `docs/privacy-and-sources.md` for the full boundary.

## Run locally

```sh
npm run serve
```

Open <http://127.0.0.1:4173/>. No package installation is required.

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
styles.css                     brand-derived responsive visual system
app.js                         tabs, search, filters, saved plan, notes, sharing
storage.js                     versioned local persistence and normalization
data/event.js                  public event facts and source status
data/schedule.js               screenshot-transcribed program data
scraped/                       public source evidence; never deployed
scripts/validate-data.mjs      provenance and no-invention checks
scripts/storage-roundtrip.mjs  backup-state normalization regression
scripts/static-smoke.mjs       shell, accessibility, and PWA checks
scripts/build-pages.mjs        allowlisted static release to dist/
docs/                          architecture and privacy notes
AGENT_HANDOFF.md               continuation state for future agents
```

## Deployment

The intended repository is <https://github.com/lpcode808/MPI-EdFuture-26> and the intended Pages URL is <https://lpcode808.github.io/MPI-EdFuture-26/>.

Pushes to `main` run a SHA-pinned GitHub Pages workflow that publishes only `dist/`. This workspace does not commit or push changes without explicit approval.

## Rights

No open-source license is granted by this repository. Event copy and artwork remain attributable to their source owners; source URLs and capture provenance are retained in the project.

