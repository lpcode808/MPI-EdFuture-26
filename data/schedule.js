export const DAYS = Object.freeze([
  { id: "day-1", date: "2026-07-21", label: "Day 1", title: "Community", theme: "Understanding the landscape of AI" },
  { id: "day-2", date: "2026-07-22", label: "Day 2", title: "Education", theme: "World ready learners" }
]);

export const SESSIONS = Object.freeze([
  { id: "d1-welcome", dayId: "day-1", time: "8:00am", title: "Welcome", room: "Bakken Auditorium", kind: "program", people: [] },
  { id: "d1-advisory-panel", dayId: "day-1", time: "8:15am", title: "AI Advisory Council Panel", room: "Bakken Auditorium", kind: "panel", people: [] },
  { id: "d1-break-1", dayId: "day-1", time: "9:10am", title: "Break", room: null, kind: "break", people: [] },
  { id: "d1-world-cafe", dayId: "day-1", time: "9:20am", title: "World Café Activity", room: "Wood Hall", kind: "activity", people: [] },
  { id: "d1-break-2", dayId: "day-1", time: "10:30am", title: "Break", room: null, kind: "break", people: [] },
  { id: "d1-case-studies-1", dayId: "day-1", time: "10:40am", title: "AI in Action: Case Studies", room: "Bakken Auditorium", kind: "session", people: ["Jason D’Olier", "Chris Baze"] },
  { id: "d1-lunch", dayId: "day-1", time: "11:45am", title: "Lunch sponsored by Bank of Hawaiʻi", room: "Wood Hall", kind: "meal", people: [] },
  { id: "d1-yoga", dayId: "day-1", time: "12:30pm", title: "Yoga Refresh", room: "Wood Hall", kind: "activity", people: [] },
  { id: "d1-code-ai-thon", dayId: "day-1", time: "12:50pm", title: "code-AI-thon Student Showcase", room: "Wood Hall", kind: "showcase", people: [] },
  { id: "d1-vibe-coding", dayId: "day-1", time: "1:20pm", title: "Vibe Coding", room: "Wood Hall", kind: "session", people: ["Justin Lai"] },
  { id: "d1-break-3", dayId: "day-1", time: "1:50pm", title: "Break", room: null, kind: "break", people: [] },
  { id: "d1-case-studies-2", dayId: "day-1", time: "2:00pm", title: "AI in Action: Case Studies", room: "Bakken Auditorium", kind: "session", people: ["Emile Loza de Siles", "Alexi Drouin"] },
  { id: "d1-break-4", dayId: "day-1", time: "3:00pm", title: "Break", room: null, kind: "break", people: [] },
  { id: "d1-google-cloud", dayId: "day-1", time: "3:10pm", title: "Google Cloud — Session by Google", room: "Bakken Auditorium", kind: "session", people: [] },

  { id: "d2-welcome", dayId: "day-2", time: "8:00am", title: "Welcome", room: "Scudder / Bakken Auditorium", kind: "program", people: [] },
  { id: "d2-keynote", dayId: "day-2", time: "8:15am", title: "Keynote", room: "Bakken Auditorium", kind: "keynote", people: ["Mark Sparvell"] },
  { id: "d2-school-share", dayId: "day-2", time: "9:00am", title: "School Share Session", room: "Bakken Auditorium", kind: "session", people: ["Justin Lai — Hawaiʻi School for Girls", "Gabe Yanagihara — Iolani School", "Mimi Wong/Bhonna Nakama — Kamehameha Schools", "Shane Asselstine — HIDOE", "Sydney T, Ray L — Mid-Pacific Institute"] },
  { id: "d2-break-1", dayId: "day-2", time: "10:00am", title: "Break", room: null, kind: "break", people: [] },
  { id: "d2-k12-table-walk", dayId: "day-2", time: "10:15am", title: "K–12 School Share Table Walk", room: "Wood Hall", kind: "activity", people: [] },
  { id: "d2-break-2", dayId: "day-2", time: "10:45am", title: "Break", room: null, kind: "break", people: [] },
  { id: "d2-innovators", dayId: "day-2", time: "11:00am", title: "AI Innovators and Owlgorithms Club", room: "Bakken Auditorium", kind: "showcase", people: [] },
  { id: "d2-lunch", dayId: "day-2", time: "11:30am", title: "Lunch sponsored by Bank of Hawaiʻi", room: "Wood Hall", kind: "meal", people: [] },
  { id: "d2-google-education", dayId: "day-2", time: "12:30pm", title: "Google Education — Session by Google", room: "Bakken Auditorium", kind: "session", people: [] },
  { id: "d2-dance", dayId: "day-2", time: "1:15pm", title: "Dance Activity", room: "Wood Hall", kind: "activity", people: [] },
  { id: "d2-break-3", dayId: "day-2", time: "1:30pm", title: "Break", room: null, kind: "break", people: [] },
  { id: "d2-higher-ed-panel", dayId: "day-2", time: "1:40pm", title: "Higher Education Panel", room: "Bakken Auditorium", kind: "panel", people: [] },
  { id: "d2-higher-ed-table-walk", dayId: "day-2", time: "2:40pm", title: "Higher Ed Share Table Walk", room: "Wood Hall", kind: "activity", people: [] },
  { id: "d2-feedback", dayId: "day-2", time: "3:15pm", title: "Share & Feedback", room: "Wood Hall", kind: "activity", people: [] },
  { id: "d2-social", dayId: "day-2", time: "3:30pm", title: "Social sponsored by Google", room: "Wood Hall", kind: "social", people: [] }
].map((session, order) => Object.freeze({ ...session, order, source: `provided-${session.dayId}-program-image` })));

