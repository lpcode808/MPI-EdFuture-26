#!/usr/bin/env node

import { EVENT } from "../data/event.js";
import { DAYS, SESSIONS } from "../data/schedule.js";

const failures = [];
const dayIds = new Set(DAYS.map((day) => day.id));
const sessionIds = new Set();

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function isHttpUrl(value) {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

assert(EVENT.id === "mpi-edfuture-26", "Event id must remain stable for saved attendee data.");
assert(EVENT.timezone === "Pacific/Honolulu", "Event timezone must be Pacific/Honolulu.");
assert(isHttpUrl(EVENT.officialUrl), "The official source URL must use HTTP(S).");
assert(isHttpUrl(EVENT.appUrl), "The app URL must use HTTP(S).");
assert(DAYS.length === 2, "The supplied program contains exactly two days.");
assert(SESSIONS.length === 29, "The supplied program images contain exactly 29 items.");

for (const session of SESSIONS) {
  assert(typeof session.id === "string" && session.id.length > 0, "Every program item needs an id.");
  assert(!sessionIds.has(session.id), `Duplicate program item id: ${session.id}`);
  assert(dayIds.has(session.dayId), `Program item ${session.id} references an unknown day.`);
  assert(/^\d{1,2}:\d{2}(am|pm)$/.test(session.time), `Program item ${session.id} has an invalid published start time.`);
  assert(typeof session.title === "string" && session.title.trim().length > 0, `Program item ${session.id} needs a title.`);
  assert(session.room === null || typeof session.room === "string", `Program item ${session.id} room must be text or null.`);
  assert(Array.isArray(session.people), `Program item ${session.id} people must be an array.`);
  assert(session.source === `provided-${session.dayId}-program-image`, `Program item ${session.id} must retain screenshot provenance.`);
  assert(!("endsAt" in session), `Program item ${session.id} must not invent an unpublished end time.`);
  assert(!("description" in session), `Program item ${session.id} must not invent an unpublished description.`);
  sessionIds.add(session.id);
}

const ordered = [...SESSIONS].sort((a, b) => a.order - b.order);
assert(ordered.every((session, index) => session.id === SESSIONS[index]?.id), "Program items must remain in published order.");

if (failures.length) {
  console.error("Data validation failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Data validation passed (${DAYS.length} days, ${SESSIONS.length} published program items).`);

