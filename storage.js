const SCHEMA_VERSION = 2;

function emptyState() {
  return { schemaVersion: SCHEMA_VERSION, sessionNotes: {}, quickNotes: "" };
}

function normalize(value) {
  const source = value && typeof value === "object" ? value : {};
  return {
    schemaVersion: SCHEMA_VERSION,
    sessionNotes: source.sessionNotes && typeof source.sessionNotes === "object"
      ? Object.fromEntries(Object.entries(source.sessionNotes).filter(([id, note]) => typeof id === "string" && typeof note === "string"))
      : {},
    quickNotes: typeof source.quickNotes === "string" ? source.quickNotes : ""
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
      // A device may still hold notes under an older schema key (e.g. the v1
      // bookmark-era shape). Carry sessionNotes/quickNotes forward instead of
      // silently losing them the first time this schema version loads.
      const legacyKey = `${prefix}_attendee_state_v1`;
      const legacy = localStorage.getItem(legacyKey);
      if (legacy !== null) {
        state = normalize(JSON.parse(legacy));
        localStorage.setItem(key, JSON.stringify(state));
        localStorage.removeItem(legacyKey);
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
    setQuickNotes(note) {
      state.quickNotes = note;
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

