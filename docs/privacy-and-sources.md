# Privacy and source boundary

## Allowed public sources

1. The two public program images supplied for Day 1 and Day 2.
2. The public Humanitix listing at <https://events.humanitix.com/2026edfuturesummit>.

No attendee roster, order data, contact details, private notes, unpublished bios, or information from predecessor conference apps belongs in this project.

## Runtime privacy

- No account, analytics, cookies, remote database, or backend.
- Saved program items and notes use versioned `localStorage` under `mpi_edfuture_26_attendee_state_v1`.
- The export button creates a JSON backup only when the attendee asks for it.
- Import validates both the backup format and event id before replacing local state.
- Google Fonts are the only third-party runtime request. The app uses local fallbacks when offline.
- The service worker caches only same-origin attendee-facing files.

## Source restraint

The public Humanitix page exposes more names and profile material than the program needs. This guide deliberately includes only names printed in the supplied agenda images. It also excludes the full page source because its platform markup includes unnecessary transient and internal identifiers.

The public listing disagrees with itself about ending times and ticket availability. The app therefore:

- shows published start times only;
- does not invent session durations;
- links to Humanitix without claiming registration is open; and
- labels itself unofficial and source-limited.

## Deployment boundary

`npm run build` creates `dist/` from a fixed allowlist. `scraped/`, `docs/`, scripts, screenshots, and handoff notes are never copied into the public Pages artifact.

