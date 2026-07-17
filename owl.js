// Night Flight — a read-only easter egg overworld (a nod to the Owlgorithms
// Club on the Day 2 program). Reached by tapping the brand mark five times or
// typing "owl". It renders the existing program + note data as a pixel map;
// it never writes to storage and adds no schema of its own.
import { DAYS, SESSIONS } from "./data/schedule.js";

const CELL = 56;
const NODE_COLUMNS = [1, 3, 5, 7, 9, 11];
const COLS = 13;

const PALETTE = {
  D: "#2b1d12", B: "#6b4a2c", W: "#f6efe2", K: "#1a1410", G: "#e0a23c",
  C: "#e9d8ac", S: "#c7b184", P: "#2e6b5e", L: "#a89a6f", T: "#1e4633",
  R: "#4a3421", g: "#2a5240"
};

const OWL_SPRITE = [
  ".D........D.",
  ".DD......DD.",
  ".DBBBBBBBBD.",
  "DBWWWBBWWWBD",
  "DBWKWBBWKWBD",
  "DBWWWGGWWWBD",
  "DBBBBGGBBBBD",
  "DBCCCCCCCCBD",
  "DBCSCCCCSCBD",
  "DBCCCCCCCCBD",
  "DBCSCCCCSCBD",
  ".DBCCCCCCBD.",
  "..DGG..GGD.."
];

const BOOK_SPRITE = [
  ".DDDDDDDDD.",
  "DWWWWPWWWWD",
  "DWLLWPWLLWD",
  "DWWWWPWWWWD",
  "DWLLWPWLLWD",
  "DWWWWPWWWWD",
  "DPPPPPPPPPD",
  ".DDDDDDDDD."
];

const TREE_SPRITE = [
  "....DD....",
  "...DTTD...",
  "...DTTD...",
  "..DTTTTD..",
  "..DTTTTD..",
  ".DTTTTTTD.",
  ".DTTTTTTD.",
  "DTTTTTTTTD",
  "....RR....",
  "....RR...."
];

const TUFT_SPRITE = [
  "g..g.g",
  ".g.g.g"
];

function pixelSvg(map, size) {
  const rows = map.length;
  const cols = map[0].length;
  const rects = [];
  map.forEach((line, y) => {
    [...line].forEach((char, x) => {
      const fill = PALETTE[char];
      if (fill) rects.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${fill}"></rect>`);
    });
  });
  return `<svg viewBox="0 0 ${cols} ${rows}" width="${size}" height="${size * rows / cols}" shape-rendering="crispEdges" aria-hidden="true">${rects.join("")}</svg>`;
}

function layoutMap() {
  const nodes = [];
  const signs = [];
  let startRow = 2;
  DAYS.forEach((day) => {
    const items = SESSIONS.filter((session) => session.dayId === day.id && session.kind !== "break");
    signs.push({ c: 0, r: startRow, label: day.label });
    items.forEach((session, index) => {
      const band = Math.floor(index / NODE_COLUMNS.length);
      const within = index % NODE_COLUMNS.length;
      const leftToRight = band % 2 === 0;
      nodes.push({
        session,
        day,
        c: leftToRight ? NODE_COLUMNS[within] : NODE_COLUMNS[NODE_COLUMNS.length - 1 - within],
        r: startRow + band * 2
      });
    });
    startRow += Math.ceil(items.length / NODE_COLUMNS.length) * 2 + 2;
  });

  const rowCount = Math.max(...nodes.map((node) => node.r)) + 2;
  const pathCells = new Set();
  nodes.slice(1).forEach((node, index) => {
    let { c, r } = nodes[index];
    while (r !== node.r) { r += Math.sign(node.r - r); pathCells.add(`${c},${r}`); }
    while (c !== node.c) { c += Math.sign(node.c - c); pathCells.add(`${c},${r}`); }
  });
  nodes.forEach((node) => pathCells.delete(`${node.c},${node.r}`));
  return { nodes, signs, pathCells, rowCount };
}

let overlay = null;

export function openOwlMode(store) {
  if (overlay) return;

  injectStyles();

  const state = store.get();
  const notes = state.sessionNotes;
  const savedIds = new Set(state.savedSessionIds);
  const { nodes, signs, pathCells, rowCount } = layoutMap();
  const notedCount = nodes.filter((node) => (notes[node.session.id] || "").trim()).length;
  const worldWidth = COLS * CELL;
  const worldHeight = rowCount * CELL;
  const previousFocus = document.activeElement;
  const previousOverflow = document.body.style.overflow;

  overlay = document.createElement("div");
  overlay.className = "owl-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "Night Flight easter egg");
  overlay.innerHTML = `
    <header class="owl-hud">
      <p class="owl-title">NIGHT FLIGHT <span>· an Owlgorithms tribute</span></p>
      <button class="owl-close" type="button">RETURN ✕</button>
    </header>
    <div class="owl-viewport">
      <div class="owl-world" style="width:${worldWidth}px;height:${worldHeight}px"></div>
      <div class="owl-compass" hidden><span class="owl-compass-arrow" aria-hidden="true">➤</span><span>NOTE</span></div>
    </div>
    <div class="owl-bottom">
      <div class="owl-dialog" aria-live="polite"></div>
      <div class="owl-dpad" aria-label="Move the owl">
        <button type="button" data-dx="0" data-dy="-1" aria-label="Fly up">▲</button>
        <button type="button" data-dx="-1" data-dy="0" aria-label="Fly left">◀</button>
        <button type="button" data-dx="1" data-dy="0" aria-label="Fly right">▶</button>
        <button type="button" data-dx="0" data-dy="1" aria-label="Fly down">▼</button>
      </div>
    </div>`;

  const world = overlay.querySelector(".owl-world");
  const viewport = overlay.querySelector(".owl-viewport");
  const dialog = overlay.querySelector(".owl-dialog");
  const compass = overlay.querySelector(".owl-compass");

  pathCells.forEach((key) => {
    const [c, r] = key.split(",").map(Number);
    const tile = document.createElement("div");
    tile.className = "owl-path";
    tile.style.transform = `translate(${c * CELL}px, ${r * CELL}px)`;
    world.append(tile);
  });

  const occupied = new Set([...pathCells, ...nodes.map((n) => `${n.c},${n.r}`), ...signs.map((s) => `${s.c},${s.r}`)]);
  for (let c = 0; c < COLS; c += 1) {
    for (let r = 0; r < rowCount; r += 1) {
      if (occupied.has(`${c},${r}`)) continue;
      const roll = (c * 31 + r * 17 + 7) % 100;
      if (roll >= 24) continue;
      const decor = document.createElement("div");
      decor.className = "owl-decor";
      decor.style.transform = `translate(${c * CELL}px, ${r * CELL}px)`;
      decor.innerHTML = roll < 6 ? pixelSvg(TREE_SPRITE, 40) : pixelSvg(TUFT_SPRITE, 30);
      world.append(decor);
    }
  }

  signs.forEach((sign) => {
    const el = document.createElement("div");
    el.className = "owl-sign";
    el.style.transform = `translate(${sign.c * CELL}px, ${sign.r * CELL}px)`;
    el.textContent = sign.label.toUpperCase();
    world.append(el);
  });

  nodes.forEach((node) => {
    const el = document.createElement("div");
    const hasNote = Boolean((notes[node.session.id] || "").trim());
    el.className = `owl-node${hasNote ? " has-note" : ""}${savedIds.has(node.session.id) ? " is-saved" : ""}`;
    el.style.transform = `translate(${node.c * CELL}px, ${node.r * CELL}px)`;
    el.innerHTML = pixelSvg(BOOK_SPRITE, 36);
    world.append(el);
  });

  const owl = document.createElement("div");
  owl.className = "owl-sprite";
  owl.innerHTML = `<div class="owl-body">${pixelSvg(OWL_SPRITE, 44)}</div>`;
  world.append(owl);

  const position = { c: 0, r: Math.max(signs[0].r - 1, 0) };
  let facingLeft = false;

  function nodeAt(c, r) {
    return nodes.find((node) => node.c === c && node.r === r);
  }

  // Re-rendering only when the underfoot tile changes keeps the aria-live
  // region from announcing every empty step to screen readers.
  let dialogKey = null;

  function updateDialog() {
    const node = nodeAt(position.c, position.r);
    const key = node ? node.session.id : "hint";
    if (key === dialogKey) return;
    dialogKey = key;
    dialog.replaceChildren();
    if (!node) {
      const hint = document.createElement("p");
      hint.className = "owl-line";
      hint.textContent = notedCount
        ? `HOOT! Each book below is a program item — ${notedCount} of ${nodes.length} hold your notes. Follow the gold arrow to a glowing page and land on it to read.`
        : `HOOT! This is the summit program as a night overworld — every book is a program item. Land on one to peek, and notes you write in the guide will glow here.`;
      dialog.append(hint);
      return;
    }
    const head = document.createElement("p");
    head.className = "owl-line owl-meta";
    head.textContent = [node.day.label, node.session.time, node.session.room].filter(Boolean).join(" · ").toUpperCase();
    const title = document.createElement("p");
    title.className = "owl-line owl-session";
    title.textContent = node.session.title + (savedIds.has(node.session.id) ? " ★" : "");
    dialog.append(head, title);
    if (node.session.people.length) {
      const people = document.createElement("p");
      people.className = "owl-line owl-meta";
      people.textContent = node.session.people.join(" · ");
      dialog.append(people);
    }
    const note = document.createElement("p");
    note.className = "owl-line owl-note";
    const text = (notes[node.session.id] || "").trim();
    note.textContent = text ? `“${text}”` : "No field notes on this page yet.";
    if (!text) note.classList.add("is-empty");
    dialog.append(note);
  }

  const camera = { x: 0, y: 0 };

  function updateCamera() {
    const axis = (view, span, focus) => (span <= view
      ? (view - span) / 2
      : -Math.min(Math.max(focus - view / 2, 0), span - view));
    camera.x = axis(viewport.clientWidth, worldWidth, position.c * CELL + CELL / 2);
    camera.y = axis(viewport.clientHeight, worldHeight, position.r * CELL + CELL / 2);
    world.style.transform = `translate(${camera.x}px, ${camera.y}px)`;
  }

  const notedNodes = nodes.filter((node) => (notes[node.session.id] || "").trim());

  // Edge compass: when the nearest noted page is off-camera, point at it.
  function updateCompass() {
    if (!notedNodes.length) {
      compass.hidden = true;
      return;
    }
    let best = notedNodes[0];
    let bestDistance = Infinity;
    notedNodes.forEach((node) => {
      const distance = Math.abs(node.c - position.c) + Math.abs(node.r - position.r);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = node;
      }
    });
    const targetX = camera.x + best.c * CELL + CELL / 2;
    const targetY = camera.y + best.r * CELL + CELL / 2;
    const view = { w: viewport.clientWidth, h: viewport.clientHeight };
    // A tile straddling the edge is as good as invisible — keep the arrow up
    // until at least half a cell of it is inside the camera.
    const margin = CELL / 2;
    compass.hidden = targetX > margin && targetX < view.w - margin && targetY > margin && targetY < view.h - margin;
    if (compass.hidden) return;
    const pad = 34;
    const x = Math.min(Math.max(targetX, pad), view.w - pad);
    const y = Math.min(Math.max(targetY, pad), view.h - pad);
    compass.style.left = `${x}px`;
    compass.style.top = `${y}px`;
    const angle = Math.atan2(targetY - y, targetX - x) * 180 / Math.PI;
    compass.querySelector(".owl-compass-arrow").style.transform = `rotate(${angle}deg)`;
  }

  function place() {
    owl.style.transform = `translate(${position.c * CELL}px, ${position.r * CELL}px)`;
    owl.querySelector(".owl-body").style.transform = facingLeft ? "scaleX(-1)" : "";
    updateCamera();
    updateCompass();
    updateDialog();
  }

  function move(dx, dy) {
    if (dx < 0) facingLeft = true;
    if (dx > 0) facingLeft = false;
    position.c = Math.min(Math.max(position.c + dx, 0), COLS - 1);
    position.r = Math.min(Math.max(position.r + dy, 0), rowCount - 1);
    place();
  }

  const KEY_MOVES = {
    ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
    w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0]
  };

  function onKeydown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key === "Tab") {
      const focusables = [...overlay.querySelectorAll("button")];
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      return;
    }
    const step = KEY_MOVES[event.key] || KEY_MOVES[event.key.toLowerCase?.()];
    if (step) {
      event.preventDefault();
      move(step[0], step[1]);
    }
  }

  let holdTimer = 0;
  overlay.querySelectorAll(".owl-dpad button").forEach((button) => {
    const dx = Number(button.dataset.dx);
    const dy = Number(button.dataset.dy);
    // Pointer presses step immediately and repeat while held. Keyboard and
    // screen-reader activation arrive as bare `click` events with no pointer
    // phase, so `click` must also move — but skip it right after a pointer
    // press or mouse users would step twice.
    let viaPointer = false;
    const stop = () => {
      clearInterval(holdTimer);
      setTimeout(() => { viaPointer = false; }, 0);
    };
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      viaPointer = true;
      move(dx, dy);
      clearInterval(holdTimer);
      holdTimer = setInterval(() => move(dx, dy), 170);
    });
    ["pointerup", "pointercancel", "pointerleave"].forEach((type) => button.addEventListener(type, stop));
    button.addEventListener("click", () => {
      if (viaPointer) return;
      move(dx, dy);
    });
  });

  // Everything behind the modal goes inert so keyboard and screen-reader
  // focus cannot wander the guide underneath it.
  const inertTargets = [...document.body.children].filter((el) => el !== overlay && el.tagName !== "SCRIPT");

  function close() {
    clearInterval(holdTimer);
    window.removeEventListener("keydown", onKeydown, true);
    window.removeEventListener("resize", place);
    overlay.remove();
    overlay = null;
    inertTargets.forEach((el) => el.removeAttribute("inert"));
    document.body.style.overflow = previousOverflow;
    previousFocus?.focus?.();
  }

  overlay.querySelector(".owl-close").addEventListener("click", close);
  window.addEventListener("keydown", onKeydown, true);
  window.addEventListener("resize", place);

  document.body.style.overflow = "hidden";
  document.body.append(overlay);
  inertTargets.forEach((el) => el.setAttribute("inert", ""));
  place();
  overlay.querySelector(".owl-close").focus();
}

function injectStyles() {
  if (document.getElementById("owl-style")) return;
  const style = document.createElement("style");
  style.id = "owl-style";
  style.textContent = `
/* Self-hosted so the retro face survives offline / summit wifi (OFL license). */
@font-face {
  font-family: "Press Start 2P";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("./assets/fonts/press-start-2p-latin.woff2") format("woff2");
  unicode-range: U+0000-00FF, U+2018-201A, U+201C-201E, U+2022, U+2026;
}
@font-face {
  font-family: "Press Start 2P";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("./assets/fonts/press-start-2p-latin-ext.woff2") format("woff2");
  unicode-range: U+0100-02BB, U+1E00-1EFF;
}
.owl-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  flex-direction: column;
  color: #f2efe2;
  font-family: "Press Start 2P", "Courier New", monospace;
  background-image:
    radial-gradient(1.5px 1.5px at 12% 16%, rgba(255,255,255,0.8), transparent 60%),
    radial-gradient(1px 1px at 34% 8%, rgba(255,255,255,0.55), transparent 60%),
    radial-gradient(1.5px 1.5px at 58% 22%, rgba(255,244,214,0.7), transparent 60%),
    radial-gradient(1px 1px at 76% 10%, rgba(255,255,255,0.5), transparent 60%),
    radial-gradient(1px 1px at 90% 30%, rgba(255,255,255,0.45), transparent 60%),
    radial-gradient(2px 2px at 84% 6%, rgba(255,244,214,0.8), transparent 60%),
    linear-gradient(#04100c, #082017);
}
.owl-hud {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: max(0.8rem, env(safe-area-inset-top)) 1rem 0.8rem;
  border-bottom: 3px solid #1c3b31;
}
.owl-title { margin: 0; font-size: 0.62rem; letter-spacing: 0.06em; color: #ffd98a; }
.owl-title span { display: block; margin-top: 0.45rem; color: #8fb8af; font-size: 0.5rem; }
.owl-close {
  min-height: 44px;
  padding: 0.6rem 0.9rem;
  border: 3px solid #f2efe2;
  border-radius: 4px;
  background: #12291f;
  color: #f2efe2;
  font: inherit;
  font-size: 0.55rem;
  cursor: pointer;
}
.owl-close:hover { background: #1d3f30; }
/* min-height keeps the map visible on short landscape phones, where flex:1
   over absolutely-positioned content would otherwise collapse toward zero. */
.owl-viewport { position: relative; flex: 1; overflow: hidden; min-height: 32vh; }
.owl-world {
  position: absolute;
  top: 0;
  left: 0;
  background-image: conic-gradient(#0c2114 25%, #091a10 25% 50%, #0c2114 50% 75%, #091a10 75%);
  background-size: ${CELL * 2}px ${CELL * 2}px;
  transition: transform 180ms ease;
}
.owl-path, .owl-node, .owl-decor, .owl-sign, .owl-sprite {
  position: absolute;
  top: 0;
  left: 0;
  width: ${CELL}px;
  height: ${CELL}px;
  display: grid;
  place-items: center;
}
.owl-path {
  background: #21362c;
  box-shadow: inset 0 0 0 2px #182a22, inset 0 -4px 0 #1b2e25;
}
.owl-node.has-note svg { filter: drop-shadow(0 0 7px rgba(224, 162, 60, 0.9)); }
.owl-compass {
  position: absolute;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 5px;
  transform: translate(-50%, -50%);
  color: #ffd98a;
  font-size: 0.5rem;
  letter-spacing: 0.08em;
  pointer-events: none;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.9);
  animation: owl-glow 1.6s ease-in-out infinite;
}
.owl-compass-arrow { display: inline-block; font-size: 0.75rem; }
.owl-node.has-note { animation: owl-glow 1.6s ease-in-out infinite; }
.owl-node.is-saved::after {
  content: "★";
  position: absolute;
  top: 2px;
  right: 5px;
  color: #ffd98a;
  font-size: 0.55rem;
}
.owl-sign {
  width: auto;
  min-width: ${CELL}px;
  height: ${CELL}px;
  padding: 0 6px;
  place-items: center;
  color: #e9d8ac;
  font-size: 0.5rem;
  letter-spacing: 0.08em;
  background: #4a3421;
  border: 3px solid #2b1d12;
  border-radius: 4px;
  box-shadow: 0 4px 0 #2b1d12;
  transform-origin: top left;
  scale: 0.9;
}
/* steps() keeps the hop feeling 16-bit instead of gliding. */
.owl-sprite { z-index: 3; transition: transform 160ms steps(3, end); pointer-events: none; }
.owl-sprite::after {
  content: "";
  position: absolute;
  bottom: 1px;
  width: 26px;
  height: 7px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.45);
}
.owl-body { position: relative; z-index: 1; animation: owl-bob 0.9s steps(2) infinite; }
@keyframes owl-bob { 50% { translate: 0 -3px; } }
@keyframes owl-glow { 50% { opacity: 0.75; } }
.owl-bottom {
  display: flex;
  gap: 0.9rem;
  align-items: stretch;
  padding: 0.9rem max(1rem, env(safe-area-inset-right)) max(0.9rem, env(safe-area-inset-bottom)) max(1rem, env(safe-area-inset-left));
  border-top: 3px solid #1c3b31;
  background: rgba(3, 12, 9, 0.88);
}
.owl-dialog {
  flex: 1;
  min-height: 7.25rem;
  padding: 0.9rem 1rem;
  border: 3px solid #f2efe2;
  border-radius: 6px;
  background: linear-gradient(#101d43, #1b2a66);
  box-shadow: inset 0 0 0 3px #0a1030;
  overflow-y: auto;
}
.owl-line { margin: 0 0 0.55rem; font-size: 0.6rem; line-height: 1.8; overflow-wrap: anywhere; }
.owl-meta { color: #9fb4e8; font-size: 0.55rem; }
.owl-session { color: #ffffff; }
/* The note is the payoff of the whole egg — render it in a face that stays
   readable at length instead of 9px pixel glyphs. */
.owl-note {
  color: #ffd98a;
  font-family: "Source Serif 4", Georgia, "Times New Roman", serif;
  font-size: 0.95rem;
  line-height: 1.5;
  letter-spacing: 0.01em;
}
.owl-note.is-empty { color: #8194cd; }
.owl-dpad {
  display: grid;
  grid-template-areas: ". up ." "left right right2" ". down .";
  grid-template-columns: repeat(3, 48px);
  grid-template-rows: repeat(3, 48px);
  gap: 4px;
  align-self: center;
}
.owl-dpad button:nth-child(1) { grid-area: up; }
.owl-dpad button:nth-child(2) { grid-area: left; }
.owl-dpad button:nth-child(3) { grid-column: 3; grid-row: 2; }
.owl-dpad button:nth-child(4) { grid-area: down; }
.owl-dpad button {
  border: 3px solid #f2efe2;
  border-radius: 6px;
  background: #12291f;
  color: #f2efe2;
  font-size: 0.7rem;
  cursor: pointer;
  touch-action: none;
}
.owl-dpad button:active { background: #275444; }
@media (max-width: 40rem) {
  .owl-bottom { flex-direction: column; }
  .owl-dpad { align-self: center; }
  .owl-dialog { min-height: 6rem; }
}
/* Landscape phones: shrink the chrome so the map keeps most of the screen. */
@media (max-height: 30rem) {
  .owl-dialog { min-height: 4.5rem; }
  .owl-dpad { grid-template-columns: repeat(3, 44px); grid-template-rows: repeat(3, 44px); }
  .owl-bottom { padding-top: 0.5rem; padding-bottom: max(0.5rem, env(safe-area-inset-bottom)); }
}
/* The egg owns its reduced-motion guarantee rather than borrowing the
   app-level reset, which could be rescoped without noticing this overlay. */
@media (prefers-reduced-motion: reduce) {
  .owl-world, .owl-sprite { transition: none; }
  .owl-body, .owl-node.has-note, .owl-compass { animation: none; }
}
`;
  document.head.append(style);
}
