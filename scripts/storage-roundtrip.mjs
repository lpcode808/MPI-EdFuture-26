#!/usr/bin/env node

import assert from "node:assert/strict";
import { normalizeStoredState } from "../storage.js";

const restored = normalizeStoredState({
  schemaVersion: 99,
  savedSessionIds: ["d1-welcome", "d1-welcome", 42],
  sessionNotes: { "d1-welcome": "Meet in the lobby.", bad: 42 },
  personNotes: { "Justin Lai": "Ask about vibe coding.", bad: 42 },
  quickNotes: "Ask about the student showcase."
});

assert.equal("savedSessionIds" in restored, false);
assert.deepEqual(restored.sessionNotes, { "d1-welcome": "Meet in the lobby." });
assert.deepEqual(restored.personNotes, { "Justin Lai": "Ask about vibe coding." });
assert.equal(Array.isArray(restored.quickNotes), true);
assert.equal(restored.quickNotes.length, 1);
assert.equal(restored.quickNotes[0].text, "Ask about the student showcase.");
assert.equal(typeof restored.quickNotes[0].id, "string");
assert.equal(restored.schemaVersion, 3);

console.log("Storage normalization round-trip passed.");

