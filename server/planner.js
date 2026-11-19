import express, { Router } from "express";
import { db } from "./db.js";
import { HttpError } from "./validation.js";

// The wedding planner (replaces the Excel workbook). Every sheet became a "kind" of record, all stored in one
// collection (`planner_items`). A kind is just a list of typed fields; one set of routes serves them all.
//   s = text · n = number · b = yes/no · d = date (YYYY-MM-DD) · t = time (HH:MM) · e = one of a fixed list
const s = (max = 200) => ({ type: "s", max });
const n = (max = 100000000) => ({ type: "n", max });
const b = () => ({ type: "b" });
const d = () => ({ type: "d" });
const t = () => ({ type: "t" });
const e = (...values) => ({ type: "e", values });

const MEALS = ["d10b", "d10l", "d10n", "d11b", "d11l", "d11d", "d12b", "d12m", "d12d"]; // per-meal head counts, 10-12 Dec

export const PAYMENT_CATEGORIES = ["Venue", "Food", "Photography", "Decor & Events", "Music & Dhol", "Clothes", "Jewellery", "Mehandi & Beauty", "Printing", "Rituals & Pooja", "Travel", "Other"];

export const KINDS = {
  payment: { label: "Payments", sort: { date: -1 }, fields: {
    date: d(), description: s(200), amount: n(), category: e(...PAYMENT_CATEGORIES), paidBy: s(60), phase: e("wedding", "sagai"), note: s(300) },
    required: ["description"] },
  vendor: { label: "Vendors", sort: { name: 1 }, fields: {
    name: s(120), service: s(120), agreed: n(), paid: n(), contact: s(80), note: s(300) }, required: ["name"] },
  fund: { label: "Funds", sort: { amount: -1 }, fields: { name: s(120), amount: n(), note: s(300) }, required: ["name"] },
  guest: { label: "Guests", sort: { group: 1, name: 1 }, fields: {
    name: s(200), place: s(120), side: e("groom", "bride"), group: s(80), inviteType: e("Patrika", "WhatsApp", "Card", "Other"),
    cardWritten: b(), invitees: n(1000), mobile: s(40), room: b(), roomType: s(60), shudhBhojan: n(1000), sikh: n(1000),
    ...Object.fromEntries(MEALS.map((m) => [m, n(5000)])), note: s(300) }, required: ["name"] },
  attendee: { label: "Guest list", sort: { name: 1 }, fields: {
    name: s(200), mobile: s(40), place: s(120), side: e("groom", "bride"), group: s(80), people: n(1000),
    arrived: b(), giftGiven: b(), giftItem: s(200), roomNo: s(60), roomNote: s(300), note: s(300) }, required: ["name"] },
  custom: { label: "Custom checklist", sort: { order: 1, createdAt: 1 }, fields: { order: n(100000) }, required: [] },
  event: { label: "Schedule", sort: { date: 1, time: 1 }, fields: { date: d(), time: t(), title: s(200), venue: s(200), note: s(300) }, required: ["title"] },
  task: { label: "Checklist", sort: { order: 1, createdAt: 1 }, fields: {
    group: s(100), title: s(200), assignee: s(100), contact: s(80), done: b(), order: n(100000) }, required: ["title"] },
  shopping: { label: "Shopping", sort: { status: -1, createdAt: 1 }, fields: {
    item: s(200), qty: s(60), forWhom: s(120), amount: n(), status: e("to-buy", "bought"), note: s(300) }, required: ["item"] },
  menu: { label: "Food menu", sort: { date: 1, order: 1 }, fields: {
    date: d(), meal: s(60), item: s(200), order: n(100000) }, required: ["item"] },
  performance: { label: "Performances", sort: { order: 1, createdAt: 1 }, fields: {
    order: n(100000), performers: s(300), side: e("bride", "groom", "both"), song: s(200), links: s(1500), contact: s(80),
    status: e("pending", "approved"), note: s(300) }, required: ["performers"] },
  mehandi: { label: "Mehandi", sort: { createdAt: 1 }, fields: { name: s(120), amount: n(), note: s(200) }, required: ["name"] },
  envelope: { label: "Envelopes", sort: { createdAt: 1 }, fields: { name: s(120), relation: s(160) }, required: ["name"] },
};

const bad = (field, msg) => { throw new HttpError(422, [{ loc: [field], msg }]); };

// Turn a request body into a clean document: unknown keys dropped, types coerced, blanks become null.
export function clean(kind, body, { partial = false } = {}) {
  const spec = KINDS[kind];
  const out = {};
  for (const [key, f] of Object.entries(spec.fields)) {
    if (!(key in (body || {}))) continue;
    let v = body[key];
    const blank = v === null || v === undefined || (typeof v === "string" && !v.trim());
    if (f.type === "b") { out[key] = v === true || v === "true" || v === "yes"; continue; }
    if (blank) { out[key] = null; continue; }
    if (f.type === "s") {
      v = String(v).replace(/\s+/g, " ").trim();
      if (v.length > f.max) bad(key, `${key} must be at most ${f.max} characters`);
    } else if (f.type === "n") {
      v = Number(v);
      if (!Number.isFinite(v) || v < 0 || v > f.max) bad(key, `${key} must be a number between 0 and ${f.max}`);
    } else if (f.type === "d") {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(Date.parse(v))) bad(key, `${key} must be a date`);
    } else if (f.type === "t") {
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(v)) bad(key, `${key} must be a time like 14:30`);
    } else if (f.type === "e") {
      v = String(v).trim();
      if (!f.values.includes(v)) bad(key, `${key} must be one of: ${f.values.join(", ")}`);
    }
    out[key] = v;
  }
  if (!partial) for (const key of spec.required) if (out[key] == null) bad(key, `${key} is required`);
  for (const key of spec.required) if (key in out && out[key] == null) bad(key, `${key} is required`);
  return out;
}

const items = () => db.collection("planner_items");
const nextOrder = async (kind) => {
  const last = await items().find({ kind, order: { $ne: null } }, { projection: { order: 1 } }).sort({ order: -1 }).limit(1).toArray();
  return (last[0]?.order || 0) + 1;
};
// A guest asking to dance (from the public website): lands at the end of the line-up as "pending" until approved.
export async function addDanceRequest(body) {
  if (await items().countDocuments({ kind: "performance", status: "pending" }) >= 300) throw new HttpError(429, "We have received plenty of requests already — please contact the family.");
  const data = clean("performance", {
    performers: body.performers, side: body.side || null, song: body.song, links: body.links, contact: body.contact, note: body.note,
  });
  const now = new Date();
  const doc = { id: crypto.randomUUID(), kind: "performance", ...data, status: "pending", order: await nextOrder("performance"), uploadToken: crypto.randomUUID(), createdAt: now, updatedAt: now };
  await items().insertOne(doc);
  return { id: doc.id, token: doc.uploadToken };
}
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const out = ({ _id, kind, uploadToken, ...rest }) => {
  for (const k of ["createdAt", "updatedAt"]) if (rest[k] instanceof Date) rest[k] = rest[k].toISOString();
  return rest;
};
const csvCell = (v) => { const x = String(v ?? ""); return /[",\n\r]/.test(x) ? `"${x.replace(/"/g, '""')}"` : x; };
const sum = (list, k) => list.reduce((a, x) => a + (Number(x[k]) || 0), 0);


// ---- Custom checklist: the admin defines the columns (text / number / date / checkbox / dropdown); each row keeps its answers in `values`.
const COLUMN_TYPES = ["text", "number", "date", "checkbox", "select"];
const settings = () => db.collection("wedding_settings");
// Several checklists, each with its own name and columns. The original single checklist becomes the list with id "default".
const DEFAULT_LIST = "default";
const loadLists = async () => {
  const doc = await settings().findOne({ key: "customChecklists" });
  let lists = doc?.lists;
  if (!lists) {
    const legacy = await settings().findOne({ key: "customChecklist" });
    lists = [{ id: DEFAULT_LIST, name: "Custom checklist", columns: legacy?.columns || [] }];
  }
  if (lists.every((l) => l.v2)) return lists;
  // One-off upgrade: lists used to have a built-in "item" + "done" pair. Lists that already hold rows keep them as ordinary columns.
  lists = await Promise.all(lists.map(async (l) => {
    if (l.v2) return l;
    const filter = { kind: "custom", ...listFilter(l.id) };
    if (!(await items().countDocuments(filter))) return { id: l.id, name: l.name, columns: l.columns || [], v2: true };
    const tid = `c_${crypto.randomUUID().slice(0, 8)}`, did = `c_${crypto.randomUUID().slice(0, 8)}`;
    await items().updateMany(filter, [{ $set: { values: { $mergeObjects: [{ $ifNull: ["$values", {}] }, { [tid]: { $ifNull: ["$title", ""] }, [did]: { $ifNull: ["$done", false] } }] } } }]);
    return { id: l.id, name: l.name, v2: true, columns: [{ id: tid, label: l.titleLabel || "Item", type: "text" }, { id: did, label: l.doneLabel || "Done", type: "checkbox" }, ...(l.columns || [])] };
  }));
  await saveLists(lists);
  return lists;
};
const saveLists = (lists) => settings().updateOne({ key: "customChecklists" }, { $set: { lists, updatedAt: new Date() } }, { upsert: true });
const findList = async (id) => {
  const list = (await loadLists()).find((l) => l.id === String(id || ""));
  if (!list) throw new HttpError(404, "Checklist not found");
  return list;
};
const cleanName = (v) => {
  const name = String(v ?? "").replace(/\s+/g, " ").trim();
  if (!name || name.length > 80) throw new HttpError(422, "Give the checklist a name (up to 80 characters)");
  return name;
};
// Rows saved before there were several lists have no listId and belong to the default list.
const listFilter = (listId) => (listId === DEFAULT_LIST ? { $or: [{ listId: DEFAULT_LIST }, { listId: { $exists: false } }] } : { listId });

function cleanColumns(input) {
  if (!Array.isArray(input) || input.length > 30) throw new HttpError(422, "Add at most 30 columns");
  const seen = new Set();
  return input.map((c) => {
    const label = String(c?.label ?? "").replace(/\s+/g, " ").trim();
    if (!label || label.length > 60) throw new HttpError(422, "Every column needs a name (up to 60 characters)");
    if (!COLUMN_TYPES.includes(c?.type)) throw new HttpError(422, `Column type must be one of: ${COLUMN_TYPES.join(", ")}`);
    let id = typeof c.id === "string" && /^c_[a-z0-9]{4,12}$/.test(c.id) ? c.id : `c_${crypto.randomUUID().slice(0, 8)}`;
    if (seen.has(id)) id = `c_${crypto.randomUUID().slice(0, 8)}`;
    seen.add(id);
    const col = { id, label, type: c.type };
    if (c.type === "select") {
      col.options = [...new Set((Array.isArray(c.options) ? c.options : []).map((o) => String(o).trim()).filter(Boolean))].slice(0, 30);
      if (col.options.some((o) => o.length > 60)) throw new HttpError(422, "Dropdown options must be at most 60 characters");
      if (!col.options.length) throw new HttpError(422, `Add at least one option to "${label}"`);
    }
    return col;
  });
}

// Keep only answers for columns that exist, coerced to the column's type; blanks are dropped.
function cleanValues(input, columns) {
  const out = {};
  for (const c of columns) {
    let v = input?.[c.id];
    if (c.type === "checkbox") { if (v === true || v === "true") out[c.id] = true; continue; }
    if (v === null || v === undefined || (typeof v === "string" && !v.trim())) continue;
    if (c.type === "text") { v = String(v).replace(/\s+/g, " ").trim(); if (v.length > 500) bad(c.id, `${c.label} must be at most 500 characters`); }
    else if (c.type === "number") { v = Number(v); if (!Number.isFinite(v) || Math.abs(v) > 1e12) bad(c.id, `${c.label} must be a number`); }
    else if (c.type === "date") { if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(Date.parse(v))) bad(c.id, `${c.label} must be a date`); }
    else if (c.type === "select") { v = String(v).trim(); if (!c.options.includes(v)) bad(c.id, `${c.label} must be one of: ${c.options.join(", ")}`); }
    out[c.id] = v;
  }
  return out;
}

const router = Router();

const kindOf = (req) => {
  const kind = req.params.kind;
  if (!Object.hasOwn(KINDS, kind)) throw new HttpError(404, "Unknown planner section");
  return kind;
};


// ---- Media attached to a planner entry (dance songs / rehearsal videos). Upload: init -> 2 MB chunks -> complete.
const MEDIA_KINDS = ["performance"];
const MEDIA_MAX = 20 * 1024 * 1024, CHUNK = 2 * 1024 * 1024, RANGE_CAP = 3 * 1024 * 1024;
const MEDIA_TYPES = { mp3: "audio/mpeg", m4a: "audio/mp4", aac: "audio/aac", wav: "audio/wav", ogg: "audio/ogg", mp4: "video/mp4", mov: "video/quicktime", webm: "video/webm" };
const media = () => db.collection("planner_media");
const mchunks = () => db.collection("planner_media_chunks");
const mediaOut = ({ id, itemId, name, size, contentType }) => ({ id, itemId, name, size, contentType, type: contentType.startsWith("video") ? "video" : "audio", url: `/api/v1/admin/planner/media/${id}/file` });
const dropMedia = async (filter) => {
  const ids = (await media().find(filter, { projection: { id: 1 } }).toArray()).map((m) => m.id);
  if (ids.length) { await mchunks().deleteMany({ mediaId: { $in: ids } }); await media().deleteMany({ id: { $in: ids } }); }
};

router.get("/media-for/:itemId", wrap(async (req, res) => {
  const docs = await media().find({ itemId: req.params.itemId, status: "ready" }, { projection: { _id: 0 } }).sort({ createdAt: 1 }).toArray();
  res.json({ media: docs.map(mediaOut) });
}));

// Shared by the admin routes below and the public "Want to dance?" upload (which checks an upload token first).
async function mediaInit(itemId, body, maxFiles) {
  const size = parseInt(body?.size, 10);
  const name = String(body?.name || "").replace(/[\r\n]/g, " ").trim().slice(0, 200);
  const contentType = MEDIA_TYPES[name.split(".").pop().toLowerCase()];
  if (!contentType) throw new HttpError(422, "Only MP3, M4A, AAC, WAV, OGG, MP4, MOV or WebM files are allowed");
  if (!(size > 0)) throw new HttpError(422, "File size is required");
  if (size > MEDIA_MAX) throw new HttpError(413, "Files must be under 20 MB — paste a link for bigger ones");
  if (await media().countDocuments({ itemId }) >= maxFiles) throw new HttpError(422, `At most ${maxFiles} files here`);
  await dropMedia({ status: "uploading", createdAt: { $lt: new Date(Date.now() - 3600_000) } }); // abandoned uploads
  const doc = { id: crypto.randomUUID(), itemId, name, size, contentType, status: "uploading", chunksTotal: Math.ceil(size / CHUNK), createdAt: new Date() };
  await media().insertOne(doc);
  return { id: doc.id, chunkSize: CHUNK, chunks: doc.chunksTotal };
}
async function mediaChunk(mediaId, indexParam, buf) {
  const doc = await media().findOne({ id: mediaId, status: "uploading" });
  if (!doc) throw new HttpError(404, "Upload not found");
  const i = parseInt(indexParam, 10);
  if (!(i >= 0 && i < doc.chunksTotal)) throw new HttpError(422, "Bad chunk number");
  const expected = i < doc.chunksTotal - 1 ? CHUNK : doc.size - CHUNK * (doc.chunksTotal - 1);
  if (!Buffer.isBuffer(buf) || buf.length !== expected) throw new HttpError(422, "Chunk size does not match the declared file size");
  await mchunks().updateOne({ mediaId: doc.id, index: i }, { $set: { data: buf } }, { upsert: true });
  return { ok: true, index: i };
}
async function mediaComplete(mediaId) {
  const doc = await media().findOne({ id: mediaId, status: "uploading" });
  if (!doc) throw new HttpError(404, "Upload not found");
  if (await mchunks().countDocuments({ mediaId: doc.id }) !== doc.chunksTotal) throw new HttpError(422, "Some parts are missing — please upload again");
  await media().updateOne({ id: doc.id }, { $set: { status: "ready" } });
  return mediaOut(doc);
}

router.post("/media/init", wrap(async (req, res) => {
  const item = await items().findOne({ id: String(req.body?.itemId), kind: { $in: MEDIA_KINDS } }, { projection: { id: 1 } });
  if (!item) throw new HttpError(404, "Save the entry first");
  res.status(201).json(await mediaInit(item.id, req.body, 10));
}));
router.put("/media/:id/chunks/:i", express.raw({ type: "application/octet-stream", limit: "3mb" }), wrap(async (req, res) => res.json(await mediaChunk(req.params.id, req.params.i, req.body))));
router.post("/media/:id/complete", wrap(async (req, res) => res.json(await mediaComplete(req.params.id))));

// ---- Public upload for a dance request: allowed only with the secret token returned when the request was made,
// only while it is still pending, and only for the first hour.
const PUBLIC_MAX_FILES = 3;
async function danceRequestFor(itemId, token) {
  const item = await items().findOne({ id: String(itemId), kind: "performance", status: "pending", uploadToken: String(token || ""), createdAt: { $gt: new Date(Date.now() - 3600_000) } }, { projection: { id: 1 } });
  if (!item || !token) throw new HttpError(403, "Upload not allowed");
  return item;
}
export const publicMedia = {
  init: async (itemId, token, body) => mediaInit((await danceRequestFor(itemId, token)).id, body, PUBLIC_MAX_FILES),
  chunk: async (mediaId, token, i, buf) => {
    const m = await media().findOne({ id: mediaId, status: "uploading" }, { projection: { itemId: 1 } });
    if (!m) throw new HttpError(404, "Upload not found");
    await danceRequestFor(m.itemId, token);
    return mediaChunk(mediaId, i, buf);
  },
  complete: async (mediaId, token) => {
    const m = await media().findOne({ id: mediaId, status: "uploading" }, { projection: { itemId: 1 } });
    if (!m) throw new HttpError(404, "Upload not found");
    await danceRequestFor(m.itemId, token);
    const r = await mediaComplete(mediaId);
    return { ok: true, id: r.id };
  },
  discard: async (mediaId, token) => {
    const m = await media().findOne({ id: mediaId, status: "uploading" }, { projection: { itemId: 1 } });
    if (!m) return;
    await danceRequestFor(m.itemId, token);
    await dropMedia({ id: mediaId });
  },
};

router.get("/media/:id/file", wrap(async (req, res) => {
  const doc = await media().findOne({ id: req.params.id, status: "ready" });
  if (!doc) throw new HttpError(404, "File not found");
  const size = doc.size;
  let start = 0, end = size - 1;
  const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || "");
  if (m && (m[1] || m[2])) {
    if (m[1] === "") start = Math.max(0, size - parseInt(m[2], 10));
    else { start = parseInt(m[1], 10); if (m[2]) end = Math.min(end, parseInt(m[2], 10)); }
    if (start > end || start >= size) return res.status(416).set("Content-Range", `bytes */${size}`).end();
  }
  end = Math.min(end, start + RANGE_CAP - 1);
  const partial = end < size - 1 || start > 0;
  const first = Math.floor(start / CHUNK), last = Math.floor(end / CHUNK);
  const parts = await mchunks().find({ mediaId: doc.id, index: { $gte: first, $lte: last } }).sort({ index: 1 }).toArray();
  const buf = Buffer.concat(parts.map((c) => Buffer.from(c.data.buffer))).subarray(start - first * CHUNK, end - first * CHUNK + 1);
  res.status(partial ? 206 : 200).set({
    "Content-Type": doc.contentType, "Accept-Ranges": "bytes", "Content-Length": buf.length, "Cache-Control": "private, max-age=3600",
    "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(doc.name)}`,
    ...(partial && { "Content-Range": `bytes ${start}-${start + buf.length - 1}/${size}` }),
  });
  res.end(buf);
}));

router.delete("/media/:id", wrap(async (req, res) => {
  await dropMedia({ id: req.params.id });
  res.json({ ok: true });
}));

router.get("/custom-lists", wrap(async (_req, res) => res.json({ lists: await loadLists() })));
router.post("/custom-lists", wrap(async (req, res) => {
  const lists = await loadLists();
  if (lists.length >= 20) throw new HttpError(422, "At most 20 checklists");
  const list = { id: `l_${crypto.randomUUID().slice(0, 8)}`, name: cleanName(req.body?.name), v2: true, columns: cleanColumns(req.body?.columns ?? []) };
  await saveLists([...lists, list]);
  res.status(201).json({ lists: [...lists, list], id: list.id });
}));
router.patch("/custom-lists/:id", wrap(async (req, res) => {
  const lists = await loadLists();
  const i = lists.findIndex((l) => l.id === req.params.id);
  if (i < 0) throw new HttpError(404, "Checklist not found");
  const next = { ...lists[i] };
  if ("name" in (req.body || {})) next.name = cleanName(req.body.name);
  if ("columns" in (req.body || {})) next.columns = cleanColumns(req.body.columns);
  lists[i] = next;
  await saveLists(lists);
  res.json({ lists });
}));
router.delete("/custom-lists/:id", wrap(async (req, res) => {
  const lists = await loadLists();
  if (!lists.some((l) => l.id === req.params.id)) throw new HttpError(404, "Checklist not found");
  await saveLists(lists.filter((l) => l.id !== req.params.id));
  await items().deleteMany({ kind: "custom", ...listFilter(req.params.id) });
  res.json({ lists: lists.filter((l) => l.id !== req.params.id) });
}));

// Headline numbers for the overview page.
router.get("/summary", wrap(async (_req, res) => {
  const all = await items().find({}, { projection: { _id: 0 } }).toArray();
  const of = (k) => all.filter((x) => x.kind === k);
  const vendors = of("vendor"), payments = of("payment").filter((p) => p.phase !== "sagai"), funds = of("fund");
  const guests = of("guest"), tasks = of("task"), shopping = of("shopping");
  const agreed = sum(vendors, "agreed"), vendorPaid = sum(vendors, "paid");
  res.json({
    budget: { agreed, vendorPaid, vendorRemaining: Math.max(0, agreed - vendorPaid), paymentsLogged: sum(payments, "amount"), funds: sum(funds, "amount") },
    guests: { households: guests.length, invitees: sum(guests, "invitees"), rooms: guests.filter((g) => g.room).length, cardsPending: guests.filter((g) => g.inviteType === "Patrika" && !g.cardWritten).length },
    dance: { total: of("performance").length, pending: of("performance").filter((x) => x.status === "pending").length },
    tasks: { total: tasks.length, done: tasks.filter((x) => x.done).length },
    shopping: { toBuy: shopping.filter((x) => x.status === "to-buy").length, bought: shopping.filter((x) => x.status === "bought").length, spent: sum(shopping.filter((x) => x.status === "bought"), "amount") },
  });
}));

router.post("/:kind/reorder", wrap(async (req, res) => {
  const kind = kindOf(req);
  if (!("order" in KINDS[kind].fields)) throw new HttpError(422, "This section cannot be reordered");
  const ids = req.body?.ids;
  if (!Array.isArray(ids) || ids.length > 2000 || ids.some((x) => typeof x !== "string")) throw new HttpError(422, "ids must be a list");
  if (ids.length) await items().bulkWrite(ids.map((id, i) => ({ updateOne: { filter: { id, kind }, update: { $set: { order: i + 1 } } } })));
  res.json({ ok: true });
}));

router.get("/:kind/export", wrap(async (req, res) => {
  const kind = kindOf(req);
  const list = kind === "custom" ? await findList(req.query.listId) : null;
  const rows = await items().find(list ? { kind, ...listFilter(list.id) } : { kind }, { projection: { _id: 0 } }).sort(KINDS[kind].sort).toArray();
  const yn = (v) => (typeof v === "boolean" ? (v ? "Yes" : "No") : v ?? "");
  let lines;
  if (kind === "custom") {
    const cols = list.columns;
    lines = [cols.map((c) => c.label), ...rows.map((r) => cols.map((c) => (c.type === "checkbox" ? yn(!!r.values?.[c.id]) : r.values?.[c.id] ?? "")))];
  } else {
    const keys = Object.keys(KINDS[kind].fields);
    lines = [keys, ...rows.map((r) => keys.map((k) => yn(r[k])))];
  }
  res.set({ "Content-Type": "text/csv", "Content-Disposition": `attachment; filename=wedding-${list ? list.name.replace(/[^\w-]+/g, "-") : kind}.csv` });
  res.send(lines.map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n");
}));

router.get("/:kind", wrap(async (req, res) => {
  const kind = kindOf(req);
  const filter = kind === "custom" ? { kind, ...listFilter((await findList(req.query.listId)).id) } : { kind };
  const docs = await items().find(filter, { projection: { _id: 0 } }).sort({ ...KINDS[kind].sort, createdAt: 1 }).toArray();
  if (MEDIA_KINDS.includes(kind) && docs.length) {
    const counts = await media().aggregate([{ $match: { status: "ready" } }, { $group: { _id: "$itemId", n: { $sum: 1 } } }]).toArray();
    const byItem = new Map(counts.map((c) => [c._id, c.n]));
    for (const d of docs) d.mediaCount = byItem.get(d.id) || 0;
  }
  res.json({ items: docs.map(out) });
}));

// Add many rows at once (e.g. a pasted list of names); each line goes into the chosen text column.
router.post("/custom/bulk", wrap(async (req, res) => {
  const list = await findList(req.body?.listId);
  const col = list.columns.find((c) => c.id === req.body?.columnId && c.type === "text");
  if (!col) throw new HttpError(422, "Add a text column first");
  const texts = (Array.isArray(req.body?.texts) ? req.body.texts : []).map((t) => String(t).replace(/\s+/g, " ").trim()).filter(Boolean);
  if (!texts.length) throw new HttpError(422, "Nothing to add");
  if (texts.length > 500 || texts.some((t) => t.length > 500)) throw new HttpError(422, "Add up to 500 lines at a time");
  const now = new Date();
  let order = await nextOrder("custom");
  const docs = texts.map((t) => ({ id: crypto.randomUUID(), kind: "custom", listId: list.id, order: order++, values: { [col.id]: t }, createdAt: now, updatedAt: now }));
  await items().insertMany(docs);
  res.status(201).json({ items: docs.map(out) });
}));

router.post("/:kind", wrap(async (req, res) => {
  const kind = kindOf(req);
  const now = new Date();
  const doc = { id: crypto.randomUUID(), kind, ...clean(kind, req.body), createdAt: now, updatedAt: now };
  if (kind === "performance") { doc.status ??= "approved"; doc.order ??= await nextOrder(kind); } // added by the admin: already approved, goes last
  if (kind === "custom") {
    const list = await findList(req.body?.listId);
    doc.listId = list.id; doc.order ??= await nextOrder(kind); doc.values = cleanValues(req.body?.values, list.columns);
  }
  await items().insertOne(doc);
  res.status(201).json(out(doc));
}));

router.patch("/:kind/:id", wrap(async (req, res) => {
  const kind = kindOf(req);
  const set = clean(kind, req.body, { partial: true });
  if (kind === "custom" && req.body && "values" in req.body) {
    const row = await items().findOne({ id: req.params.id, kind }, { projection: { listId: 1 } });
    if (!row) throw new HttpError(404, "Not found");
    set.values = cleanValues(req.body.values, (await findList(row.listId || DEFAULT_LIST)).columns);
  }
  if (!Object.keys(set).length) throw new HttpError(422, "Nothing to update");
  set.updatedAt = new Date();
  const doc = await items().findOneAndUpdate({ id: req.params.id, kind }, { $set: set }, { returnDocument: "after", projection: { _id: 0 } });
  if (!doc) throw new HttpError(404, "Not found");
  res.json(out(doc));
}));

router.delete("/:kind/:id", wrap(async (req, res) => {
  const r = await items().deleteOne({ id: req.params.id, kind: kindOf(req) });
  if (!r.deletedCount) throw new HttpError(404, "Not found");
  await dropMedia({ itemId: req.params.id });
  res.json({ ok: true, deleted: req.params.id });
}));

export default router;
