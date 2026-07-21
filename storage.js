const SCHEMA_VERSION = 3;

function makeId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`;
}

function emptyState() {
  return { schemaVersion: SCHEMA_VERSION, sessionNotes: {}, personNotes: {}, quickNotes: [] };
}

function normalizeNotes(notes) {
  if (!notes || typeof notes !== "object") return {};
  return Object.fromEntries(Object.entries(notes).filter(([id, note]) => typeof id === "string" && typeof note === "string"));
}

function normalizeQuickNotes(source) {
  if (Array.isArray(source)) {
    return source
      .map((item) => {
        if (typeof item === "string") return { id: makeId(), text: item, createdAt: new Date().toISOString() };
        if (item && typeof item === "object" && typeof item.text === "string") {
          return { id: typeof item.id === "string" ? item.id : makeId(), text: item.text, createdAt: typeof item.createdAt === "string" ? item.createdAt : new Date().toISOString() };
        }
        return null;
      })
      .filter(Boolean);
  }
  if (typeof source === "string" && source.trim()) {
    return [{ id: makeId(), text: source, createdAt: new Date().toISOString() }];
  }
  return [];
}

function normalize(value) {
  const source = value && typeof value === "object" ? value : {};
  return {
    schemaVersion: SCHEMA_VERSION,
    sessionNotes: normalizeNotes(source.sessionNotes),
    personNotes: normalizeNotes(source.personNotes),
    quickNotes: normalizeQuickNotes(source.quickNotes)
  };
}

export function createStore(prefix) {
  const key = `${prefix}_attendee_state_v${SCHEMA_VERSION}`;
  let state = emptyState();

  try {
    const stored = localStorage.getItem(key);
    if (stored !== null) {
      state = normalize(JSON.parse(stored));
    } else {
      // A device may still hold notes under older schema keys. Carry forward
      // whatever can be mapped cleanly instead of silently losing attendee data.
      for (const version of [2, 1]) {
        const legacyKey = `${prefix}_attendee_state_v${version}`;
        const legacy = localStorage.getItem(legacyKey);
        if (legacy !== null) {
          state = normalize(JSON.parse(legacy));
          localStorage.setItem(key, JSON.stringify(state));
          localStorage.removeItem(legacyKey);
          break;
        }
      }
    }
  } catch {
    state = emptyState();
  }

  function persist() {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // The guide remains usable when storage is unavailable.
    }
  }

  return {
    get: () => structuredClone(state),
    setSessionNote(id, note) {
      state.sessionNotes[id] = note;
      persist();
    },
    setPersonNote(id, note) {
      state.personNotes[id] = note;
      persist();
    },
    addQuickNote(text) {
      const item = { id: makeId(), text, createdAt: new Date().toISOString() };
      state.quickNotes.push(item);
      persist();
      return item.id;
    },
    updateQuickNote(id, text) {
      const item = state.quickNotes.find((entry) => entry.id === id);
      if (item) {
        item.text = text;
        persist();
      }
    },
    deleteQuickNote(id) {
      state.quickNotes = state.quickNotes.filter((entry) => entry.id !== id);
      persist();
    },
    exportEnvelope(eventId) {
      return { format: "edfuture-guide-backup", eventId, exportedAt: new Date().toISOString(), data: normalize(state) };
    },
    replace(value) {
      state = normalize(value);
      persist();
      return structuredClone(state);
    }
  };
}

export { normalize as normalizeStoredState };

