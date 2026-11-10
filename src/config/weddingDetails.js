// ============================================================================
// CENTRAL WEDDING CONFIGURATION — edit everything about the wedding here.
// ============================================================================

// Lal Bagh Google Maps link used for all "Get Directions" buttons.
const LAL_BAGH_MAP = "https://maps.app.goo.gl/T49iE25c5xiY3xfx9";
// Family residence — start point for Dev Darshan and Var Nikasi.
const RESIDENCE_MAP = "24.030031,74.775350";

// Ready-made maps URL -> used as is. "lat,lng" -> directions with that destination.
// Anything else -> Google Maps search for the text.
export const mapLink = (q) => {
  if (/^https?:\/\//.test(q)) return q;
  const enc = encodeURIComponent(q);
  return /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(q.trim())
    ? `https://www.google.com/maps/dir/?api=1&destination=${enc}`
    : `https://www.google.com/maps/search/?api=1&query=${enc}`;
};

export const GROOM = {
  name: "Deepak Padliya",
  father: "Kailash Ji Padliya",
  mother: "Naiyan Bala Padliya",
};

export const BRIDE = {
  name: "Shruti Minda",
  father: "Ajit Minda",
  mother: "Vandna Minda",
};

export const WEDDING = {
  tagline: "Two Souls, One Beautiful Journey",
  supportingLine:
    "Together with our families, we invite you to celebrate the beginning of our forever.",
  weddingDateLabel: "Saturday, 12 December 2026",
  dateRangeLabel: "10 – 12 December 2026",
  shortDateLabel: "12 . 12 . 2026",
  // Countdown target: 12 December 2026, 12:30 PM IST
  countdownTarget: "2026-12-12T12:30:00+05:30",
  mainVenue: "Lal Bagh, Pratapgarh, Rajasthan",
  locationShort: "Pratapgarh, Rajasthan",
  // Optional background music (off by default; toggle in the corner)
  musicUrl: "/LONDON%20THUMAKDA.m4a",
  contacts: [
    { number: "8742005204", label: "Wedding Enquiries & Assistance" },
    { number: "9828844627", label: "Wedding Enquiries & Assistance" },
  ],
  // Numbers are 10-digit Indian mobiles, or international with a leading "+".
  displayNumber: (num) => (num.startsWith("+") ? num : num.length === 10 ? `+91 ${num}` : `+${num}`),
  whatsappNumber: (num) => `https://wa.me/${num.startsWith("+") ? num.slice(1) : num.length === 10 ? `91${num}` : num}`,
  telNumber: (num) => `tel:${num.startsWith("+") ? num : num.length === 10 ? `+91${num}` : `+${num}`}`,
};

export const INVITATION = {
  opening: "Together with their families",
  groomParents: "Kailash Ji & Naiyan Bala Padliya",
  brideParents: "Ajit Minda & Vandna Minda",
  inviteLine: "cordially invite you to celebrate the wedding of",
  couple: "Deepak Padliya & Shruti Minda",
  date: "12 December 2026",
  venue: "Lal Bagh, Pratapgarh, Rajasthan.",
};

export const DAYS = [
  { day: 1, weekday: "Day One", dateLabel: "Thursday, 10 December 2026" },
  { day: 2, weekday: "Day Two", dateLabel: "Friday, 11 December 2026" },
  { day: 3, weekday: "Day Three", dateLabel: "Saturday, 12 December 2026" },
];

export const EVENTS = [
  {
    id: "shanti-vidhan-pujan",
    day: 1,
    title: "Shanti Vidhan & Pujan",
    time: "07:30 AM",
    dateLabel: "Thursday, 10 December 2026",
    venue: "Bhaiji Ka Mandir, Gacha Gali, Pratapgarh, Rajasthan",
    description:
      "Begin the wedding celebrations with blessings, devotion, peace, and auspicious prayers.",
    image: "/images/events/shanti-vidhan-pujan.png",
    mapQuery: "Bhaiji Ka Mandir, Gacha Gali, Pratapgarh, Rajasthan",
  },
  {
    id: "mehendi",
    day: 1,
    title: "Mehendi",
    time: "01:00 PM",
    dateLabel: "Thursday, 10 December 2026",
    venue: "Lal Bagh, Pratapgarh, Rajasthan",
    description:
      "An afternoon filled with beautiful mehendi, colours, music, laughter, and celebration.",
    image: "/images/events/mehandi.png",
    mapQuery: LAL_BAGH_MAP,
  },
  {
    id: "dev-darshan",
    day: 2,
    title: "Dev Darshan",
    time: "08:30 AM",
    dateLabel: "Friday, 11 December 2026",
    venue: "At Residence",
    description: "Begin the day with devotion, blessings, and auspicious rituals.",
    image: "/images/events/dev-darshan.png",
    mapQuery: RESIDENCE_MAP,
  },
  {
    id: "vanak-haldi",
    day: 2,
    title: "Vanak / Haldi",
    time: "12:15 PM",
    dateLabel: "Friday, 11 December 2026",
    venue: "Lal Bagh, Pratapgarh, Rajasthan",
    description:
      "A joyful celebration filled with turmeric, flowers, family traditions, and happiness.",
    image: "/images/events/vanak-haldi.png",
    mapQuery: LAL_BAGH_MAP,
  },
  {
    id: "mamera",
    day: 2,
    title: "Mamera",
    time: "03:00 PM",
    dateLabel: "Friday, 11 December 2026",
    venue: "Lal Bagh, Pratapgarh, Rajasthan",
    description:
      "Celebrate the beautiful Rajasthani family tradition of Mamera with blessings, gifts, and togetherness.",
    image: "/images/events/mamera.png",
    mapQuery: LAL_BAGH_MAP,
  },
  {
    id: "dj-night",
    day: 2,
    title: "DJ Night",
    time: "07:00 PM",
    dateLabel: "Friday, 11 December 2026",
    venue: "Lal Bagh, Pratapgarh, Rajasthan",
    description:
      "An energetic evening of music, dance, celebration, and unforgettable memories.",
    image: "/images/events/dj-night.png",
    mapQuery: LAL_BAGH_MAP,
  },
  {
    id: "var-nikasi",
    day: 3,
    title: "Var Nikasi",
    time: "09:00 AM",
    dateLabel: "Saturday, 12 December 2026",
    venue: "At Residence",
    description:
      "A royal wedding procession marking the beginning of the groom's journey towards the wedding celebrations.",
    image: "/images/events/var-nikasi.png",
    mapQuery: RESIDENCE_MAP,
  },
  {
    id: "shubh-lagna",
    day: 3,
    title: "Shubh Lagna / Wedding Ceremony",
    time: "12:30 PM",
    dateLabel: "Saturday, 12 December 2026",
    venue: "Lal Bagh, Pratapgarh, Rajasthan",
    description:
      "The most special moment — two souls coming together to begin their forever journey.",
    image: "/images/events/shubh-lagna.png",
    mapQuery: LAL_BAGH_MAP,
  },
  {
    id: "reception",
    day: 3,
    title: "Reception",
    time: "05:00 PM",
    dateLabel: "Saturday, 12 December 2026",
    venue: "Lal Bagh, Pratapgarh, Rajasthan",
    description:
      "An evening of celebration, blessings and warm hospitality as family and friends felicitate the newlyweds.",
    image: "/images/events/reception.png",
    mapQuery: LAL_BAGH_MAP,
  },
];

export const GALLERY = [
  { src: "/images/couple.png", alt: "Illustrated portrait of Deepak and Shruti under a golden floral arch" },
  ...EVENTS.map((e) => ({ src: e.image, alt: `Illustration of the ${e.title} celebration` })),
  { src: "/images/bride.png", alt: "Illustrated portrait of the bride Shruti in a maroon and gold lehenga" },
  { src: "/images/groom.png", alt: "Illustrated portrait of the groom Deepak in an ivory sherwani" },
];

// Story copy — edit these lines any time to add your own memories.
export const STORY = {
  intro: "Two hearts, two families, one beautiful beginning. Deepak and Shruti are ready to begin a lifetime of togetherness — and they cannot wait to share every moment of it with the people they love most.",
  timeline: [
    {
      title: "The First Hello",
      label: "Where it all began",
      text: "Some meetings feel like they were written in the stars. One hello, one smile — and two lives quietly began to turn towards each other.",
    },
    {
      title: "The Engagement",
      label: "A promise made",
      text: "With the blessings of both families, a promise was made — to walk together through every season of life, hand in hand.",
    },
    {
      title: "Wedding Bells",
      label: "12 December 2026",
      text: "Two families come together in Pratapgarh as Deepak and Shruti begin their forever journey.",
    },
  ],
  brideFamilyNote: `Daughter of ${BRIDE.father} & ${BRIDE.mother}`,
  groomFamilyNote: `Son of ${GROOM.father} & ${GROOM.mother}`,
};

export const TRAVEL = {
  venues: [
    {
      name: "Lal Bagh",
      note: "Main wedding venue — Mehendi, Haldi, Mamera, DJ Night & the Wedding Ceremony",
      mapQuery: LAL_BAGH_MAP,
    },
    {
      name: "Bhaiji Ka Mandir, Gacha Gali",
      hideForBride: true, // not shown on the /bride page
      note: "Shanti Vidhan & Pujan",
      mapQuery: "Bhaiji Ka Mandir, Gacha Gali, Pratapgarh, Rajasthan",
    },
    {
      name: "At Residence",
      hideForBride: true, // not shown on the /bride page
      note: "Dev Darshan & Var Nikasi — the baraat begins from our family residence",
      mapQuery: RESIDENCE_MAP,
    },
  ],
  guidance: [
    {
      title: "Getting There",
      text: "Pratapgarh is easy to reach by road, and our families will happily help you plan your journey. Call us on the numbers below and we will guide you with routes and timings — just come with a happy heart, we will take care of the rest.",
    },
    {
      title: "Where to Stay",
      text: "Your comfort is our joy. Tick “accommodation assistance” in the RSVP and our families will arrange a warm, welcoming place for you to rest between the celebrations.",
    },
  ],
};

export const NAV_LINKS = [
  { id: "story", label: "Our Story" },
  { id: "events", label: "Events" },
  { id: "invitation", label: "Invitation" },
  { id: "gallery", label: "Gallery" },
  { id: "venue", label: "Venue" },
  { id: "rsvp", label: "RSVP" },
];
