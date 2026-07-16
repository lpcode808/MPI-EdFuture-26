const SCHEMA_VERSION = 1;

function emptyState() {
  return { schemaVersion: SCHEMA_VERSION, savedSessionIds: [], sessionNotes: {}, quickNotes: "" };
}

function normalize(value) {
  const source = value && typeof value === "object" ? value : {};
  return {
    schemaVersion: SCHEMA_VERSION,
    savedSessionIds: Array.isArray(source.savedSessionIds)
      ? [...new Set(source.savedSessionIds.filter((id) => typeof id === "string"))]
      : [],
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
    state = normalize(JSON.parse(localStorage.getItem(key)));
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
    toggleSaved(id) {
      const saved = new Set(state.savedSessionIds);
      saved.has(id) ? saved.delete(id) : saved.add(id);
      state.savedSessionIds = [...saved];
      persist();
      return state.savedSessionIds.includes(id);
    },
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

