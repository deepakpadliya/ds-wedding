const DEFAULT_EVENTS = [
  { id: "shanti-vidhan-pujan", day: 1, time: "07:30 AM", title: "Shanti Vidhan & Pujan",
    venue: "Bhaiji Ka Mandir, Gacha Gali, Pratapgarh, Rajasthan",
    description: "Begin the wedding celebrations with blessings, devotion, peace, and auspicious prayers." },
  { id: "mehendi", day: 1, time: "01:00 PM", title: "Mehendi",
    venue: "Lal Bagh, Pratapgarh, Rajasthan",
    description: "An afternoon filled with beautiful mehendi, colours, music, laughter, and celebration." },
  { id: "dev-darshan", day: 2, time: "08:30 AM", title: "Dev Darshan", venue: "At Residence",
    description: "Begin the day with devotion, blessings, and auspicious rituals." },
  { id: "vanak-haldi", day: 2, time: "12:15 PM", title: "Vanak / Haldi",
    venue: "Lal Bagh, Pratapgarh, Rajasthan",
    description: "A joyful celebration filled with turmeric, flowers, family traditions, and happiness." },
  { id: "mamera", day: 2, time: "03:00 PM", title: "Mamera",
    venue: "Lal Bagh, Pratapgarh, Rajasthan",
    description: "Celebrate the beautiful Rajasthani family tradition of Mamera with blessings, gifts, and togetherness." },
  { id: "dj-night", day: 2, time: "07:00 PM", title: "DJ Night",
    venue: "Lal Bagh, Pratapgarh, Rajasthan",
    description: "An energetic evening of music, dance, celebration, and unforgettable memories." },
  { id: "var-nikasi", day: 3, time: "09:00 AM", title: "Var Nikasi", venue: "At Residence",
    description: "A royal wedding procession marking the beginning of the groom's journey towards the wedding celebrations." },
  { id: "shubh-lagna", day: 3, time: "12:30 PM", title: "Shubh Lagna / Wedding Ceremony",
    venue: "Lal Bagh, Pratapgarh, Rajasthan",
    description: "The most special moment — two souls coming together to begin their forever journey." },
  { id: "reception", day: 3, time: "05:00 PM", title: "Reception",
    venue: "Lal Bagh, Pratapgarh, Rajasthan",
    description: "An evening of celebration, blessings and warm hospitality as family and friends felicitate the newlyweds." },
];

// Defaults every event starts with; admin edits are stored in the `wedding_events` collection.
export const SIDES = ["both", "bride", "groom"];
export const EVENTS = DEFAULT_EVENTS.map((e) => ({ ...e, side: "both", visible: true }));
export const EVENT_IDS = new Set(EVENTS.map((e) => e.id));
export const EDITABLE_FIELDS = ["title", "time", "venue", "description", "mapQuery", "side", "visible"];

// Merge saved admin overrides over the defaults (ids are fixed; fields are editable).
export const mergeEvents = (overrides = []) => {
  const byId = new Map(overrides.map((o) => [o.id, o]));
  return EVENTS.map((e) => {
    const o = byId.get(e.id) || {};
    const merged = { ...e };
    for (const k of EDITABLE_FIELDS) if (o[k] !== undefined) merged[k] = o[k];
    return merged;
  });
};

// Default contact numbers shown for each side until the admin saves their own.
const DEFAULT_CONTACT_LIST = [
  { number: "8742005204", label: "Wedding Enquiries & Assistance", name: null },
  { number: "9828844627", label: "Wedding Enquiries & Assistance", name: null },
];
export const DEFAULT_CONTACTS = { bride: DEFAULT_CONTACT_LIST, groom: DEFAULT_CONTACT_LIST };
