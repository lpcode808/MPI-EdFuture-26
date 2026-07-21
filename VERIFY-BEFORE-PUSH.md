# Verify before push: People/Notes tabs + storage migration

You're a fresh agent with no prior context on this change. This repo currently has
uncommitted-to-remote work on `main` (already committed locally, not yet pushed) that
removed session bookmarking and replaced it with a "People" directory tab and a "Notes"
tab. Your job: verify it actually works, then report back — **do not push** yourself.
Read `AGENTS.md` first for the product boundary before touching anything.

For context on *why* each piece exists, see the "July 20 pass" entry in `AGENT_HANDOFF.md`.
Read that first if anything below is confusing.

## 1. Automated checks

```sh
npm test        # node --check on all runtime files, data validation, storage
                 # round-trip, static smoke test
npm run build    # writes dist/, should report 16 attendee-facing files
```

Both must exit 0 with no failures printed. If `npm test` fails, stop and report the
failure — don't try to silence it by loosening an assertion.

## 2. The thing that actually matters: the storage migration

The core risk in this change is data loss. `storage.js` bumped its schema from v1 to v2,
which changes the localStorage key from `..._attendee_state_v1` to `..._attendee_state_v2`.
`createStore()` is supposed to detect an old v1 blob and carry `sessionNotes`/`quickNotes`
forward into the new v2 key on first load, instead of the attendee silently losing every
note they'd already written. **This is the one thing that must not regress.**

Serve the app (`npm run serve`, then open `http://localhost:4173/`) and in the browser
console:

```js
localStorage.setItem("mpi_edfuture_26_attendee_state_v1", JSON.stringify({
  schemaVersion: 1,
  savedSessionIds: ["d1-vibe-coding"],
  sessionNotes: { "d1-vibe-coding": "legacy note survived?" },
  quickNotes: "legacy quick note"
}));
```

Then reload the page and check:

- `localStorage.getItem("mpi_edfuture_26_attendee_state_v1")` → should now be `null`
  (migrated away).
- `localStorage.getItem("mpi_edfuture_26_attendee_state_v2")` → should contain
  `sessionNotes: {"d1-vibe-coding":"legacy note survived?"}` and
  `quickNotes: "legacy quick note"`, and should **not** contain `savedSessionIds`.
- Open the **Notes** tab — "legacy note survived?" should appear in the Vibe Coding
  session's note field, and "legacy quick note" should be in the quick-notes box.
- The **Notes** tab count badge should read `1` (only counts non-empty notes + quick
  notes, so `1` is correct here — not `2`).

If any of that fails, this is a real bug — flag it loudly, don't paper over it.

## 3. People tab

- Open the **People** tab. You should see an alphabetized list of every named presenter
  across both days, including the five Day 2 School Share entries: Justin Lai, Gabe
  Yanagihara, Mimi Wong/Bhonna Nakama, Shane Asselstine, and Sydney T, Ray L.
- Tap any name. It should switch to the **Program** tab, pre-fill the search box with
  that person's name/entry, and show only their session(s).

## 4. Notes tab

- Go to **Program**, open the note field on any session (tap the note icon), type
  something, then switch to the **Notes** tab. That session's note should already be
  visible there (same textarea, same text — it's the same DOM pattern used across tabs).
- Edit the note text from *within* the Notes tab. Switch back to Program and confirm the
  same session's note field shows the edited text (there's a sync mechanism between
  twin textareas for the same session — this is the thing most likely to regress if
  someone touches `sessionCard()`).
- Reload the page. The note must still be there (this is `localStorage`, not
  session-only state).
- Try **Export backup** (downloads a `.json` file) and **Import backup** with that same
  file — should succeed with a "Backup imported." status message.

## 5. Things that should be *gone*

- No "My plan" tab, no bookmark/star icon on session cards, no `savedSessionIds` in
  either the v1 or v2 localStorage inspection above.
- Search the DOM / rendered markup for "My plan" or a save button — should find nothing
  in `index.html`, `app.js`, or the rendered page.

## 6. Regression sweep on things that shouldn't have changed

- Program tab: search, day filters (Day 1 / Day 2 / Both days), and the day-grouped
  session list all still work as before.
- Info tab: unchanged, loads fine.
- Tab keyboard nav: focus a tab, use ArrowRight/ArrowLeft/Home/End — should cycle through
  all four tabs (Program, People, Notes, Info) without dropping focus.
- Night Flight easter egg: tap the brand mark 5x quickly (or type "owl" on a physical
  keyboard). The overworld should open with no console errors. Land on a book tile that
  has a note — it should glow / show your note text. It should **not** show a star
  overlay anywhere (that was tied to the removed bookmark feature).
- Open DevTools console and reload from a clean profile (or an incognito window) —
  there should be **zero** console errors or warnings on load, after seeding the legacy
  blob above, and while clicking through all four tabs.

## 7. Viewport sanity

Check at minimum 390px (mobile) and 1280px (desktop) widths:

- The 4-tab bar fits on one line without wrapping or overflowing at 390px.
- Session action buttons (just the note icon now, no bookmark icon) don't look
  orphaned/misaligned now that there's only one button per row.
- People-tab rows are readable and tappable (44px touch target) at 390px.

## Reporting back

Summarize: did `npm test`/`npm run build` pass, did the migration test pass exactly as
described, and any console errors, visual regressions, or behavior that didn't match this
checklist. If everything passes, say so explicitly and confirm it's safe to push. If
anything is off, describe the exact repro steps — don't just say "notes seem broken."
