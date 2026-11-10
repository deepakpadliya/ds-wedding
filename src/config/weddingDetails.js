// ============================================================================
// CENTRAL WEDDING CONFIGURATION — edit everything about the wedding here.
// ============================================================================

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
  musicUrl: "https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3",
  contacts: [
    { number: "8742005204", label: "Wedding Enquiries & Assistance" },
    { number: "9828844627", label: "Wedding Enquiries & Assistance" },
  ],
  whatsappNumber: (num) => `https://wa.me/91${num}`,
  telNumber: (num) => `tel:+91${num}`,
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
    mapQuery: "Lal Bagh, Pratapgarh, Rajasthan",
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
    mapQuery: null,
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
    mapQuery: "Lal Bagh, Pratapgarh, Rajasthan",
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
    mapQuery: "Lal Bagh, Pratapgarh, Rajasthan",
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
    mapQuery: "Lal Bagh, Pratapgarh, Rajasthan",
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
    mapQuery: null,
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
    mapQuery: "Lal Bagh, Pratapgarh, Rajasthan",
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
    mapQuery: "Lal Bagh, Pratapgarh, Rajasthan",
  },
];

export const GALLERY = [
  { src: "/images/couple.png", alt: "Illustrated portrait of Deepak and Shruti under a golden floral arch" },
  ...EVENTS.map((e) => ({ src: e.image, alt: `Illustration of the ${e.title} celebration` })),
  { src: "/images/bride.png", alt: "Illustrated portrait of the bride Shruti in a maroon and gold lehenga" },
  { src: "/images/groom.png", alt: "Illustrated portrait of the groom Deepak in an ivory sherwani" },
];

// Personal memories are intentionally left as editable placeholders.
export const STORY = {
  intro: "[Write a short introduction to Deepak and Shruti here — replace this placeholder with your own words.]",
  timeline: [
    {
      title: "The First Hello",
      label: "Where it all began",
      text: "[Add how the couple first met — replace this placeholder with your memory.]",
    },
    {
      title: "The Engagement",
      label: "A promise made",
      text: "[Add your engagement story and date — replace this placeholder with your memory.]",
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
      mapQuery: "Lal Bagh, Pratapgarh, Rajasthan",
    },
    {
      name: "Bhaiji Ka Mandir, Gacha Gali",
      note: "Shanti Vidhan & Pujan",
      mapQuery: "Bhaiji Ka Mandir, Gacha Gali, Pratapgarh, Rajasthan",
    },
    {
      name: "At Residence",
      note: "Dev Darshan & Var Nikasi — private family residence",
      mapQuery: null,
    },
  ],
  guidance: [
    {
      title: "Getting There",
      text: "[Add travel guidance here — nearest railway station, airport and roads. Replace this placeholder.]",
    },
    {
      title: "Where to Stay",
      text: "[Add hotel and accommodation suggestions here. Replace this placeholder.]",
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
