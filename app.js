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
const quickNotesList = document.querySelector("#quickNotesList");
const addQuickNote = document.querySelector("#addQuickNote");
const dayFilters = document.querySelector("#dayFilters");
const template = document.querySelector("#sessionTemplate");
let activeDay = "all";
// Which sessions have their note editor open in the Program tab. Lives outside
// the render cycle so a search keystroke doesn't silently fold editors shut.
const openNoteIds = new Set();
// Which people have their note editor open in the People tab.
const openPersonIds = new Set();

// Treat names with a " — School/Org" suffix as the same person as the bare name.
function canonicalName(person) {
  const match = person.match(/(.+?)\s+[—–-]\s+/);
  return match ? match[1].trim() : person.trim();
}

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
      const key = canonicalName(person);
      if (!directory.has(key)) directory.set(key, { displayName: key, sessions: [] });
      directory.get(key).sessions.push(session);
    });
  });
  const people = [...directory.values()].sort((a, b) => a.displayName.localeCompare(b.displayName));
  const state = store.get();

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
  people.forEach((person) => {
    const saved = state.personNotes[person.displayName] || "";
    const hasNote = saved.trim().length > 0;
    const row = document.createElement("div");
    row.className = "people-row";
    row.dataset.personId = person.displayName;
    const sessionLabel = person.sessions
      .map((session) => `${DAYS.find((day) => day.id === session.dayId).label} · ${session.time} · ${session.title}`)
      .join(" · ");

    const main = document.createElement("button");
    main.type = "button";
    main.className = "people-row-main";
    main.innerHTML = `<span class="people-row-name">${person.displayName}</span><span class="people-row-sessions">${sessionLabel}</span>`;
    main.addEventListener("click", () => goToSession(person.displayName));

    const noteToggle = document.createElement("button");
    noteToggle.type = "button";
    noteToggle.className = "note-toggle people-note-toggle";
    noteToggle.setAttribute("aria-expanded", String(openPersonIds.has(person.displayName)));
    noteToggle.innerHTML = `<span class="note-label">${hasNote ? "Edit note" : "Add a note"}</span><span class="note-chevron" aria-hidden="true"></span>`;

    const noteBody = document.createElement("div");
    noteBody.className = "note-body";
    noteBody.hidden = !openPersonIds.has(person.displayName);
    noteBody.innerHTML = `<label class="notes-field person-notes"><span>Private note for ${person.displayName}</span><textarea rows="3" placeholder="What to ask, what stood out, how to follow up…"></textarea><div class="note-actions"><small>Saved on this device.</small><button class="note-save" type="button">Save note</button></div></label>`;
    const textarea = noteBody.querySelector("textarea");
    const status = noteBody.querySelector("small");
    textarea.value = saved;
    noteToggle.classList.toggle("has-note", hasNote);

    function saveAndSyncPerson() {
      const text = textarea.value;
      store.setPersonNote(person.displayName, text);
      updateNotesCount();
      const nowHasNote = text.trim().length > 0;
      noteToggle.querySelector(".note-label").textContent = nowHasNote ? "Edit note" : "Add a note";
      noteToggle.classList.toggle("has-note", nowHasNote);
      status.textContent = "Saved on this device.";
      status.classList.remove("unsaved");
    }

    noteToggle.addEventListener("click", () => {
      const opening = noteBody.hidden;
      if (opening) openPersonIds.add(person.displayName);
      else openPersonIds.delete(person.displayName);
      noteBody.hidden = !opening;
      noteToggle.setAttribute("aria-expanded", String(!noteBody.hidden));
      if (!noteBody.hidden) textarea.focus();
    });

    noteBody.querySelector(".note-save").addEventListener("click", () => {
      saveAndSyncPerson();
      textarea.focus();
    });

    textarea.addEventListener("input", () => {
      status.textContent = "Not saved yet.";
      status.classList.add("unsaved");
    });

    textarea.addEventListener("blur", () => {
      saveAndSyncPerson();
    });

    row.append(main, noteToggle, noteBody);
    list.append(row);
  });
  peopleList.append(list);
}

function noteCount() {
  const state = store.get();
  const sessionCount = Object.values(state.sessionNotes).filter((note) => note.trim()).length;
  const personCount = Object.values(state.personNotes).filter((note) => note.trim()).length;
  const quickCount = state.quickNotes.filter((item) => item.text.trim()).length;
  return sessionCount + personCount + quickCount;
}

function updateNotesCount() {
  const count = noteCount();
  const badge = document.querySelector("#notesCount");
  badge.textContent = count;
  badge.setAttribute("aria-label", `${count} note${count === 1 ? "" : "s"}`);
}

function renderQuickNotes() {
  const state = store.get();
  quickNotesList.replaceChildren();
  if (!state.quickNotes.length) {
    const empty = document.createElement("p");
    empty.className = "quick-notes-empty";
    empty.textContent = "No quick notes yet. Tap Add quick note to start one.";
    quickNotesList.append(empty);
    return;
  }

  state.quickNotes.forEach((item) => {
    const note = document.createElement("div");
    note.className = "quick-note-item";
    note.dataset.quickNoteId = item.id;

    const label = document.createElement("label");
    label.className = "notes-field";
    const title = document.createElement("span");
    title.textContent = "Quick note";
    const textarea = document.createElement("textarea");
    textarea.rows = 3;
    textarea.placeholder = "Question, idea, or reminder…";
    textarea.value = item.text;
    const actions = document.createElement("div");
    actions.className = "note-actions";
    const status = document.createElement("small");
    status.textContent = "Saved on this device.";
    const saveButton = document.createElement("button");
    saveButton.type = "button";
    saveButton.className = "note-save";
    saveButton.textContent = "Save note";
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "note-delete";
    deleteButton.textContent = "Delete";
    actions.append(status, saveButton, deleteButton);
    label.append(title, textarea, actions);
    note.append(label);

    function save() {
      store.updateQuickNote(item.id, textarea.value);
      updateNotesCount();
      status.textContent = "Saved on this device.";
      status.classList.remove("unsaved");
    }

    textarea.addEventListener("input", () => {
      status.textContent = "Not saved yet.";
      status.classList.add("unsaved");
    });

    saveButton.addEventListener("click", () => {
      save();
      textarea.focus();
    });

    textarea.addEventListener("blur", save);
    deleteButton.addEventListener("click", () => {
      store.deleteQuickNote(item.id);
      renderQuickNotes();
      updateNotesCount();
    });

    quickNotesList.append(note);
  });
}

function renderNotes() {
  const state = store.get();
  const noted = SESSIONS.filter((session) => (state.sessionNotes[session.id] || "").trim());
  notesList.replaceChildren();
  updateNotesCount();
  if (!noted.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state saved-empty";
    empty.innerHTML = '<span aria-hidden="true">◇</span><h3>No session notes yet.</h3><p>Open the note icon beside any program item to jot something down — it shows up here.</p>';
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
  renderQuickNotes();
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
addQuickNote.addEventListener("click", () => {
  const id = store.addQuickNote("");
  renderQuickNotes();
  const newItem = quickNotesList.querySelector(`[data-quick-note-id="${id}"]`);
  if (newItem) newItem.querySelector("textarea").focus();
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

