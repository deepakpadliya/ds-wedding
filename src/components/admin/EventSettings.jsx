import { useEffect, useRef, useState } from "react";
import { Copy, Eye, EyeOff, ImagePlus, Pencil, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import api, { getErrorMessage } from "@/lib/api";
import { DAYS, EVENTS as DEFAULTS } from "@/config/weddingDetails";
import { SIDE_LABEL } from "@/hooks/useEvents";
import { compressImage } from "@/lib/image";
import SidePanel from "./SidePanel";

const SIDE_BADGE = {
  both: "border-gold/50 bg-gold/10 text-gold-deep",
  bride: "border-rose-200 bg-rose-50 text-rose-700",
  groom: "border-sky-200 bg-sky-50 text-sky-700",
};

const label = "text-xs font-medium uppercase tracking-wider text-brown/70";

const BLANK = { title: "", day: 1, time: "", venue: "", description: "", mapQuery: "", side: "both", visible: true };

// Cover picture picker: shows the current picture and queues a replacement (uploaded when the event is saved).
function CoverPicker({ current, picked, setPicked, onRemove, canRemove }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const preview = picked?.url || current;
  const choose = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      const { blob } = await compressImage(file, { maxSide: 1600, quality: 0.85 });
      if (picked?.url) URL.revokeObjectURL(picked.url);
      setPicked({ blob, url: URL.createObjectURL(blob) });
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };
  return (
    <div className="sm:col-span-2">
      <span className={label}>Cover picture</span>
      <div className="mt-1.5 overflow-hidden rounded-xl border border-gold/30 bg-white/60">
        {preview
          ? <img src={preview} alt="Event cover preview" className="h-44 w-full object-cover" />
          : <div className="flex h-32 items-center justify-center text-sm italic text-brown/50">No picture yet — a plain panel is shown</div>}
      </div>
      <input ref={input} data-testid="event-cover-input" type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => choose(e.target.files?.[0])} />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button type="button" disabled={busy} onClick={() => input.current?.click()} className="btn-outline !px-4 !py-2 text-xs disabled:opacity-60">
          <ImagePlus className="h-4 w-4" /> {busy ? "Preparing…" : preview ? "Change picture" : "Upload picture"}
        </button>
        {picked && <button type="button" onClick={() => { URL.revokeObjectURL(picked.url); setPicked(null); }} className="text-xs text-brown/60 underline">Undo new picture</button>}
        {!picked && canRemove && <button type="button" onClick={onRemove} className="text-xs text-brown/60 underline">Remove uploaded picture</button>}
      </div>
      <p className="mt-1 text-[11px] text-brown/50">JPEG, PNG or WebP. Resized automatically. A wide picture works best (about 3:2).</p>
    </div>
  );
}

function EventForm({ event, onSave, onClose, saving }) {
  const isNew = !event.id;
  const [form, setForm] = useState({ ...BLANK, ...event, mapQuery: event.mapQuery || "", description: event.description || "" });
  const [picked, setPicked] = useState(null);
  const [removeCover, setRemoveCover] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const original = DEFAULTS.find((x) => x.id === event.id);
  const uploaded = event.image && event.image !== original?.image; // an uploaded cover, not the built-in one
  const current = removeCover ? original?.image || null : event.image || original?.image || null;
  const invalid = !form.title.trim() || !form.time.trim() || !form.venue.trim();
  const dirty = !!picked || removeCover || JSON.stringify(form) !== JSON.stringify({ ...BLANK, ...event, mapQuery: event.mapQuery || "", description: event.description || "" });
  const submit = () => { if (!saving && !invalid) onSave(form, { blob: picked?.blob || null, remove: removeCover && !picked }); };
  return (
    <SidePanel
      testId="event-edit-modal" title={isNew ? "Add event" : "Configure event"} subtitle={isNew ? null : event.title}
      dirty={dirty} onClose={onClose} onSubmit={submit} canSubmit={!invalid && !saving}
      footer={<>
        <button onClick={onClose} className="btn-outline flex-1">Cancel</button>
        <button data-testid="event-save-btn" disabled={saving || invalid} onClick={submit} className="btn-maroon flex-[2] disabled:opacity-60">
          {saving ? "Saving…" : isNew ? "Add Event" : "Save Event"}
        </button>
      </>}
    >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className={label}>Event name *</span>
            <input data-testid="event-edit-title" className="input-royal mt-1.5" value={form.title} onChange={(e) => set("title", e.target.value)} />
          </label>
          <label className="block">
            <span className={label}>Day *</span>
            <select data-testid="event-edit-day" className="input-royal mt-1.5" value={form.day} onChange={(e) => set("day", Number(e.target.value))}>
              {DAYS.map((d) => <option key={d.day} value={d.day}>{d.weekday} · {d.dateLabel}</option>)}
            </select>
          </label>
          <label className="block">
            <span className={label}>Time (IST) *</span>
            <input data-testid="event-edit-time" className="input-royal mt-1.5" value={form.time} onChange={(e) => set("time", e.target.value)} placeholder="07:30 AM" />
          </label>
          <label className="block sm:col-span-2">
            <span className={label}>Whose event?</span>
            <select data-testid="event-edit-side" className="input-royal mt-1.5" value={form.side} onChange={(e) => set("side", e.target.value)}>
              <option value="both">Both families</option>
              <option value="bride">Bride's side only</option>
              <option value="groom">Groom's side only</option>
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className={label}>Venue *</span>
            <input data-testid="event-edit-venue" className="input-royal mt-1.5" value={form.venue} onChange={(e) => set("venue", e.target.value)} />
          </label>
          <label className="block sm:col-span-2">
            <span className={label}>Map search (optional)</span>
            <input data-testid="event-edit-map" className="input-royal mt-1.5" value={form.mapQuery} onChange={(e) => set("mapQuery", e.target.value)} placeholder="Leave empty to hide “Get Directions”" />
          </label>
          <label className="block sm:col-span-2">
            <span className={label}>Description</span>
            <textarea data-testid="event-edit-description" className="input-royal mt-1.5 min-h-[88px]" value={form.description} onChange={(e) => set("description", e.target.value)} />
          </label>
          <CoverPicker current={current} picked={picked} setPicked={setPicked} canRemove={!!uploaded && !removeCover} onRemove={() => setRemoveCover(true)} />
          <label className="flex items-center gap-3 sm:col-span-2">
            <input data-testid="event-edit-visible" type="checkbox" checked={form.visible} onChange={(e) => set("visible", e.target.checked)} className="h-4 w-4 accent-[#641E2B]" />
            <span className="text-sm text-brown/80">Show this event on the website and in the RSVP form</span>
          </label>
        </div>
    </SidePanel>
  );
}

const SHARE_LINKS = [
  { path: "/bride", label: "Bride's side link", sub: "Shows only the bride-side and shared events; RSVP is pre-set to the bride's side" },
  { path: "/groom", label: "Groom's side link", sub: "Shows only the groom-side and shared events; RSVP is pre-set to the groom's side" },
  { path: "/all", label: "Common link (all events)", sub: "Shows every event; guests choose their side in the RSVP. The plain site address opens the groom's side." },
];

function ShareLinks() {
  const copy = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      toast.error("Couldn't copy — select the link and copy it manually");
    }
  };
  return (
    <div data-testid="share-links" className="mt-5 grid gap-3 lg:grid-cols-3">
      {SHARE_LINKS.map((l) => {
        const url = `${window.location.origin}${l.path}`;
        return (
          <div key={l.path} className="rounded-xl border border-gold/30 bg-gold/5 p-4">
            <p className="text-sm font-semibold text-maroon">{l.label}</p>
            <p className="mt-0.5 text-xs text-brown/60">{l.sub}</p>
            <div className="mt-3 flex items-center gap-2">
              <input readOnly value={url} onFocus={(e) => e.target.select()} className="input-royal !py-2 text-xs" />
              <button onClick={() => copy(url)} className="rounded-lg border border-gold/50 p-2 text-gold-deep hover:bg-gold/10" aria-label={`Copy ${l.label}`}>
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function EventSettings({ onChanged }) {
  const [events, setEvents] = useState(null);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get("/v1/admin/events")
      .then(({ data }) => setEvents(data.events))
      .catch((e) => toast.error(getErrorMessage(e, "Could not load events")));
  }, []);

  const apply = (data) => {
    setEvents(data.events);
    onChanged?.();
  };

  const save = async (form, cover) => {
    setSaving(true);
    try {
      const { title, day, time, venue, description, mapQuery, side, visible } = form;
      const body = { title, day, time, venue, description, mapQuery, side, visible };
      let id = form.id, data;
      if (id) ({ data } = await api.patch(`/v1/admin/events/${id}`, body));
      else {
        ({ data } = await api.post("/v1/admin/events", body));
        const known = new Set(events.map((e) => e.id));
        id = data.events.find((e) => !known.has(e.id))?.id;
      }
      if (cover.blob && id) ({ data } = await api.put(`/v1/admin/events/${id}/image`, cover.blob, { headers: { "Content-Type": "image/jpeg" } }));
      else if (cover.remove && id) ({ data } = await api.delete(`/v1/admin/events/${id}/image`));
      apply(data);
      setEditing(null);
      toast.success(form.id ? "Event updated" : "Event added");
    } catch (e) {
      toast.error(getErrorMessage(e, "Could not save the event"));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (ev) => {
    if (!window.confirm(`Delete "${ev.title}"? Guests' past RSVP choices for it stay in the records.`)) return;
    try {
      const { data } = await api.delete(`/v1/admin/events/${ev.id}`);
      apply(data);
      toast.success("Event deleted");
    } catch (e) {
      toast.error(getErrorMessage(e, "Could not delete the event"));
    }
  };

  const toggle = async (ev) => {
    try {
      const { data } = await api.patch(`/v1/admin/events/${ev.id}`, { visible: !ev.visible });
      apply(data);
    } catch (e) {
      toast.error(getErrorMessage(e, "Could not update event"));
    }
  };

  const reset = async (ev) => {
    try {
      const { data } = await api.delete(`/v1/admin/events/${ev.id}/overrides`);
      apply(data);
      toast.success("Event restored to its original details");
    } catch (e) {
      toast.error(getErrorMessage(e, "Could not reset event"));
    }
  };

  return (
    <section data-testid="event-settings" className="card-royal mt-8 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-lg font-semibold text-maroon">Wedding Events Configuration</h3>
        <button data-testid="event-add-btn" onClick={() => setEditing({ ...BLANK })} className="btn-maroon !px-4 !py-2 text-xs"><Plus className="h-4 w-4" /> Add event</button>
      </div>
      <p className="mt-1 text-sm text-brown/65">
        Add events, edit the day, timings, venues and cover pictures, choose whether an event belongs to the bride's side, the groom's side or both, and hide events you don't want guests to see.
        Guests pick their side while sending the RSVP and only see the events meant for them.
      </p>
      <ShareLinks />
      {!events ? (
        <p className="py-8 text-center italic text-brown/55">Loading events…</p>
      ) : (
        <div className="mt-5 space-y-6">
          {DAYS.map((d) => (
            <div key={d.day}>
              <p className="eyebrow">{d.weekday} · {d.dateLabel}</p>
              <ul className="mt-2 divide-y divide-gold/15 rounded-xl border border-gold/25">
                {events.filter((e) => e.day === d.day).map((ev) => {
                  const original = DEFAULTS.find((x) => x.id === ev.id);
                  const cover = ev.image || original?.image;
                  const changed = original && (original.day !== ev.day || (ev.image && ev.image !== original.image) || original.title !== ev.title || original.time !== ev.time || original.venue !== ev.venue || original.description !== ev.description || ev.side !== "both" || !ev.visible);
                  return (
                    <li key={ev.id} data-testid={`event-config-${ev.id}`} className={`flex flex-wrap items-center gap-3 px-4 py-3 ${ev.visible ? "" : "opacity-55"}`}>
                      {cover
                        ? <img src={cover} alt="" loading="lazy" className="h-12 w-16 shrink-0 rounded-lg border border-gold/25 object-cover" />
                        : <div className="h-12 w-16 shrink-0 rounded-lg border border-dashed border-gold/40 bg-gold/5" />}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-brown">{ev.title}{ev.custom && <span className="ml-2 rounded-full bg-maroon/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-maroon">Added</span>}</p>
                        <p className="truncate text-xs text-brown/60">{ev.time} IST · {ev.venue}</p>
                      </div>
                      <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${SIDE_BADGE[ev.side]}`}>{SIDE_LABEL[ev.side]}</span>
                      <div className="flex gap-1">
                        <button onClick={() => toggle(ev)} className="rounded-lg p-2 text-gold-deep hover:bg-gold/10" aria-label={ev.visible ? "Hide event" : "Show event"} title={ev.visible ? "Visible — click to hide" : "Hidden — click to show"}>
                          {ev.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </button>
                        <button data-testid={`event-edit-btn-${ev.id}`} onClick={() => setEditing(ev)} className="rounded-lg p-2 text-gold-deep hover:bg-gold/10" aria-label={`Edit ${ev.title}`}>
                          <Pencil className="h-4 w-4" />
                        </button>
                        {ev.custom && (
                          <button onClick={() => remove(ev)} className="rounded-lg p-2 text-red-500/80 hover:bg-red-50" aria-label={`Delete ${ev.title}`} title="Delete event">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                        {changed && (
                          <button onClick={() => reset(ev)} className="rounded-lg p-2 text-brown/50 hover:bg-gold/10" aria-label="Restore original" title="Restore original details">
                            <RotateCcw className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
      {editing && <EventForm key={editing.id || "new"} event={editing} onSave={save} onClose={() => setEditing(null)} saving={saving} />}
    </section>
  );
}
