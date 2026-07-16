# MPI EdFuture 2026 pocket program

Read `/Users/justinlai/Coding/AGENTS.md` and `/Users/justinlai/Coding/CLAUDE.md` before changing this project.

## Product boundary

- This is an unofficial two-day, mobile-first conference pocket program.
- Use only `scraped/day-1-program.png`, `scraped/day-2-program.png`, and the public Humanitix listing recorded in `scraped/humanitix-public-facts.json`.
- Never copy people, bios, contacts, raw captures, or content from HIDOE, PCATT, KSEDTECH, or any other conference app.
- Do not infer session end times, descriptions, presenter roles, or logistics. Missing data stays absent.
- Keep the runtime dependency-free unless a real requirement justifies a change.

## App rules

- Preserve 44px touch targets, visible focus, accessible tab behavior, reduced motion, explicit empty states, and safe-area spacing.
- Saved items and notes remain device-local. Do not add analytics, accounts, cookies, or a backend.
- Keep event facts in `data/event.js` and program items in `data/schedule.js`.
- `npm test` must stay read-only. `npm run build` may rewrite only `dist/`.
- The service worker is stale-while-revalidate, so published edits reach attendees on their next visit automatically. Still bump the cache name when adding or removing a cached asset, or when a change must land in the offline shell immediately.

## Deployment

The GitHub Pages workflow publishes only `dist/`. Raw source evidence, internal docs, adapters, and handoff notes must not enter the public artifact.

