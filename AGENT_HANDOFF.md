# Agent handoff

## Current state

The greenfield attendee guide was created on July 16, 2026. It is structurally based on the clean modular lessons from `HIDOE-AI-26-app`, with selected interaction lessons from PCATT and KSEDTECH. It does **not** copy predecessor event data, people profiles, scraped pages, brand files, Git history, or browser artifacts.

The runtime contains all 29 program items visible in the two supplied public flyers: 14 on Day 1 and 15 on Day 2. Event name, dates, venue, host framing, banner asset, and color tokens come from the public Humanitix page.

## Privacy and content boundary

Only these sources are authorized:

1. `scraped/day-1-program.png`
2. `scraped/day-2-program.png`
3. <https://events.humanitix.com/2026edfuturesummit>

Do not add lineup biographies, contact details, attendee data, or public facts from other sites without Justin expanding the source boundary. The Humanitix listing exposes additional public profiles, but the current app intentionally uses only names printed in the program flyers.

The full Humanitix HTML was not retained because it carries irrelevant checkout markup, transient tokens, and internal identifiers. `scraped/humanitix-public-facts.json` is the sanitized public-fact snapshot.

## Implemented behavior

- Program / My plan / Info tabs with click and Arrow/Home/End keyboard navigation
- Day filters and agenda search
- Published start times only; no invented durations
- Saved program bookmarks and per-session notes
- Device-local quick notes
- Validated JSON export/import
- Share API with clipboard fallback
- Offline same-origin app shell
- 44px touch targets, visible focus, reduced motion, safe-area spacing
- Explicit empty states and source/privacy disclosures
- Fixed-allowlist `dist/` build
- No runtime dependencies or install step

## Design direction

Register: product UI. The interface is a pocket program with an editorial first viewport, not a promotional landing page or dashboard.

Tokens derive from the public brand:

- deep evergreen `#005749` sampled from the artwork
- Humanitix theme teal `#456d67`
- muted sage `#779c96`
- pale aqua `#dbe9e7`
- warm paper `#fbfcfa`

Sora handles UI and Source Serif 4 handles reading copy. The official 1600×800 public banner is preserved locally with provenance in the sanitized source snapshot.

## Known source conflicts

- Humanitix schema says the overall event ends at 4pm on July 22; description copy says Day 2 runs to 5pm.
- Day 1 description says 8am–3pm, but the public flyer includes a 3:10pm item.
- Humanitix simultaneously says “Register today” and “Sales have stopped.”

The app avoids all three conflicts by showing published session start times only and linking to the official listing without claiming ticket availability.

## Verification path

Run:

```sh
npm test
npm run build
npm run serve
```

Then check mobile at 390px, tablet at 768px, and desktop at 1280px. Test search, day filters, bookmarks, notes, export/import, tab keyboard behavior, offline reload, and the Pages project path.

Completed local verification on July 16:

- `npm test` passes at 2 days / 29 program items.
- The allowlisted build contains 11 attendee-facing files plus `.nojekyll`.
- Playwright against installed Chrome reported a true 390px viewport with `clientWidth === scrollWidth === 390`, all header/tab controls inside the viewport, and no console or page errors.
- Day 2 filtered to 15 items; “Justin” returned one item; bookmark count updated to 1; a private quick note persisted after reload.
- Desktop and full-page mobile screenshots were visually inspected.
- Contact/credential scanning found no email addresses, phone numbers, secrets, private keys, or predecessor-source residue.
- The existing empty GitHub remote was reachable and is attached as `origin`.

## July 16 review pass (Claude)

A second-agent review verified all 29 program items against the two source flyers (times, titles, rooms, printed names all match) and applied these changes:

- Service worker switched from cache-first to stale-while-revalidate (`v3`), so program corrections reach installed attendees one visit later without a manual cache bump. Offline reload re-verified.
- Desktop hero now shows the full banner (`object-fit: contain`) instead of a crop that sliced the summit wordmark mid-word.
- Bookmark toggle keeps keyboard focus on the equivalent button after re-render.
- Tabs respond to `hashchange`, so the brand link and shared `#saved`/`#info` URLs work after initial load.
- Note buttons start with `aria-expanded="false"`; clipboard share fallback no longer throws when clipboard permission is denied.
- `og:url` added and `og:image` made absolute for link previews; duplicate `max-width` declarations removed.

`npm test`, `npm run build`, and Playwright checks (390px/1280px, focus behavior, offline reload) all pass after these edits.

## July 16 evening pass (Claude, Justin's feedback round)

- **Dark mode is now the default and only theme.** The token palette in `styles.css` was reworked to a night-evergreen scheme (`--color-paper: #0c1513` page, `--color-surface` for fields, light-teal `--color-primary` for accents, `--color-primary-strong` for button/filter fills). The official banner stays as white "poster" art intentionally — do not filter or invert it. `theme-color` meta and manifest colors updated to match.
- Session note icon changed from a talk bubble to a note page in the `#sessionTemplate` SVG.
- Footer credit added: "Created by TechZone at the Hawaii School for Girls at La Pietra" linking to the school's TechZone page.
- **Easter egg — `owl.js` ("Night Flight"):** five quick taps on the brand mark or typing `owl` lazily imports a pixel-art overworld (an Owlgorithms Club nod). An owl flies (arrows/WASD, on-screen d-pad with hold-repeat) across a map of the non-break program items; landing on a page shows an FF-style dialog with the session, a ★ if saved, and the attendee's private note. It reads `store.get()` once on open and **never writes** — no schema change, no new storage keys. Esc or Return closes and restores focus. Press Start 2P font is injected only on first open.
- Plumbing: `owl.js` added to the sw shell (cache bumped to `v4`), the build allowlist (dist is now 12 files), and `npm run check`.
- Verified July 16: `npm test` + `npm run build` pass; Playwright against installed Chrome at 390px and 1280px — no console errors, `clientWidth === scrollWidth === 390`, both easter-egg triggers work, dialog surfaces a seeded note, Escape close leaves localStorage byte-identical.

## July 16 easter-egg persona review (Opus grader → Fable edits)

A fresh-context persona evaluation ("SNES-kid teacher on summit wifi") graded Night Flight
"ship after paper-cuts." Applied:

- **Self-hosted Press Start 2P** (`assets/fonts/*.woff2`, OFL) via `@font-face` in owl.js —
  the retro face now survives offline; verified with all external requests blocked. Added to
  sw shell (cache `v5`) and the build allowlist (dist = 14 files).
- **Note compass**: when every noted page is off-camera, a gold rotating "➤ NOTE" arrow at the
  viewport edge points to the nearest one (fixes the blind 12-tap hunt on phones). Tiles within
  half a cell of the edge count as off-screen.
- **Book sprite** redrawn as an open book (two pages + teal spine) — no longer reads as a floppy disk.
- **Owl movement** uses `steps(3)` easing for a 16-bit hop instead of a modern glide.

Deliberately skipped: typewriter text reveal (a busy attendee re-reading her own note wants it
instantly) and narrowing which kinds get map tiles (the main UI allows notes on any non-break
item; the map mirrors that). Both are on record as intentional.

## July 17 README + review + Night Flight pass (Fable, with Opus/Sonnet reviewers)

README restructured: the live Pages URL is now the first line, the feature list leads,
lineage/palette notes moved into the project-map section (and corrected to describe the
dark scheme), `sw.js`/`manifest.webmanifest`/`owl.js` added to the map.

Guide fixes from a Sonnet review pass:

- Unsaving from the My plan tab no longer drops keyboard focus to `<body>` (the old
  fallback targeted a button inside the hidden agenda panel; now falls back within the
  visible panel, then the My plan tab).
- Open session-note editors survive re-renders (open ids tracked in a Set outside the
  render cycle), so a search keystroke or bookmark toggle no longer folds them shut.
- Quick-notes caret no longer jumps to the end on unrelated re-renders.
- Share button label reverts to "Share this guide" 4s after a clipboard copy.
- Dead `.session-row:target` rule removed; `og:type` + `twitter:card` metas added;
  "Last reviewed" bumped.

Night Flight fixes from an Opus review pass:

- **D-pad now moves on bare `click`** — keyboard and mobile-screen-reader activation
  never fired the old `pointerdown`-only handlers; pointer presses still step
  immediately and hold-repeat, with a flag to prevent double-steps.
- `.brand` gets `touch-action: manipulation` (iOS double-tap zoom was eating the 5-tap
  trigger) and taps 2–5 `preventDefault()` so a streak doesn't thrash tab/scroll state.
- The note body renders in Source Serif at 0.95rem (the payoff was 9px pixel glyphs);
  `overflow-wrap: anywhere` guards pasted URLs.
- Page shell set `inert` behind the modal; restored on close.
- Dialog re-renders only when the underfoot tile changes, so `aria-live` no longer
  announces every empty step.
- First-open hint now explains the overworld ("every book is a program item").
- Explicit `prefers-reduced-motion` block inside `injectStyles` (previously honored
  only via the app-global reset); `min-height` on the map viewport plus a short-screen
  media query keep landscape phones playable; `modulepreload` for owl.js removes the
  first-summon latency beat.

Verified July 17 with Playwright/Chromium at 390×844 and 740×360: all of the above
exercised end-to-end (focus retention, note-editor persistence, caret guard, 5-tap and
"owl" triggers, d-pad `click()` movement, inert toggling, storage byte-identical after
open/close). Only failed request was Google Fonts, blocked by the sandbox proxy.

## July 17 second pass: share QR, tap-to-fly, roadmap (Fable)

- **Footer QR code** (`assets/brand/qr-guide.svg`, 2KB static SVG): a "Pass it on"
  block above the footer copy with the code on a white card, caption, and the share
  button. Generated once from the live Pages URL with the `qrcode` npm package
  (error correction M, 2-module quiet zone) — a build-time artifact, no runtime
  dependency. Decode-verified with jsQR against a rendered screenshot. Added to the
  sw shell (cache `v6`), build allowlist (dist = 15 files), and
  static-smoke (existence + stays-tiny checks). Regenerate only if the Pages URL
  ever changes.
- **Night Flight navigation, mobile vs laptop.** Decision: don't pick a winner —
  add tap/click-to-fly as the shared direct-manipulation path. Tapping/clicking any
  map tile flies the owl there step-by-step (150ms cadence, rows-then-columns like
  the drawn trails) with a dashed gold target marker; any arrow key, WASD, or d-pad
  press cancels the flight and hands control back. Reduced-motion users jump
  straight to the target. The intro dialog names the device's controls via
  `(pointer: coarse)`: touch hears "tap anywhere on the map", keyboard machines
  hear "arrow keys or WASD — or click the map." The d-pad stays on all devices as
  fallback and game chrome.
- `docs/roadmap.md` added (pre-summit shakedown, day-of now/next idea, archive
  mode, parked ideas gated on the source boundary); linked from the README.

Verified July 17 with Playwright/Chromium at 390×844 and 1280×800: QR visible in
footer and decodes to the live URL from an on-page screenshot; tap-to-fly lands the
owl on the tapped tile and the dialog updates; a keypress mid-flight cancels it;
storage stays byte-identical; `npm test` and `npm run build` green.

## What remains

1. Review the local result and commit/push only after explicit approval.
2. Enable GitHub Pages with GitHub Actions if the repository setting is not already active.
3. After publishing, verify the live root, banner, manifest, program search, My plan, and an offline reload.
