import { Router } from "express";
import { db, ping } from "./db.js";
import { EVENTS } from "./events.js";
import { HttpError, parse, rsvpCreate, rsvpUpdate, loginSchema } from "./validation.js";
import { requireAdmin, setAuthCookies, clearAuthCookies, verifyPassword, decodeRefresh, activeAdmin } from "./auth.js";

const guests = () => db.collection("wedding_guests");
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const guestOut = (d) => {
  if (!d) return {};
  const { _id, dietaryPreferences, ...out } = d; // dietaryPreferences: legacy field, no longer used
  for (const k of ["createdAt", "updatedAt"]) if (out[k] instanceof Date) out[k] = out[k].toISOString();
  return out;
};
const DUP = "An RSVP with this mobile number already exists. Here is the response we have on record.";

const buckets = new Map();
const rateLimit = (scope, limit, windowSec) => (req, _res, next) => {
  const now = Date.now() / 1000;
  const key = `${scope}:${req.ip}`;
  if (buckets.size > 5000) buckets.clear();
  const hits = (buckets.get(key) || []).filter((t) => now - t < windowSec);
  if (hits.length >= limit) return next(new HttpError(429, "Too many requests. Please try again in a little while."));
  hits.push(now);
  buckets.set(key, hits);
  next();
};

const router = Router();

router.get("/", (_req, res) => res.json({ message: "Deepak & Shruti Wedding API is running" }));

router.get("/health", wrap(async (_req, res) => {
  let database = "connected";
  try { await ping(); } catch { database = "unavailable"; }
  res.json({ status: "ok", database, time: new Date().toISOString() });
}));

router.get("/v1/events", (_req, res) => res.json({ events: EVENTS }));

router.post("/v1/rsvp", rateLimit("rsvp", 8, 60), wrap(async (req, res) => {
  const data = parse(rsvpCreate, req.body);
  const dup = async () => res.status(409).json({ detail: DUP, existing: guestOut(await guests().findOne({ mobileNumber: data.mobileNumber })) });
  if (await guests().findOne({ mobileNumber: data.mobileNumber })) return dup();
  const now = new Date();
  const doc = { ...data, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
  try { await guests().insertOne(doc); }
  catch (e) { if (e.code === 11000) return dup(); throw e; }
  res.status(201).json(guestOut(doc));
}));

router.post("/v1/admin/login", rateLimit("login", 10, 60), wrap(async (req, res) => {
  const { email: rawEmail, password } = parse(loginSchema, req.body);
  const email = rawEmail.trim().toLowerCase();
  const ident = `${req.ip}:${email}`;
  const now = new Date();
  const attempts = db.collection("login_attempts");
  const attempt = await attempts.findOne({ identifier: ident });
  const tooMany = () => new HttpError(429, "Too many failed attempts. Please try again in a few minutes.");
  if (attempt?.lockedUntil && attempt.lockedUntil > now) throw tooMany();
  const admin = await db.collection("admin_users").findOne({ email });
  if (!admin || !(await verifyPassword(password, admin.passwordHash))) {
    let count = (attempt?.count || 0) + 1;
    const update = { count, expiresAt: new Date(now.getTime() + 15 * 60000) };
    const locked = count >= 5;
    if (locked) { update.lockedUntil = new Date(now.getTime() + 15 * 60000); update.count = 0; }
    await attempts.updateOne({ identifier: ident }, { $set: update }, { upsert: true });
    throw locked ? tooMany() : new HttpError(401, "Invalid email or password");
  }
  await attempts.deleteOne({ identifier: ident });
  await db.collection("admin_users").updateOne({ id: admin.id }, { $set: { lastLoginAt: now } });
  const access = setAuthCookies(res, admin.id);
  res.json({ id: admin.id, email: admin.email, role: admin.role, access_token: access });
}));

router.post("/v1/admin/refresh", wrap(async (req, res) => {
  const tok = req.cookies?.refresh_token;
  if (!tok) throw new HttpError(401, "No refresh session");
  const admin = await activeAdmin(decodeRefresh(tok).sub);
  res.json({ ok: true, access_token: setAuthCookies(res, admin.id) });
}));

router.post("/v1/admin/logout", (_req, res) => { clearAuthCookies(res); res.json({ ok: true }); });

const admin = Router();
admin.use(requireAdmin);

admin.get("/me", (req, res) => res.json({ id: req.admin.id, email: req.admin.email, role: req.admin.role }));

admin.get("/dashboard", wrap(async (_req, res) => {
  const all = await guests().find({}, { projection: { _id: 0 } }).toArray();
  const by = (s) => all.filter((g) => g.attendanceStatus === s).length;
  const attending = all.filter((g) => g.attendanceStatus !== "no");
  res.json({
    totalRsvps: all.length, attending: by("yes"), notAttending: by("no"), maybe: by("maybe"),
    totalExpectedAttendees: all.filter((g) => g.attendanceStatus === "yes").reduce((s, g) => s + g.attendeeCount, 0),
    accommodationRequired: attending.filter((g) => g.accommodationRequired).length,
    eventAttendance: EVENTS.map((e) => ({
      eventId: e.id, title: e.title, time: e.time,
      count: attending.filter((g) => (g.eventsAttending || []).includes(e.id)).length,
    })),
    recentRsvps: [...all].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5).map(guestOut),
  });
}));

const csvCell = (v) => { const s = String(v ?? ""); return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

admin.get("/guests/export", wrap(async (_req, res) => {
  const titles = Object.fromEntries(EVENTS.map((e) => [e.id, e.title]));
  const rows = [["Guest Name", "Mobile", "Attendance", "Attendees", "Events Attending", "Accommodation", "Message", "Submitted At"]];
  for await (const g of guests().find({}, { projection: { _id: 0 } }).sort({ createdAt: -1 })) {
    rows.push([g.guestName, g.mobileNumber, g.attendanceStatus, g.attendeeCount,
      (g.eventsAttending || []).map((e) => titles[e] || e).join("; "),
      g.accommodationRequired ? "Yes" : "No", g.message || "",
      g.createdAt instanceof Date ? g.createdAt.toISOString() : g.createdAt || ""]);
  }
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  res.set({ "Content-Type": "text/csv", "Content-Disposition": `attachment; filename=wedding-guests-${stamp}.csv` });
  res.send(rows.map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n");
}));

admin.get("/guests", wrap(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
  const search = String(req.query.search || "").slice(0, 100).trim();
  const status = String(req.query.status || "");
  const query = {};
  if (search) {
    const safe = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    query.$or = [{ guestName: { $regex: safe, $options: "i" } }, { mobileNumber: { $regex: safe } }];
  }
  if (["yes", "no", "maybe"].includes(status)) query.attendanceStatus = status;
  const total = await guests().countDocuments(query);
  const docs = await guests().find(query, { projection: { _id: 0 } }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).toArray();
  res.json({ guests: docs.map(guestOut), total, page, totalPages: Math.max(1, Math.ceil(total / limit)) });
}));

admin.get("/guests/:id", wrap(async (req, res) => {
  const doc = await guests().findOne({ id: req.params.id }, { projection: { _id: 0 } });
  if (!doc) throw new HttpError(404, "RSVP not found");
  res.json(guestOut(doc));
}));

admin.patch("/guests/:id", wrap(async (req, res) => {
  const data = parse(rsvpUpdate, req.body);
  const updates = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined && v !== null));
  if (!Object.keys(updates).length) throw new HttpError(422, "Nothing to update");
  if (updates.attendanceStatus === "no") Object.assign(updates, { attendeeCount: 0, eventsAttending: [], accommodationRequired: false });
  updates.updatedAt = new Date();
  let doc;
  try {
    doc = await guests().findOneAndUpdate({ id: req.params.id }, { $set: updates }, { returnDocument: "after" });
  } catch (e) {
    if (e.code === 11000) throw new HttpError(409, "Another RSVP already uses this mobile number");
    throw e;
  }
  if (!doc) throw new HttpError(404, "RSVP not found");
  res.json(guestOut(doc));
}));

admin.delete("/guests/:id", wrap(async (req, res) => {
  const doc = await guests().findOneAndDelete({ id: req.params.id });
  if (!doc) throw new HttpError(404, "RSVP not found");
  res.json({ ok: true, deleted: req.params.id });
}));

router.use("/v1/admin", admin);
export default router;
