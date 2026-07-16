#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const html = readFileSync(resolve(root, "index.html"), "utf8");
const css = readFileSync(resolve(root, "styles.css"), "utf8");
const app = readFileSync(resolve(root, "app.js"), "utf8");
const serviceWorker = readFileSync(resolve(root, "sw.js"), "utf8");
const manifest = JSON.parse(readFileSync(resolve(root, "manifest.webmanifest"), "utf8"));
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function containsAll(source, values, label) {
  values.forEach((value) => assert(source.includes(value), `${label} is missing ${value}.`));
}

containsAll(html, [
  'class="skip-link"',
  "<h1",
  'role="tablist"',
  'id="tab-agenda"',
  'aria-controls="panel-agenda"',
  'aria-labelledby="tab-agenda"',
  'id="agendaSearch"',
  'id="quickNotes"',
  'aria-live="polite"',
  'type="module"',
  'rel="manifest"'
], "index.html");

containsAll(css, [
  ":focus-visible",
  "min-height: 44px",
  "prefers-reduced-motion: reduce",
  "safe-area-inset-top",
  "safe-area-inset-bottom",
  "@media (min-width: 58rem)",
  "font-size: 1rem"
], "styles.css");

containsAll(app, [
  'event.key === "ArrowRight"',
  'event.key === "ArrowLeft"',
  'event.key === "Home"',
  'event.key === "End"',
  "navigator.share",
  "navigator.serviceWorker.register",
  "exportEnvelope",
  "store.replace"
], "app.js");

containsAll(serviceWorker, [
  "data/event.js",
  "data/schedule.js",
  "manifest.webmanifest",
  "self.skipWaiting()",
  "requestUrl.origin !== self.location.origin"
], "sw.js");

assert(manifest.display === "standalone", "Manifest must use standalone display mode.");
assert(manifest.start_url === "./#agenda", "Manifest start_url should open the program.");
assert(manifest.icons.some((icon) => icon.purpose.split(/\s+/).includes("maskable")), "Manifest needs a maskable icon.");
assert(existsSync(resolve(root, "assets/brand/edfuturesummit-banner.webp")), "Official banner asset is missing.");
assert(existsSync(resolve(root, "scraped/day-1-program.png")), "Day 1 source image is missing.");
assert(existsSync(resolve(root, "scraped/day-2-program.png")), "Day 2 source image is missing.");

if (failures.length) {
  console.error("Static smoke test failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Static smoke test passed.");

