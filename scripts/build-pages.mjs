import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = path.join(projectRoot, "dist");
const runtimeFiles = [
  "index.html",
  "styles.css",
  "app.js",
  "owl.js",
  "storage.js",
  "sw.js",
  "manifest.webmanifest",
  "data/event.js",
  "data/schedule.js",
  "assets/brand/edfuturesummit-banner.webp",
  "assets/fonts/press-start-2p-latin.woff2",
  "assets/fonts/press-start-2p-latin-ext.woff2",
  "assets/icons/favicon.svg",
  "assets/icons/icon.svg"
];

await rm(outputRoot, { recursive: true, force: true });
await mkdir(outputRoot, { recursive: true });

for (const relativePath of runtimeFiles) {
  const destination = path.join(outputRoot, relativePath);
  await mkdir(path.dirname(destination), { recursive: true });
  await cp(path.join(projectRoot, relativePath), destination);
}

await writeFile(path.join(outputRoot, ".nojekyll"), "");
console.log(`Built ${runtimeFiles.length} attendee-facing files in dist/.`);

