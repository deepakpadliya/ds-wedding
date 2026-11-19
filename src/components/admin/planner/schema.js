// Client-side description of each planner section. The server (server/planner.js) owns validation;
// this file only says what to show and which inputs to offer.
//   type: text · textarea · number · money · date · time · bool · enum
//   table: false hides a field from the list (it still appears in the add/edit form)
export const PAYMENT_CATEGORIES = ["Venue", "Food", "Photography", "Decor & Events", "Music & Dhol", "Clothes", "Jewellery", "Mehandi & Beauty", "Printing", "Rituals & Pooja", "Travel", "Other"];

const opts = (...v) => v.map((x) => (Array.isArray(x) ? { value: x[0], label: x[1] } : { value: x, label: x }));

export const MEAL_SLOTS = [
  ["d10b", "10 Dec · Breakfast"], ["d10l", "10 Dec · Lunch"], ["d10n", "10 Dec · Night"],
  ["d11b", "11 Dec · Breakfast"], ["d11l", "11 Dec · Lunch"], ["d11d", "11 Dec · Dinner"],
  ["d12b", "12 Dec · Breakfast"], ["d12m", "12 Dec · Morning"], ["d12d", "12 Dec · Dinner"],
];

const WEDDING_DAYS = ["2026-12-10", "2026-12-11", "2026-12-12"];
export const dayName = (iso) => {
  if (!iso) return "No date";
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
};

export const KINDS = {
  vendor: {
    title: "Vendors", noun: "vendor", hint: "Everyone you have booked: what was agreed, what you've paid so far, and their number.",
    search: ["name", "service", "contact"],
    fields: [
      { key: "name", label: "Vendor", type: "text", required: true },
      { key: "service", label: "Service", type: "text" },
      { key: "agreed", label: "Agreed (₹)", type: "money" },
      { key: "paid", label: "Paid (₹)", type: "money" },
      { key: "remaining", label: "Remaining (₹)", type: "money", computed: (r) => (r.agreed == null ? null : Math.max(0, r.agreed - (r.paid || 0))), form: false, strong: true },
      { key: "contact", label: "Contact", type: "text" },
      { key: "note", label: "Note", type: "textarea", table: false },
    ],
    totals: ["agreed", "paid", "remaining"],
  },
  payment: {
    title: "Payments", noun: "payment", hint: "Every payment made, in date order. Use the filters to separate sagai and wedding spend.",
    search: ["description", "category", "paidBy", "note"],
    defaults: { phase: "wedding", paidBy: "Deepak" },
    filters: [{ key: "phase", label: "All phases" }, { key: "category", label: "All categories" }],
    fields: [
      { key: "date", label: "Date", type: "date" },
      { key: "description", label: "Description", type: "text", required: true },
      { key: "amount", label: "Amount (₹)", type: "money" },
      { key: "category", label: "Category", type: "enum", options: opts(...PAYMENT_CATEGORIES) },
      { key: "paidBy", label: "Paid by", type: "text" },
      { key: "phase", label: "Phase", type: "enum", options: opts(["wedding", "Wedding"], ["sagai", "Sagai"]) },
      { key: "note", label: "Note", type: "textarea", table: false },
    ],
    totals: ["amount"],
  },
  fund: {
    title: "Funds", noun: "account", hint: "Money available for the wedding: savings, investments, expected income.",
    search: ["name", "note"],
    fields: [
      { key: "name", label: "Account / source", type: "text", required: true },
      { key: "amount", label: "Amount (₹)", type: "money" },
      { key: "note", label: "Note", type: "text" },
    ],
    totals: ["amount"],
  },
  guest: {
    title: "Guests", noun: "guest", hint: "Everyone invited, by family group. Meal head-counts feed the caterer's numbers.",
    search: ["name", "place", "group", "mobile"],
    defaults: { side: "groom" },
    filters: [{ key: "side", label: "Both sides" }, { key: "inviteType", label: "Any invite type" }, { key: "group", label: "All groups" }],
    groupBy: (r) => r.group || "Ungrouped",
    fields: [
      { key: "name", label: "Name", type: "text", required: true, wide: true },
      { key: "place", label: "Place", type: "text" },
      { key: "side", label: "Side", type: "enum", options: opts(["groom", "Groom"], ["bride", "Bride"]) },
      { key: "group", label: "Group", type: "text", table: false, hint: "e.g. Papa ke bhai, Deepak Friends" },
      { key: "inviteType", label: "Invited by", type: "enum", options: opts("Patrika", "WhatsApp", "Card", "Other") },
      { key: "cardWritten", label: "Card written", type: "bool", inline: true },
      { key: "invitees", label: "Invitees", type: "number" },
      { key: "mobile", label: "Mobile", type: "text", table: false },
      { key: "room", label: "Room", type: "bool", inline: true },
      { key: "roomType", label: "Room type", type: "text", table: false },
      { key: "shudhBhojan", label: "Shudh bhojan", type: "number", table: false },
      { key: "sikh", label: "Sikh item", type: "number", table: false },
      ...MEAL_SLOTS.map(([key, label]) => ({ key, label, type: "number", table: false, section: "Meals (number of people)" })),
      { key: "note", label: "Note", type: "textarea", table: false },
    ],
    totals: ["invitees"],
  },
  attendee: {
    title: "Guest list, gifts & rooms", noun: "guest", hint: "Your own list of guests coming. Tick Gift when their gift is handed over, and enter a room number to allocate a room.",
    search: ["name", "mobile", "place", "group", "roomNo", "giftItem"],
    defaults: { side: "groom", people: 1 },
    filters: [{ key: "side", label: "Both sides" }, { key: "group", label: "All groups" }, { key: "roomNo", label: "Any room" }],
    fields: [
      { key: "name", label: "Name", type: "text", required: true, wide: true },
      { key: "people", label: "People", type: "number" },
      { key: "arrived", label: "Arrived", type: "bool", inline: true },
      { key: "giftGiven", label: "Gift given", type: "bool", inline: true },
      { key: "roomNo", label: "Room", type: "text", hint: "Room number / name; leave blank if none" },
      { key: "side", label: "Side", type: "enum", options: opts(["groom", "Groom"], ["bride", "Bride"]) },
      { key: "mobile", label: "Mobile", type: "text" },
      { key: "place", label: "Place", type: "text", table: false },
      { key: "group", label: "Group", type: "text", table: false, hint: "e.g. Papa ke dost, Deepak Friends" },
      { key: "giftItem", label: "Gift item", type: "text", table: false, hint: "e.g. Sweet box + dry fruits" },
      { key: "roomNote", label: "Room note", type: "text", table: false, hint: "e.g. AC, ground floor, shares with Sharma ji" },
      { key: "note", label: "Note", type: "textarea", table: false },
    ],
    totals: ["people"],
    progress: (r) => r.giftGiven,
  },
  event: {
    title: "Schedule", noun: "function", hint: "The day-by-day programme of the three wedding days.",
    search: ["title", "venue", "note"],
    groupBy: (r) => dayName(r.date),
    defaults: { date: WEDDING_DAYS[0] },
    fields: [
      { key: "date", label: "Date", type: "date", table: false },
      { key: "time", label: "Time", type: "time" },
      { key: "title", label: "Function", type: "text", required: true, wide: true },
      { key: "venue", label: "Venue", type: "text" },
      { key: "note", label: "Note", type: "text" },
    ],
  },
  task: {
    title: "Checklist", noun: "item", hint: "What has to be arranged for each function, who is doing it, and whether it's done.",
    search: ["title", "group", "assignee", "contact"],
    filters: [{ key: "group", label: "All functions" }],
    groupBy: (r) => r.group || "General",
    fields: [
      { key: "done", label: "Done", type: "bool", inline: true },
      { key: "title", label: "Item", type: "text", required: true, wide: true },
      { key: "group", label: "Function", type: "text", table: false, hint: "Items with the same function are grouped together" },
      { key: "assignee", label: "Who will do it", type: "text" },
      { key: "contact", label: "Contact", type: "text" },
    ],
    progress: (r) => r.done,
  },
  shopping: {
    title: "Shopping", noun: "item", hint: "Things to buy and things already bought. Tick the status as you go.",
    search: ["item", "forWhom", "note", "qty"],
    filters: [{ key: "status", label: "All" }],
    defaults: { status: "to-buy" },
    fields: [
      { key: "status", label: "Status", type: "enum", options: opts(["to-buy", "To buy"], ["bought", "Bought"]), toggle: ["to-buy", "bought"] },
      { key: "item", label: "Item", type: "text", required: true, wide: true },
      { key: "qty", label: "Qty", type: "text" },
      { key: "forWhom", label: "For", type: "text" },
      { key: "amount", label: "Amount (₹)", type: "money" },
      { key: "note", label: "Note", type: "text" },
    ],
    totals: ["amount"],
  },
  menu: {
    title: "Food menu", noun: "dish", hint: "Menu for every meal of the three days.",
    search: ["item", "meal"],
    groupBy: (r) => `${dayName(r.date)} · ${r.meal || "Other"}`,
    defaults: { date: WEDDING_DAYS[0] },
    fields: [
      { key: "date", label: "Date", type: "date" },
      { key: "meal", label: "Meal", type: "text", hint: "e.g. Breakfast, Lunch, Dinner · Starters" },
      { key: "item", label: "Dish", type: "text", required: true, wide: true },
    ],
  },
  mehandi: {
    title: "Mehandi", noun: "person", hint: "Who gets mehandi applied, and the price for each.",
    search: ["name", "note"],
    fields: [
      { key: "name", label: "Name", type: "text", required: true, wide: true },
      { key: "amount", label: "Amount (₹)", type: "money" },
      { key: "note", label: "Note", type: "text" },
    ],
    totals: ["amount"],
  },
  envelope: {
    title: "Envelopes", noun: "envelope", hint: "Who gets a shagun envelope, and how they're related.",
    search: ["name", "relation"],
    fields: [
      { key: "name", label: "Name", type: "text", required: true, wide: true },
      { key: "relation", label: "Relation / family", type: "text" },
    ],
  },
  performance: {
    title: "Dance & performances", noun: "performance", hint: "The performance line-up. Use the arrows to set who dances first. Guests can also request a slot from the website — approve their requests here.",
    search: ["performers", "song", "contact", "note"],
    filters: [{ key: "side", label: "Both sides" }, { key: "status", label: "Any status" }],
    defaults: { side: "both", status: "approved" },
    reorder: true,
    fields: [
      { key: "performers", label: "Performers", type: "text", required: true, wide: true },
      { key: "song", label: "Song", type: "text" },
      { key: "side", label: "Side", type: "enum", options: opts(["bride", "Bride"], ["groom", "Groom"], ["both", "Both"]) },
      { key: "status", label: "Status", type: "enum", options: opts(["pending", "Pending"], ["approved", "Approved"]), toggle: ["pending", "approved"] },
      { key: "links", label: "Links", type: "links", hint: "Paste YouTube / Drive / Spotify links — one per line", wide: true },
      { key: "mediaCount", label: "Files", type: "text", form: false, computed: (r) => (r.mediaCount ? `${r.mediaCount} file${r.mediaCount > 1 ? "s" : ""}` : null) },
      { key: "contact", label: "Contact", type: "text", table: false },
      { key: "note", label: "Note", type: "text" },
    ],
    media: true,
  },
};

// Sidebar structure: sections are grouped by what you're doing, not in the order they were built.
export const SECTION_GROUPS = [
  { label: null, sections: [{ id: "overview", label: "Overview" }] },
  { label: "Guests", sections: [{ id: "guest", label: "Invitations & meals" }, { id: "attendee", label: "Guest list & rooms" }] },
  { label: "Programme", sections: [{ id: "performance", label: "Dance" }] },
  { label: "To do", sections: [{ id: "task", label: "Checklist" }, { id: "custom", label: "Custom checklist" }] },
];
export const SECTIONS = SECTION_GROUPS.flatMap((g) => g.sections);

export const rupee = (n) => `₹${Math.round(n || 0).toLocaleString("en-IN")}`;
export const fmtTime = (hhmm) => {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};
export const fmtDay = (iso) => (iso ? new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" }) : "");
