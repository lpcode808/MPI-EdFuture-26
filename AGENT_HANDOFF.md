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

## What remains

1. Review the local result and commit/push only after explicit approval.
2. Enable GitHub Pages with GitHub Actions if the repository setting is not already active.
3. After publishing, verify the live root, banner, manifest, program search, My plan, and an offline reload.
