import { z } from "zod";
import { EVENT_IDS, SIDES } from "./events.js";

export class HttpError extends Error {
  constructor(status, detail, extra = {}) {
    super(typeof detail === "string" ? detail : "error");
    this.status = status;
    this.detail = detail;
    this.extra = extra;
  }
}

const cleanText = (v) => {
  if (v === null || v === undefined) return v;
  return String(v).replace(/\s+/g, " ").trim() || null;
};

export function normalizeMobile(value) {
  let digits = String(value ?? "").replace(/[^\d+]/g, "");
  if (!/^\+?[0-9]{10,15}$/.test(digits)) throw new Error("Enter a valid mobile number");
  if (digits.startsWith("+91") && digits.length === 13) digits = digits.slice(3);
  if (digits.length === 10 && !"6789".includes(digits[0])) {
    throw new Error("Enter a valid Indian mobile number (starts with 6-9) or an international number with country code");
  }
  return digits;
}

const text = (min, max) =>
  z.preprocess(cleanText, z.string().min(min, `Must be at least ${min} characters`).max(max, `Must be at most ${max} characters`));
const optText = (max) =>
  z.preprocess(cleanText, z.string().max(max, `Must be at most ${max} characters`).nullable().optional());

const mobile = z.any().transform((v, ctx) => {
  try { return normalizeMobile(v); } catch (e) { ctx.addIssue({ code: "custom", message: e.message }); return z.NEVER; }
});
const status = z.any().transform((v, ctx) => {
  const s = String(v ?? "").trim().toLowerCase();
  if (!["yes", "no", "maybe"].includes(s)) { ctx.addIssue({ code: "custom", message: "Attendance status must be yes, no or maybe" }); return z.NEVER; }
  return s;
});
const events = z.any().transform((v, ctx) => {
  const cleaned = (Array.isArray(v) ? v : []).map((e) => String(e).trim()).filter(Boolean);
  const bad = cleaned.filter((e) => !EVENT_IDS.has(e));
  if (bad.length) { ctx.addIssue({ code: "custom", message: `Unknown event(s): ${bad.join(", ")}` }); return z.NEVER; }
  return cleaned;
});
const guestSide = z.preprocess(
  (v) => (v === "" || v === undefined ? null : v),
  z.enum(["bride", "groom"], { message: "Side must be bride or groom" }).nullable()
);
const count = z.coerce.number().int().min(0).max(20);

export const rsvpCreate = z.object({
  guestName: text(2, 100),
  mobileNumber: mobile,
  attendanceStatus: status,
  attendeeCount: count,
  side: guestSide.optional().default(null),
  eventsAttending: events.optional().default([]),
  accommodationRequired: z.boolean().optional().default(false),
  message: optText(1000),
}).transform((d) => {
  if (d.attendanceStatus === "no") return { ...d, attendeeCount: 0, eventsAttending: [], accommodationRequired: false };
  if (d.attendeeCount < 1) return { ...d, attendeeCount: 1 };
  return d;
});

export const rsvpUpdate = z.object({
  guestName: text(2, 100).optional(),
  mobileNumber: mobile.optional(),
  attendanceStatus: status.optional(),
  attendeeCount: count.optional(),
  side: guestSide.optional(),
  eventsAttending: events.optional(),
  accommodationRequired: z.boolean().optional(),
  message: optText(1000),
});

export const eventUpdate = z.object({
  title: text(2, 100).optional(),
  time: text(3, 20).optional(),
  venue: text(2, 200).optional(),
  description: text(2, 500).optional(),
  mapQuery: optText(200),
  side: z.enum(SIDES, { message: "Side must be both, bride or groom" }).optional(),
  visible: z.boolean().optional(),
});

const contactItem = z.object({ number: mobile, label: text(2, 60), name: optText(60) });
export const contactsUpdate = z.object({
  bride: z.array(contactItem).min(1, "Add at least one contact for the bride's side").max(6, "At most 6 contacts per side"),
  groom: z.array(contactItem).min(1, "Add at least one contact for the groom's side").max(6, "At most 6 contacts per side"),
});

export const galleryCaption = z.object({ caption: optText(200) });

export const loginSchema = z.object({
  email: z.string().min(3).max(200),
  password: z.string().min(1).max(200),
});

export function parse(schema, body) {
  const r = schema.safeParse(body ?? {});
  if (!r.success) {
    throw new HttpError(422, r.error.issues.map((i) => ({ loc: i.path, msg: i.message })));
  }
  return r.data;
}
