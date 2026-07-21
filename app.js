import { EVENT } from "./data/event.js";
import { DAYS, SESSIONS } from "./data/schedule.js";
import { createStore } from "./storage.js";

const store = createStore(EVENT.storagePrefix);
const tabs = [...document.querySelectorAll('[role="tab"]')];
const panels = [...document.querySelectorAll('[role="tabpanel"]')];
const agendaList = document.querySelector("#agendaList");
const peopleList = document.querySelector("#peopleList");
const notesList = document.querySelector("#notesList");
const searchInput = document.querySelector("#agendaSearch");
const quickNotes = document.querySelector("#quickNotes");
const dayFilters = document.querySelector("#dayFilters");
const template = document.querySelector("#sessionTemplate");
let activeDay = "all";
// Which sessions have their note editor open in the Program tab. Lives outside
// the render cycle so a search keystroke doesn't silently fold editors shut.
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

// `forceOpen` renders the note field open with no toggle, for the Notes tab
// (which only lists sessions that already have a note attached to them).
function sessionCard(session, { forceOpen = false } = {}) {
  const state = store.get();
  const node = template.content.firstElementChild.cloneNode(true);
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

  const noteToggle = node.querySelector(".note-toggle");
  const noteLabel = noteToggle.querySelector(".note-label");
  const noteBody = node.querySelector(".note-body");
  const textarea = noteBody.querySelector("textarea");
  const status = noteBody.querySelector("small");
  const saveButton = noteBody.querySelector(".note-save");

  const saved = state.sessionNotes[session.id] || "";
  const hasNote = saved.trim().length > 0;
  textarea.value = saved;
  noteLabel.textContent = hasNote ? "Edit note" : "Add a note";
  noteToggle.classList.toggle("has-note", hasNote);
  noteBody.hidden = forceOpen ? false : !openNoteIds.has(session.id);
  noteToggle.setAttribute("aria-expanded", String(!noteBody.hidden));

  function saveAndSync() {
    const text = textarea.value;
    store.setSessionNote(session.id, text);
    updateNotesCount();
    const nowHasNote = text.trim().length > 0;
    noteLabel.textContent = nowHasNote ? "Edit note" : "Add a note";
    noteToggle.classList.toggle("has-note", nowHasNote);
    status.textContent = "Saved on this device.";
    status.classList.remove("unsaved");
    // The same session can render as a second card in the Notes tab. Typing
    // never re-renders, but a save should keep both copies in sync.
    document.querySelectorAll(`[data-session-id="${session.id}"] textarea`).forEach((twin) => {
      if (twin !== textarea && twin.value !== text) twin.value = text;
    });
    document.querySelectorAll(`[data-session-id="${session.id}"] .note-toggle`).forEach((twinToggle) => {
      if (twinToggle !== noteToggle) {
        twinToggle.classList.toggle("has-note", nowHasNote);
        const twinLabel = twinToggle.querySelector(".note-label");
        if (twinLabel) twinLabel.textContent = nowHasNote ? "Edit note" : "Add a note";
      }
    });
  }

  noteToggle.addEventListener("click", () => {
    const opening = noteBody.hidden;
    if (opening) openNoteIds.add(session.id);
    else openNoteIds.delete(session.id);
    noteBody.hidden = !opening;
    noteToggle.setAttribute("aria-expanded", String(!noteBody.hidden));
    if (!noteBody.hidden) textarea.focus();
  });

  saveButton.addEventListener("click", () => {
    saveAndSync();
    textarea.focus();
  });

  textarea.addEventListener("input", () => {
    status.textContent = "Not saved yet.";
    status.classList.add("unsaved");
  });

  textarea.addEventListener("blur", () => {
    // Save when the user leaves the field, so tapping outside doesn't lose text.
    saveAndSync();
  });

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

function goToSession(query) {
  searchInput.value = query;
  activateTab(document.querySelector("#tab-agenda"));
  renderAgenda();
  agendaList.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderPeople() {
  const directory = new Map();
  SESSIONS.forEach((session) => {
    session.people.forEach((person) => {
      if (!directory.has(person)) directory.set(person, []);
      directory.get(person).push(session);
    });
  });
  const people = [...directory.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  peopleList.replaceChildren();
  if (!people.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = "<h2>No presenters yet.</h2><p>Named presenters will appear here as the program is confirmed.</p>";
    peopleList.append(empty);
    return;
  }

  const list = document.createElement("div");
  list.className = "people-directory";
  people.forEach(([person, sessions]) => {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "people-row";
    const sessionLabel = sessions
      .map((session) => `${DAYS.find((day) => day.id === session.dayId).label} · ${session.time} · ${session.title}`)
      .join(" · ");
    row.innerHTML = `<span class="people-row-name">${person}</span><span class="people-row-sessions">${sessionLabel}</span>`;
    row.addEventListener("click", () => goToSession(person));
    list.append(row);
  });
  peopleList.append(list);
}

function updateNotesCount() {
  const state = store.get();
  const count = Object.values(state.sessionNotes).filter((note) => note.trim()).length;
  const badge = document.querySelector("#notesCount");
  badge.textContent = count;
  badge.setAttribute("aria-label", `${count} note${count === 1 ? "" : "s"}`);
}

function renderNotes() {
  const state = store.get();
  const noted = SESSIONS.filter((session) => (state.sessionNotes[session.id] || "").trim());
  notesList.replaceChildren();
  updateNotesCount();
  if (!noted.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state saved-empty";
    empty.innerHTML = '<span aria-hidden="true">◇</span><h3>No notes yet.</h3><p>Open the note icon beside any program item to jot something down — it shows up here.</p>';
    notesList.append(empty);
  } else {
    DAYS.forEach((day) => {
      const items = noted.filter((session) => session.dayId === day.id);
      if (!items.length) return;
      const section = document.createElement("section");
      section.className = "saved-day";
      section.innerHTML = `<h3>${day.label} · ${day.title}</h3>`;
      items.forEach((session) => section.append(sessionCard(session, { forceOpen: true })));
      notesList.append(section);
    });
  }
  // Assigning .value unconditionally would collapse the caret to the end on
  // every unrelated re-render (e.g. typing a session note while quick notes
  // are also open).
  if (quickNotes.value !== state.quickNotes) quickNotes.value = state.quickNotes;
}

function renderAll() {
  renderAgenda();
  renderPeople();
  renderNotes();
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
quickNotes.addEventListener("input", () => {
  store.setQuickNotes(quickNotes.value);
  updateNotesCount();
});

document.querySelector("#exportButton").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(store.exportEnvelope(EVENT.id), null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "edfuture-2026-notes.json";
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

const storageBanner = document.querySelector("#storageBanner");
const storageBannerKey = `${EVENT.storagePrefix}_storage_banner_dismissed`;
try {
  if (!localStorage.getItem(storageBannerKey)) storageBanner.hidden = false;
} catch {
  // If localStorage can't even be read, still surface the notice.
  storageBanner.hidden = false;
}
document.querySelector("#storageBannerClose").addEventListener("click", () => {
  storageBanner.hidden = true;
  try { localStorage.setItem(storageBannerKey, "1"); } catch { /* Private browsing may block this; the banner just reappears next visit. */ }
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

