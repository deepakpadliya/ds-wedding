import { useEffect, useState } from "react";
import { Copy, Eye, EyeOff, Pencil, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import api, { getErrorMessage } from "@/lib/api";
import { DAYS, EVENTS as DEFAULTS } from "@/config/weddingDetails";
import { SIDE_LABEL } from "@/hooks/useEvents";

const SIDE_BADGE = {
  both: "border-gold/50 bg-gold/10 text-gold-deep",
  bride: "border-rose-200 bg-rose-50 text-rose-700",
  groom: "border-sky-200 bg-sky-50 text-sky-700",
};

const label = "text-xs font-medium uppercase tracking-wider text-brown/70";

function EventForm({ event, onSave, onClose, saving }) {
  const [form, setForm] = useState({ ...event, mapQuery: event.mapQuery || "" });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-maroon-deep/70 backdrop-blur-sm" onClick={onClose} />
      <div data-testid="event-edit-modal" className="relative z-10 max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-ivory p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl font-semibold text-maroon">Configure event</h3>
          <button onClick={onClose} className="rounded-full p-2 text-brown/60 hover:bg-gold/10" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className={label}>Event name</span>
            <input data-testid="event-edit-title" className="input-royal mt-1.5" value={form.title} onChange={(e) => set("title", e.target.value)} />
          </label>
          <label className="block">
            <span className={label}>Time (IST)</span>
            <input data-testid="event-edit-time" className="input-royal mt-1.5" value={form.time} onChange={(e) => set("time", e.target.value)} placeholder="07:30 AM" />
          </label>
          <label className="block">
            <span className={label}>Whose event?</span>
            <select data-testid="event-edit-side" className="input-royal mt-1.5" value={form.side} onChange={(e) => set("side", e.target.value)}>
              <option value="both">Both families</option>
              <option value="bride">Bride's side only</option>
              <option value="groom">Groom's side only</option>
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className={label}>Venue</span>
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
          <label className="flex items-center gap-3 sm:col-span-2">
            <input data-testid="event-edit-visible" type="checkbox" checked={form.visible} onChange={(e) => set("visible", e.target.checked)} className="h-4 w-4 accent-[#641E2B]" />
            <span className="text-sm text-brown/80">Show this event on the website and in the RSVP form</span>
          </label>
        </div>
        <div className="mt-6 flex gap-3">
          <button data-testid="event-save-btn" disabled={saving} onClick={() => onSave(form)} className="btn-maroon flex-1 disabled:opacity-60">
            {saving ? "Saving…" : "Save Event"}
          </button>
          <button onClick={onClose} className="btn-outline flex-1">Cancel</button>
        </div>
      </div>
    </div>
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

  const save = async (form) => {
    setSaving(true);
    try {
      const { title, time, venue, description, mapQuery, side, visible } = form;
      const { data } = await api.patch(`/v1/admin/events/${form.id}`, { title, time, venue, description, mapQuery, side, visible });
      apply(data);
      setEditing(null);
      toast.success("Event updated");
    } catch (e) {
      toast.error(getErrorMessage(e, "Could not update event"));
    } finally {
      setSaving(false);
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
      <h3 className="font-display text-lg font-semibold text-maroon">Wedding Events Configuration</h3>
      <p className="mt-1 text-sm text-brown/65">
        Edit timings and venues, choose whether an event belongs to the bride's side, the groom's side or both, and hide events you don't want guests to see.
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
                  const changed = original && (original.title !== ev.title || original.time !== ev.time || original.venue !== ev.venue || original.description !== ev.description || ev.side !== "both" || !ev.visible);
                  return (
                    <li key={ev.id} data-testid={`event-config-${ev.id}`} className={`flex flex-wrap items-center gap-3 px-4 py-3 ${ev.visible ? "" : "opacity-55"}`}>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-brown">{ev.title}</p>
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
      {editing && <EventForm key={editing.id} event={editing} onSave={save} onClose={() => setEditing(null)} saving={saving} />}
    </section>
  );
}
