import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, Check, Download, ExternalLink, Music, Paperclip, Pencil, Plus, Search, Trash2, Video, X } from "lucide-react";
import { toast } from "sonner";
import api, { getErrorMessage } from "@/lib/api";
import { KINDS, fmtDay, fmtTime, rupee } from "./schema";

const BASE = "/v1/admin/planner";
const labelCls = "text-xs font-medium uppercase tracking-wider text-brown/70";

function FieldInput({ f, value, onChange, autoFocus }) {
  const v = value ?? "";
  if (f.type === "bool")
    return (
      <button type="button" role="switch" aria-checked={!!value} onClick={() => onChange(!value)}
        className={`mt-1.5 flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-sm transition-colors ${value ? "border-maroon bg-maroon/10 text-maroon" : "border-gold/40 bg-white/70 text-brown/70"}`}>
        <span>{value ? "Yes" : "No"}</span>
        <span className={`relative h-5 w-9 rounded-full transition-colors ${value ? "bg-maroon" : "bg-brown/25"}`}>
          <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${value ? "left-[18px]" : "left-0.5"}`} />
        </span>
      </button>
    );
  if (f.type === "enum" && f.options.length <= 4)
    return (
      <div className="mt-1.5 flex flex-wrap gap-2">
        {f.options.map((o) => (
          <button key={o.value} type="button" onClick={() => onChange(v === o.value ? "" : o.value)}
            className={`chip ${v === o.value ? "chip-active" : ""}`}>{o.label}</button>
        ))}
      </div>
    );
  if (f.type === "enum")
    return (
      <select className="input-royal mt-1.5" value={v} onChange={(e) => onChange(e.target.value)}>
        <option value="">—</option>
        {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    );
  if (f.type === "textarea" || f.type === "links") return <textarea autoFocus={autoFocus} className={`input-royal mt-1.5 ${f.type === "links" ? "min-h-[72px]" : "min-h-[90px]"}`} placeholder={f.hint || ""} value={v} onChange={(e) => onChange(e.target.value)} />;
  const type = { number: "number", money: "number", date: "date", time: "time" }[f.type] || "text";
  const inputMode = f.type === "number" || f.type === "money" ? "numeric" : undefined;
  return <input autoFocus={autoFocus} className="input-royal mt-1.5" type={type} inputMode={inputMode} min={type === "number" ? 0 : undefined} placeholder={f.hint || ""} value={v} onChange={(e) => onChange(e.target.value)} />;
}

const MEDIA_BASE = `${BASE}/media`;
const MEDIA_ACCEPT = ".mp3,.m4a,.aac,.wav,.ogg,.mp4,.mov,.webm,audio/*,video/*";
const MEDIA_MAX = 20 * 1024 * 1024;
const OCTET = { headers: { "Content-Type": "application/octet-stream" } };
const mb = (n) => `${(n / 1048576).toFixed(1)} MB`;
const urlsOf = (text) => String(text || "").split(/\s+/).filter((x) => /^https?:\/\//i.test(x));

async function uploadMedia(itemId, file) {
  const { data: init } = await api.post(`${MEDIA_BASE}/init`, { itemId, name: file.name, size: file.size });
  try {
    for (let i = 0; i < init.chunks; i++) await api.put(`${MEDIA_BASE}/${init.id}/chunks/${i}`, file.slice(i * init.chunkSize, (i + 1) * init.chunkSize), OCTET);
    return (await api.post(`${MEDIA_BASE}/${init.id}/complete`)).data;
  } catch (e) {
    await api.delete(`${MEDIA_BASE}/${init.id}`).catch(() => {});
    throw e;
  }
}

// Attachments for an entry: existing files (play / delete) plus files queued to upload when the entry is saved.
function MediaBox({ itemId, queue, setQueue }) {
  const [saved, setSaved] = useState(null);
  const input = useRef(null);
  useEffect(() => {
    if (!itemId) return setSaved([]);
    api.get(`${BASE}/media-for/${itemId}`).then(({ data }) => setSaved(data.media)).catch(() => setSaved([]));
  }, [itemId]);

  const pick = (list) => {
    const ok = [];
    for (const f of list) {
      if (f.size > MEDIA_MAX) toast.error(`"${f.name}" is ${mb(f.size)} — files must be under 20 MB. Paste a link instead.`);
      else ok.push(f);
    }
    setQueue((q) => [...q, ...ok]);
    if (input.current) input.current.value = "";
  };
  const remove = async (m) => {
    if (!window.confirm(`Delete "${m.name}"?`)) return;
    try { await api.delete(`${MEDIA_BASE}/${m.id}`); setSaved((l) => l.filter((x) => x.id !== m.id)); }
    catch (e) { toast.error(getErrorMessage(e, "Could not delete")); }
  };

  return (
    <div className="mt-6 sm:col-span-2">
      <p className="border-b border-gold/20 pb-1 font-display text-sm font-semibold text-maroon">Audio / video files</p>
      <p className="mt-2 text-xs text-brown/60">MP3, M4A, WAV, MP4, MOV or WebM, up to 20 MB each. For anything bigger, use Links above.</p>
      <div className="mt-3 space-y-2">
        {(saved || []).map((m) => (
          <div key={m.id} className="rounded-xl border border-gold/25 bg-white/70 p-3">
            <div className="flex items-center gap-2 text-sm">
              {m.type === "video" ? <Video className="h-4 w-4 shrink-0 text-maroon" /> : <Music className="h-4 w-4 shrink-0 text-maroon" />}
              <span className="min-w-0 flex-1 truncate">{m.name}</span>
              <span className="text-xs text-brown/50">{mb(m.size)}</span>
              <button type="button" aria-label={`Delete ${m.name}`} onClick={() => remove(m)} className="rounded-full p-1.5 text-red-500/80 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
            </div>
            {m.type === "video"
              ? <video controls preload="none" src={m.url} className="mt-2 max-h-56 w-full rounded-lg bg-black" />
              : <audio controls preload="none" src={m.url} className="mt-2 w-full" />}
          </div>
        ))}
        {queue.map((f, i) => (
          <div key={`${f.name}-${i}`} className="flex items-center gap-2 rounded-xl border border-dashed border-gold/50 bg-gold/5 px-3 py-2 text-sm">
            <Paperclip className="h-4 w-4 shrink-0 text-gold-deep" />
            <span className="min-w-0 flex-1 truncate">{f.name}</span>
            <span className="text-xs text-brown/50">{mb(f.size)} · uploads on save</span>
            <button type="button" aria-label={`Remove ${f.name}`} onClick={() => setQueue((q) => q.filter((_, j) => j !== i))} className="rounded-full p-1.5 text-brown/60 hover:bg-gold/15"><X className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
      <input ref={input} type="file" multiple accept={MEDIA_ACCEPT} className="hidden" onChange={(e) => pick([...e.target.files])} />
      <button type="button" onClick={() => input.current?.click()} className="btn-outline mt-3 !px-4 !py-2 text-xs"><Plus className="h-4 w-4" /> Add audio / video</button>
    </div>
  );
}

// Right-hand slide-in panel, rendered on <body> so it always covers the whole screen (never anchored to the table).
function EditModal({ kind, initial, onSave, onClose, saving }) {
  const cfg = KINDS[kind];
  const [form, setForm] = useState(initial);
  const [queue, setQueue] = useState([]);
  const fields = cfg.fields.filter((f) => f.form !== false && !f.computed);
  const sections = [...new Set(fields.map((f) => f.section || ""))];
  const first = fields.find((f) => f.required);
  const missing = first && !String(form[first.key] ?? "").trim();
  const dirty = queue.length > 0 || JSON.stringify(form) !== JSON.stringify(initial);

  const close = () => { if (!dirty || window.confirm("Discard your changes?")) onClose(); };
  const submit = () => { if (!missing && !saving) onSave(form, queue); };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") close();
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  });

  return createPortal(
    <div className="fixed inset-0 z-[90]">
      <motion.div className="absolute inset-0 bg-maroon-deep/60 backdrop-blur-sm" onClick={close}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
      <motion.form
        data-testid="planner-modal"
        role="dialog" aria-modal="true" aria-label={`${initial.id ? "Edit" : "Add"} ${cfg.noun}`}
        onSubmit={(e) => { e.preventDefault(); submit(); }}
        initial={{ x: "100%" }} animate={{ x: 0 }} transition={{ type: "tween", duration: 0.25 }}
        className="absolute inset-y-0 right-0 flex w-full max-w-lg flex-col bg-ivory shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-gold/30 px-6 py-4">
          <div>
            <h3 className="font-display text-xl font-semibold text-maroon">{initial.id ? "Edit" : "Add"} {cfg.noun}</h3>
            {initial.id && first && <p className="text-xs text-brown/60">{initial[first.key]}</p>}
          </div>
          <button type="button" onClick={close} className="rounded-full p-2 text-brown/60 hover:bg-gold/10" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {sections.map((s) => (
            <Fragment key={s}>
              {s && <p className="mt-6 border-b border-gold/20 pb-1 font-display text-sm font-semibold text-maroon">{s}</p>}
              <div className={`${s ? "mt-3" : ""} grid gap-4 sm:grid-cols-2`}>
                {fields.filter((f) => (f.section || "") === s).map((f) => (
                  <label key={f.key} className={`block ${f.wide || f.type === "textarea" || f.type === "bool" && false ? "sm:col-span-2" : ""}`}>
                    <span className={labelCls}>{f.label}{f.required && <span className="text-maroon"> *</span>}</span>
                    <FieldInput f={f} autoFocus={f === first && !initial.id} value={form[f.key]} onChange={(val) => setForm((p) => ({ ...p, [f.key]: val }))} />
                  </label>
                ))}
              </div>
            </Fragment>
          ))}
          {cfg.media && <MediaBox itemId={initial.id} queue={queue} setQueue={setQueue} />}
        </div>
        <div className="flex items-center gap-3 border-t border-gold/30 bg-ivory px-6 py-4">
          <button type="button" onClick={close} className="btn-outline flex-1">Cancel</button>
          <button type="submit" disabled={saving || missing} className="btn-maroon flex-[2] disabled:opacity-60">{saving ? (queue.length ? "Uploading…" : "Saving…") : initial.id ? "Save changes" : `Add ${cfg.noun}`}</button>
        </div>
        <p className="pb-3 text-center text-[11px] text-brown/45">Esc to close · Ctrl/⌘ + Enter to save</p>
      </motion.form>
    </div>,
    document.body
  );
}

function Cell({ f, row, onToggle }) {
  const v = f.computed ? f.computed(row) : row[f.key];
  if (f.type === "bool") {
    return (
      <button type="button" aria-label={f.label} aria-pressed={!!v} onClick={() => onToggle(f.key, !v)}
        className={`flex h-6 w-6 items-center justify-center rounded-md border transition-colors ${v ? "border-maroon bg-maroon text-ivory" : "border-gold/50 bg-white/70 text-transparent hover:border-gold"}`}>
        <Check className="h-3.5 w-3.5" />
      </button>
    );
  }
  if (v == null || v === "") return <span className="text-brown/30">—</span>;
  if (f.toggle) {
    const next = f.toggle[(f.toggle.indexOf(v) + 1) % f.toggle.length];
    const label = f.options.find((o) => o.value === v)?.label || v;
    return (
      <button type="button" title="Click to change" onClick={() => onToggle(f.key, next)}
        className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${v === f.toggle[1] ? "border-green-200 bg-green-100 text-green-800" : "border-amber-200 bg-amber-50 text-amber-700"}`}>{label}</button>
    );
  }
  if (f.type === "links") {
    const urls = urlsOf(v);
    if (!urls.length) return <span className="text-brown/30">—</span>;
    return (
      <div className="flex flex-col gap-1">
        {urls.map((u, i) => (
          <a key={u} href={u} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-maroon underline-offset-2 hover:underline">
            <ExternalLink className="h-3.5 w-3.5" /> {urls.length > 1 ? `Link ${i + 1}` : new URL(u).hostname.replace(/^www\./, "")}
          </a>
        ))}
      </div>
    );
  }
  if (f.type === "money") return <span className={f.strong ? "font-semibold text-maroon" : ""}>{rupee(v)}</span>;
  if (f.type === "date") return fmtDay(v);
  if (f.type === "time") return fmtTime(v);
  if (f.type === "enum") return f.options.find((o) => o.value === v)?.label || v;
  return v;
}

export default function PlannerList({ kind, children }) {
  const cfg = KINDS[kind];
  const [items, setItems] = useState(null);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({});
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`${BASE}/${kind}`);
      setItems(data.items);
    } catch (e) {
      toast.error(getErrorMessage(e, "Could not load this section"));
      setItems([]);
    }
  }, [kind]);

  useEffect(() => { setItems(null); setQuery(""); setFilters({}); load(); }, [load]);

  const tableFields = cfg.fields.filter((f) => f.table !== false);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (items || []).filter((r) => {
      for (const [k, val] of Object.entries(filters)) if (val && r[k] !== val) return false;
      return !q || cfg.search.some((k) => String(r[k] ?? "").toLowerCase().includes(q));
    });
  }, [items, query, filters, cfg]);

  const filterOptions = (key) => {
    const f = cfg.fields.find((x) => x.key === key);
    if (f?.options) return f.options;
    return [...new Set((items || []).map((r) => r[key]).filter(Boolean))].sort().map((v) => ({ value: v, label: v }));
  };

  const save = async (form, files = []) => {
    setSaving(true);
    const { id, mediaCount, ...body } = form;
    try {
      let itemId = id;
      if (id) {
        const { data } = await api.patch(`${BASE}/${kind}/${id}`, body);
        setItems((list) => list.map((r) => (r.id === id ? { ...data, mediaCount } : r)));
      } else {
        const { data } = await api.post(`${BASE}/${kind}`, body);
        itemId = data.id;
        setItems((list) => [...list, data]);
      }
      // The entry is saved; now upload any queued audio/video. A failed file is reported but never loses the entry.
      const failed = [];
      for (const f of files) {
        try { await uploadMedia(itemId, f); } catch (e) { failed.push(f.name); toast.error(`${f.name}: ${e.response ? getErrorMessage(e, "Upload failed") : e.message}`); }
      }
      await load(); // pick up server-side ordering and file counts
      setEditing(null);
      if (failed.length) toast.warning(`Saved, but ${failed.length} file${failed.length > 1 ? "s" : ""} didn't upload — open the entry to add again.`);
      else toast.success(files.length ? `Saved with ${files.length} file${files.length > 1 ? "s" : ""}` : "Saved");
    } catch (e) {
      toast.error(getErrorMessage(e, "Could not save"));
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (row, key, value) => {
    const before = items;
    setItems((list) => list.map((r) => (r.id === row.id ? { ...r, [key]: value } : r)));
    try {
      await api.patch(`${BASE}/${kind}/${row.id}`, { [key]: value });
    } catch (e) {
      setItems(before);
      toast.error(getErrorMessage(e, "Could not save"));
    }
  };

  // Line-up order: swap with the neighbour, then save the whole new order.
  const move = async (row, delta) => {
    const from = items.findIndex((r) => r.id === row.id), to = from + delta;
    if (to < 0 || to >= items.length) return;
    const before = items, next = [...items];
    [next[from], next[to]] = [next[to], next[from]];
    setItems(next);
    try { await api.post(`${BASE}/${kind}/reorder`, { ids: next.map((r) => r.id) }); }
    catch (e) { setItems(before); toast.error(getErrorMessage(e, "Could not change the order")); }
  };
  const filtering = !!query.trim() || Object.values(filters).some(Boolean);

  const remove = async (row) => {
    const name = row[cfg.fields[0].key] ?? row[cfg.fields.find((f) => f.required)?.key] ?? "this entry";
    if (!window.confirm(`Delete "${name}"?`)) return;
    try {
      await api.delete(`${BASE}/${kind}/${row.id}`);
      setItems((list) => list.filter((r) => r.id !== row.id));
      toast.success("Deleted");
    } catch (e) {
      toast.error(getErrorMessage(e, "Could not delete"));
    }
  };

  const totals = (cfg.totals || []).map((k) => {
    const f = cfg.fields.find((x) => x.key === k);
    return { key: k, label: f.label.replace(" (₹)", ""), value: shown.reduce((a, r) => a + (Number(f.computed ? f.computed(r) : r[k]) || 0), 0) };
  });
  const done = cfg.progress ? shown.filter(cfg.progress).length : 0;

  return (
    <section data-testid={`planner-${kind}`} className="card-royal p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold text-maroon">{cfg.title}</h3>
          <p className="mt-1 max-w-xl text-sm text-brown/65">{cfg.hint}</p>
        </div>
        <div className="flex gap-2">
          <a href={`/api${BASE}/${kind}/export`} className="btn-outline !px-4 !py-2 text-xs"><Download className="h-4 w-4" /> CSV</a>
          <button data-testid={`planner-add-${kind}`} onClick={() => setEditing({ ...(cfg.defaults || {}) })} className="btn-maroon !px-4 !py-2 text-xs"><Plus className="h-4 w-4" /> Add</button>
        </div>
      </div>

      {items && children?.({ items, shown })}

      {(totals.length > 0 || cfg.progress) && items && (
        <div className="mt-5 flex flex-wrap gap-3">
          <div className="rounded-xl border border-gold/30 bg-gold/5 px-4 py-2.5"><p className="text-[11px] uppercase tracking-wider text-brown/60">Entries</p><p className="font-display text-lg font-semibold text-maroon">{shown.length}</p></div>
          {totals.map((t) => (
            <div key={t.key} className="rounded-xl border border-gold/30 bg-gold/5 px-4 py-2.5">
              <p className="text-[11px] uppercase tracking-wider text-brown/60">Total {t.label.toLowerCase()}</p>
              <p className="font-display text-lg font-semibold text-maroon">{cfg.fields.find((x) => x.key === t.key).type === "money" || t.key === "remaining" ? rupee(t.value) : t.value.toLocaleString("en-IN")}</p>
            </div>
          ))}
          {cfg.progress && (
            <div className="min-w-[180px] flex-1 rounded-xl border border-gold/30 bg-gold/5 px-4 py-2.5">
              <p className="text-[11px] uppercase tracking-wider text-brown/60">Done · {done} of {shown.length}</p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-gold/20"><div className="h-full rounded-full bg-maroon transition-all" style={{ width: `${shown.length ? (done / shown.length) * 100 : 0}%` }} /></div>
            </div>
          )}
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brown/40" />
          <input data-testid={`planner-search-${kind}`} className="input-royal !pl-10" placeholder="Search…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        {(cfg.filters || []).map((f) => (
          <select key={f.key} aria-label={f.label} className="input-royal !w-auto" value={filters[f.key] || ""} onChange={(e) => setFilters((p) => ({ ...p, [f.key]: e.target.value }))}>
            <option value="">{f.label}</option>
            {filterOptions(f.key).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ))}
      </div>

      {cfg.reorder && filtering && <p className="mt-3 text-xs italic text-brown/60">Clear the search and filters to change the order.</p>}
      <div className="mt-4 overflow-x-auto rounded-xl border border-gold/20">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-gold/10 text-[11px] uppercase tracking-wider text-brown/70">
            <tr>
              {cfg.reorder && <th className="w-24 px-3 py-2.5 font-medium">Order</th>}
              {tableFields.map((f) => <th key={f.key} className={`px-3 py-2.5 font-medium ${f.type === "money" ? "text-right" : ""}`}>{f.label}</th>)}
              <th className="w-20 px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {items === null && <tr><td colSpan={tableFields.length + 1 + (cfg.reorder ? 1 : 0)} className="py-10 text-center italic text-brown/55">Loading…</td></tr>}
            {items !== null && shown.length === 0 && <tr><td colSpan={tableFields.length + 1 + (cfg.reorder ? 1 : 0)} className="py-10 text-center italic text-brown/55">{items.length ? "Nothing matches your search." : `No ${cfg.title.toLowerCase()} yet — tap Add.`}</td></tr>}
            {shown.map((row, i) => {
              const g = cfg.groupBy?.(row);
              const newGroup = cfg.groupBy && (i === 0 || cfg.groupBy(shown[i - 1]) !== g);
              return (
                <Fragment key={row.id}>
                  {newGroup && (
                    <tr className="bg-maroon/5"><td colSpan={tableFields.length + 1 + (cfg.reorder ? 1 : 0)} className="px-3 py-2 font-display text-sm font-semibold text-maroon">
                      {g} <span className="ml-1 text-xs font-normal text-brown/55">({shown.filter((r) => cfg.groupBy(r) === g).length})</span>
                    </td></tr>
                  )}
                  <tr className={`border-t border-gold/15 align-top hover:bg-gold/5 ${row.done ? "text-brown/50" : ""}`}>
                    {cfg.reorder && (
                      <td className="whitespace-nowrap px-3 py-2.5">
                        <span className="mr-1 inline-block w-6 text-center font-display text-base font-semibold text-maroon">{items.findIndex((r) => r.id === row.id) + 1}</span>
                        <button aria-label="Move up" disabled={filtering || items[0]?.id === row.id} onClick={() => move(row, -1)} className="rounded-full p-1 text-brown/70 hover:bg-gold/15 disabled:opacity-25"><ArrowUp className="h-4 w-4" /></button>
                        <button aria-label="Move down" disabled={filtering || items[items.length - 1]?.id === row.id} onClick={() => move(row, 1)} className="rounded-full p-1 text-brown/70 hover:bg-gold/15 disabled:opacity-25"><ArrowDown className="h-4 w-4" /></button>
                      </td>
                    )}
                    {tableFields.map((f) => (
                      <td key={f.key} className={`px-3 py-2.5 ${f.type === "money" ? "whitespace-nowrap text-right" : ""} ${f.wide ? "min-w-[180px]" : ""} ${row.done && f.key === "title" ? "line-through" : ""}`}>
                        <Cell f={f} row={row} onToggle={(k, val) => toggle(row, k, val)} />
                      </td>
                    ))}
                    <td className="whitespace-nowrap px-3 py-2.5 text-right">
                      <button aria-label="Edit" onClick={() => setEditing(row)} className="rounded-full p-1.5 text-brown/60 hover:bg-gold/15"><Pencil className="h-4 w-4" /></button>
                      <button aria-label="Delete" onClick={() => remove(row)} className="rounded-full p-1.5 text-red-500/80 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {editing && <EditModal kind={kind} initial={editing} saving={saving} onSave={save} onClose={() => setEditing(null)} />}
    </section>
  );
}
