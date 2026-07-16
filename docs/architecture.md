# Architecture

This is a dependency-free, mobile-first static PWA descended conceptually from `HIDOE-AI-26-app`, with interaction lessons from `PCATT-Summit-26` and `KSEDTECH-26`.

- `index.html` — semantic shell and templates
- `styles.css` — official-color product UI, responsive layout, focus/touch/reduced-motion states
- `app.js` — tabs, filters, search, rendering, saved program, notes, import/export, sharing
- `storage.js` — event-prefixed local state and normalization
- `data/event.js` — public event facts and source-status copy
- `data/schedule.js` — screenshot-transcribed program data with per-item provenance
- `scraped/` — source evidence, excluded from deployment
- `scripts/` — read-only validation plus allowlisted build
- `dist/` — generated GitHub Pages artifact

The project does not reuse content, scraped data, people profiles, brand assets, Git history, or browser artifacts from predecessor apps.

