# Roadmap

Last reviewed July 17, 2026. The summit runs July 21–22; the sections below are
ordered by when the work matters. Anything that would require new data sources
is gated on the source boundary in `privacy-and-sources.md` — nothing gets
added from sites or documents Justin has not approved.

## Before the summit (by July 20)

- **Real-device shakedown.** Verify the live Pages deploy on iOS Safari and
  Android Chrome: install to home screen, airplane-mode reload, QR scan from
  another phone's camera, both Night Flight triggers, and a save/note/export
  round trip.
- **Program re-check against sources.** If the organizers publish an updated
  flyer or the Humanitix listing changes, re-transcribe, update
  `scraped/humanitix-public-facts.json` provenance, and run `npm test`. The
  stale-while-revalidate service worker delivers corrections to installed
  attendees one visit after each push to `main`.
- **Print hand-off.** `assets/brand/qr-guide.svg` is the same code shown in the
  app footer and scales cleanly to a registration-desk poster or table tents if
  the organizers want one.

## During the summit (July 21–22)

- **"Happening now / up next" strip.** A small header strip on the Program tab
  that highlights the current block using published start times only. Decide
  how to handle the missing end times (likely: "started at 9:05am" phrasing
  rather than invented durations).
- **Same-day corrections path.** Room changes get fixed in `data/schedule.js`
  and pushed to `main`; no process change needed, just someone on duty who can
  run `npm test` before pushing.

## After the summit

- **Archive mode.** A quiet banner ("This event has ended — see you next
  year"), day filters defaulting to the full program, and a freeze on data
  edits. Keep the guide up as a reference; localStorage plans remain readable.
- **Retrospective for the template.** Fold what worked (and what nobody used)
  back into the shared guide architecture notes for the next event.

## Parked ideas — need organizer input or a wider source boundary

- Session descriptions and end times, if the organizers publish them.
- Presenter profiles, only from organizer-published material.
- A PNG `og:image` fallback for link unfurlers that skip WebP.
- Optional calendar (.ics) export for saved sessions — start times only.

## Night Flight (easter egg) — nice-to-haves, strictly playful

- A tiny victory flourish when every noted page has been visited in one flight.
- Optional chiptune blips behind a sound toggle, off by default.
- Seasonal sprite variety (the tuft/tree scatter is deterministic and easy to
  reskin).

None of the parked or playful items block the event. The bar for adding
anything is: keeps the zero-dependency runtime, respects the source boundary,
and doesn't crowd the pocket-program core.
