#!/usr/bin/env node

import assert from "node:assert/strict";
import { normalizeStoredState } from "../storage.js";

const restored = normalizeStoredState({
  schemaVersion: 99,
  savedSessionIds: ["d1-welcome", "d1-welcome", 42],
  sessionNotes: { "d1-welcome": "Meet in the lobby.", bad: 42 },
  quickNotes: "Ask about the student showcase."
});

assert.deepEqual(restored.savedSessionIds, ["d1-welcome"]);
assert.deepEqual(restored.sessionNotes, { "d1-welcome": "Meet in the lobby." });
assert.equal(restored.quickNotes, "Ask about the student showcase.");
assert.equal(restored.schemaVersion, 1);

console.log("Storage normalization round-trip passed.");

