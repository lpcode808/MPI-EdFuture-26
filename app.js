import { EVENT } from "./data/event.js";
import { DAYS, SESSIONS } from "./data/schedule.js";
import { createStore } from "./storage.js";

const store = createStore(EVENT.storagePrefix);
const tabs = [...document.querySelectorAll('[role="tab"]')];
const panels = [...document.querySelectorAll('[role="tabpanel"]')];
const agendaList = document.querySelector("#agendaList");
const savedList = document.querySelector("#savedList");
const searchInput = document.querySelector("#agendaSearch");
const quickNotes = document.querySelector("#quickNotes");
const dayFilters = document.querySelector("#dayFilters");
const template = document.querySelector("#sessionTemplate");
let activeDay = "all";
// Which sessions have their note editor open. Lives outside the render cycle
// so a search keystroke or bookmark toggle doesn't silently fold editors shut.
const openNoteIds = new Set();

function matchesSearch(session, query) {
  if (!query) return true;
  return [session.title, session.room, session.kind, ...session.people]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase()
    .includes(query.toLocaleLowerCase());
}

function filteredSessions() {
  const query = searchInput.value.trim();
  return SESSIONS.filter((session) => (activeDay === "all" || session.dayId === activeDay) && matchesSearch(session, query));
}

function sessionCard(session) {
  const state = store.get();
  const node = template.content.firstElementChild.cloneNode(true);
  const isSaved = state.savedSessionIds.includes(session.id);
  const day = DAYS.find((item) => item.id === session.dayId);
  node.dataset.sessionId = session.id;
  node.classList.toggle("is-break", session.kind === "break");
  node.querySelector(".session-time").textContent = session.time;
  node.querySelector("h3").textContent = session.title;
  node.querySelector(".kind-label").textContent = `${day.label} · ${session.kind}`;
  const room = node.querySelector(".room");
  room.textContent = session.room || "";
  room.hidden = !session.room;
  const people = node.querySelector(".people");
  people.textContent = session.people.join(" · ");
  people.hidden = session.people.length === 0;

  const saveButton = node.querySelector(".save-button");
  saveButton.classList.toggle("is-saved", isSaved);
  saveButton.setAttribute("aria-pressed", String(isSaved));
  saveButton.querySelector("span").textContent = `${isSaved ? "Remove" : "Save"} ${session.title} ${isSaved ? "from" : "to"} my plan`;
  saveButton.addEventListener("click", () => {
    const container = node.closest("#savedList") ? savedList : agendaList;
    store.toggleSaved(session.id);
    renderAll();
    // The agenda fallback only works while its panel is visible; a hidden
    // panel's buttons refuse focus and keyboard users get dumped to <body>.
    const agendaVisible = !agendaList.closest(".panel").hidden;
    const replacement = container.querySelector(`[data-session-id="${session.id}"] .save-button`)
      || (agendaVisible && agendaList.querySelector(`[data-session-id="${session.id}"] .save-button`))
      || container.querySelector(".save-button")
      || document.querySelector("#tab-saved");
    replacement?.focus();
  });

  const noteButton = node.querySelector(".note-button");
  const noteField = node.querySelector(".session-notes");
  const textarea = noteField.querySelector("textarea");
  textarea.value = state.sessionNotes[session.id] || "";
  noteField.hidden = !openNoteIds.has(session.id);
  noteButton.setAttribute("aria-expanded", String(!noteField.hidden));
  noteButton.querySelector("span").textContent = `Add a private note for ${session.title}`;
  noteButton.addEventListener("click", () => {
    if (noteField.hidden) openNoteIds.add(session.id);
    else openNoteIds.delete(session.id);
    noteField.hidden = !noteField.hidden;
    noteButton.setAttribute("aria-expanded", String(!noteField.hidden));
    if (!noteField.hidden) textarea.focus();
  });
  textarea.addEventListener("input", () => store.setSessionNote(session.id, textarea.value));
  return node;
}

function renderAgenda() {
  const sessions = filteredSessions();
  agendaList.replaceChildren();
  document.querySelector("#agendaStatus").textContent = `${sessions.length} program item${sessions.length === 1 ? "" : "s"}`;

  if (!sessions.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = "<h2>No program items match.</h2><p>Try another day or a shorter search.</p>";
    agendaList.append(empty);
    return;
  }

  DAYS.forEach((day) => {
    const daySessions = sessions.filter((session) => session.dayId === day.id);
    if (!daySessions.length) return;
    const section = document.createElement("section");
    section.className = "day-group";
    section.innerHTML = `<header class="day-heading"><div><p>${day.label} · ${new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(new Date(`${day.date}T12:00:00-10:00`))}</p><h2>${day.title}</h2></div><span>${day.theme}</span></header>`;
    const rows = document.createElement("div");
    rows.className = "session-list";
    daySessions.forEach((session) => rows.append(sessionCard(session)));
    section.append(rows);
    agendaList.append(section);
  });
}

function renderSaved() {
  const state = store.get();
  const saved = SESSIONS.filter((session) => state.savedSessionIds.includes(session.id));
  savedList.replaceChildren();
  document.querySelector("#savedCount").textContent = saved.length;
  document.querySelector("#savedCount").setAttribute("aria-label", `${saved.length} saved`);
  if (!saved.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state saved-empty";
    empty.innerHTML = '<span aria-hidden="true">◇</span><h3>Your plan is open.</h3><p>Use the bookmark beside any program item to collect it here.</p>';
    savedList.append(empty);
  } else {
    DAYS.forEach((day) => {
      const items = saved.filter((session) => session.dayId === day.id);
      if (!items.length) return;
      const section = document.createElement("section");
      section.className = "saved-day";
      section.innerHTML = `<h3>${day.label} · ${day.title}</h3>`;
      items.forEach((session) => section.append(sessionCard(session)));
      savedList.append(section);
    });
  }
  // Assigning .value unconditionally would collapse the caret to the end on
  // every unrelated re-render (e.g. bookmarking while a note is mid-edit).
  if (quickNotes.value !== state.quickNotes) quickNotes.value = state.quickNotes;
}

function renderAll() {
  renderAgenda();
  renderSaved();
}

function activateTab(tab) {
  tabs.forEach((item) => {
    const selected = item === tab;
    item.setAttribute("aria-selected", String(selected));
    item.tabIndex = selected ? 0 : -1;
  });
  panels.forEach((panel) => { panel.hidden = panel.id !== tab.getAttribute("aria-controls"); });
  history.replaceState(null, "", `#${tab.id.replace("tab-", "")}`);
}

tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => activateTab(tab));
  tab.addEventListener("keydown", (event) => {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = tabs.length - 1;
    if (next !== index) {
      event.preventDefault();
      tabs[next].focus();
      activateTab(tabs[next]);
    }
  });
});

[{ id: "all", label: "Both days" }, ...DAYS].forEach((day) => {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = day.label;
  button.className = "day-filter";
  button.setAttribute("aria-pressed", String(day.id === activeDay));
  button.addEventListener("click", () => {
    activeDay = day.id;
    dayFilters.querySelectorAll("button").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
    renderAgenda();
  });
  dayFilters.append(button);
});

searchInput.addEventListener("input", renderAgenda);
quickNotes.addEventListener("input", () => store.setQuickNotes(quickNotes.value));

document.querySelector("#exportButton").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(store.exportEnvelope(EVENT.id), null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "edfuture-2026-plan.json";
  link.click();
  URL.revokeObjectURL(link.href);
});

document.querySelector("#importInput").addEventListener("change", async (event) => {
  const status = document.querySelector("#importStatus");
  try {
    const envelope = JSON.parse(await event.target.files[0].text());
    if (envelope.format !== "edfuture-guide-backup" || envelope.eventId !== EVENT.id) throw new Error("wrong backup format");
    store.replace(envelope.data);
    status.textContent = "Backup imported.";
    renderAll();
  } catch {
    status.textContent = "That file is not a valid EdFuture 2026 backup.";
  } finally {
    event.target.value = "";
  }
});

document.querySelector("#shareButton").addEventListener("click", async () => {
  const data = { title: EVENT.name, text: "2026 EdFuture Summit pocket program", url: EVENT.appUrl };
  const shareButton = document.querySelector("#shareButton");
  if (navigator.share) {
    try { await navigator.share(data); } catch { /* User dismissed share. */ }
  } else {
    try {
      await navigator.clipboard.writeText(EVENT.appUrl);
      shareButton.textContent = "Guide link copied";
      setTimeout(() => { shareButton.textContent = "Share this guide"; }, 4000);
    } catch {
      // Clipboard was denied: leave the raw URL visible so it can be copied by hand.
      shareButton.textContent = EVENT.appUrl;
    }
  }
});

document.querySelector("#sourceStatus").textContent = EVENT.dataStatus.message;
document.querySelector("#sessionCount").textContent = SESSIONS.length;

// Easter egg: five quick taps on the brand mark (or typing "owl") opens the
// Night Flight overworld. Loaded lazily so the base guide pays no cost.
function summonOwl() {
  import("./owl.js").then((module) => module.openOwlMode(store)).catch(() => {});
}

let owlTaps = 0;
let owlTapTimer = 0;
document.querySelector(".brand").addEventListener("click", (event) => {
  owlTaps += 1;
  clearTimeout(owlTapTimer);
  owlTapTimer = setTimeout(() => { owlTaps = 0; }, 1500);
  // The first tap behaves as the normal home link; once a streak is going,
  // swallow navigation so rapid taps don't thrash tab and scroll state.
  if (owlTaps > 1) event.preventDefault();
  if (owlTaps >= 5) {
    owlTaps = 0;
    summonOwl();
  }
});

let owlKeyBuffer = "";
window.addEventListener("keydown", (event) => {
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  if (event.target.closest?.("input, textarea, [contenteditable]")) return;
  if (event.key.length !== 1) return;
  owlKeyBuffer = (owlKeyBuffer + event.key.toLowerCase()).slice(-3);
  if (owlKeyBuffer === "owl") {
    owlKeyBuffer = "";
    summonOwl();
  }
});

function activateTabFromHash() {
  const requestedTab = tabs.find((tab) => tab.id === `tab-${location.hash.slice(1)}`);
  if (requestedTab) activateTab(requestedTab);
}

window.addEventListener("hashchange", activateTabFromHash);
activateTabFromHash();
renderAll();

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("./sw.js");
}

