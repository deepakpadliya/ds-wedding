import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Download, LogOut, Pencil, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import api, { getErrorMessage } from "@/lib/api";
import { EVENTS } from "@/config/weddingDetails";
import { Monogram } from "@/components/Ornaments";

const STATUS_BADGE = {
  yes: "border-green-200 bg-green-100 text-green-800",
  no: "border-red-200 bg-red-50 text-red-700",
  maybe: "border-amber-200 bg-amber-50 text-amber-700",
};
const STATUS_LABEL = { yes: "Attending", no: "Not attending", maybe: "Maybe" };

function StatCard({ label, value, testId }) {
  return (
    <div data-testid={testId} className="card-royal p-5">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-brown/60">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold text-maroon">{value}</p>
    </div>
  );
}

function GuestForm({ initial, onSave, onClose, saving }) {
  const [form, setForm] = useState(initial);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleEvent = (id) =>
    set("eventsAttending", form.eventsAttending.includes(id)
      ? form.eventsAttending.filter((e) => e !== id)
      : [...form.eventsAttending, id]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-maroon-deep/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        data-testid="guest-edit-modal"
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative z-10 max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-ivory p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl font-semibold text-maroon">Edit RSVP</h3>
          <button data-testid="guest-edit-close" onClick={onClose} className="rounded-full p-2 text-brown/60 hover:bg-gold/10">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-xs font-medium uppercase tracking-wider text-brown/70">Guest Name</span>
            <input data-testid="guest-edit-name" className="input-royal mt-1.5" value={form.guestName} onChange={(e) => set("guestName", e.target.value)} />
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wider text-brown/70">Mobile</span>
            <input data-testid="guest-edit-mobile" className="input-royal mt-1.5" value={form.mobileNumber} onChange={(e) => set("mobileNumber", e.target.value)} />
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wider text-brown/70">Attendance</span>
            <select data-testid="guest-edit-status" className="input-royal mt-1.5" value={form.attendanceStatus} onChange={(e) => set("attendanceStatus", e.target.value)}>
              <option value="yes">Attending</option>
              <option value="maybe">Maybe</option>
              <option value="no">Not attending</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wider text-brown/70">Attendees</span>
            <input data-testid="guest-edit-count" type="number" min="0" max="20" className="input-royal mt-1.5" value={form.attendeeCount} onChange={(e) => set("attendeeCount", parseInt(e.target.value || "0", 10))} />
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wider text-brown/70">Accommodation</span>
            <select data-testid="guest-edit-accommodation" className="input-royal mt-1.5" value={form.accommodationRequired ? "yes" : "no"} onChange={(e) => set("accommodationRequired", e.target.value === "yes")}>
              <option value="no">Not required</option>
              <option value="yes">Required</option>
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-medium uppercase tracking-wider text-brown/70">Events Attending</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {EVENTS.map((ev) => (
                <button key={ev.id} type="button" data-testid={`guest-edit-event-${ev.id}`} onClick={() => toggleEvent(ev.id)} className={`chip ${form.eventsAttending.includes(ev.id) ? "chip-active" : ""}`}>
                  {ev.title}
                </button>
              ))}
            </div>
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-medium uppercase tracking-wider text-brown/70">Message</span>
            <textarea data-testid="guest-edit-message" className="input-royal mt-1.5 min-h-[80px]" value={form.message || ""} onChange={(e) => set("message", e.target.value)} />
          </label>
        </div>
        <div className="mt-6 flex gap-3">
          <button data-testid="guest-save-btn" disabled={saving} onClick={() => onSave(form)} className="btn-maroon flex-1 disabled:opacity-60">
            {saving ? "Saving…" : "Save Changes"}
          </button>
          <button data-testid="guest-cancel-btn" onClick={onClose} className="btn-outline flex-1">Cancel</button>
        </div>
      </motion.div>
    </div>
  );
}

function fmtDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  return d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export default function AdminDashboard({ onLogout }) {
  const [stats, setStats] = useState(null);
  const [data, setData] = useState({ guests: [], total: 0, page: 1, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const timer = useRef(null);

  const load = useCallback(
    async (opts = {}) => {
      try {
        const [s, g] = await Promise.all([
          api.get("/v1/admin/dashboard"),
          api.get("/v1/admin/guests", {
            params: { page: opts.page ?? page, limit: 10, search: opts.search ?? search, status: opts.status ?? status },
          }),
        ]);
        setStats(s.data);
        setData(g.data);
      } catch (e) {
        toast.error(getErrorMessage(e, "Could not load dashboard"));
      } finally {
        setLoading(false);
      }
    },
    [page, search, status]
  );

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSearch = (v) => {
    setSearch(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setPage(1);
      load({ search: v, page: 1 });
    }, 400);
  };

  const onStatus = (v) => {
    setStatus(v);
    setPage(1);
    load({ status: v, page: 1 });
  };

  const gotoPage = (p) => {
    setPage(p);
    load({ page: p });
  };

  const exportCsv = async () => {
    try {
      const res = await api.get("/v1/admin/guests/export", { responseType: "blob" });
      const url = window.URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = "wedding-guests.csv";
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("CSV exported");
    } catch (e) {
      toast.error(getErrorMessage(e, "Export failed"));
    }
  };

  const saveGuest = async (form) => {
    setSaving(true);
    try {
      await api.patch(`/v1/admin/guests/${editing.id}`, form);
      setEditing(null);
      toast.success("RSVP updated");
      load();
    } catch (e) {
      toast.error(getErrorMessage(e, "Could not update RSVP"));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/v1/admin/guests/${deleting.id}`);
      setDeleting(null);
      toast.success("RSVP deleted");
      load();
    } catch (e) {
      toast.error(getErrorMessage(e, "Could not delete RSVP"));
    }
  };

  const logout = async () => {
    try {
      await api.post("/v1/admin/logout");
    } finally {
      onLogout();
    }
  };

  const maxEvent = stats ? Math.max(1, ...stats.eventAttendance.map((e) => e.count)) : 1;

  return (
    <div data-testid="admin-dashboard" className="min-h-screen bg-beige/40 pb-16">
      <header className="no-print sticky top-0 z-40 bg-maroon px-5 py-4 sm:px-8">
        <div className="wrap flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Monogram className="h-9 w-9" />
            <div>
              <p className="font-display text-lg font-semibold text-ivory">Wedding Admin</p>
              <p className="text-[11px] uppercase tracking-[0.2em] text-gold-soft/80">Deepak &amp; Shruti · 12.12.2026</p>
            </div>
          </div>
          <button data-testid="admin-logout-btn" onClick={logout} className="inline-flex items-center gap-2 rounded-full border border-gold/50 px-4 py-2 text-xs font-medium text-gold-soft transition-colors hover:bg-gold/10">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </header>

      <main className="wrap px-5 pt-8 sm:px-8">
        {loading ? (
          <p className="py-24 text-center font-script text-3xl text-gold-deep">Loading the guest book…</p>
        ) : (
          <>
            <section className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
              <StatCard testId="stat-total-rsvps" label="Total RSVPs" value={stats.totalRsvps} />
              <StatCard testId="stat-attending" label="Attending" value={stats.attending} />
              <StatCard testId="stat-not-attending" label="Not Attending" value={stats.notAttending} />
              <StatCard testId="stat-maybe" label="Maybe" value={stats.maybe} />
              <StatCard testId="stat-expected-attendees" label="Expected Guests" value={stats.totalExpectedAttendees} />
              <StatCard testId="stat-accommodation" label="Accommodation" value={stats.accommodationRequired} />
            </section>

            <section className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="card-royal p-6">
                <h3 className="font-display text-lg font-semibold text-maroon">Event-wise Attendance</h3>
                <div className="mt-4 space-y-3" data-testid="event-attendance-list">
                  {stats.eventAttendance.map((e) => (
                    <div key={e.eventId}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-brown/80">{e.title}</span>
                        <span className="font-semibold text-maroon" data-testid={`event-attendance-${e.eventId}`}>{e.count}</span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-gold/15">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-gold to-gold-deep"
                          initial={{ width: 0 }}
                          animate={{ width: `${(e.count / maxEvent) * 100}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card-royal p-6">
                <h3 className="font-display text-lg font-semibold text-maroon">Latest RSVPs</h3>
                <ul className="mt-3 space-y-2.5" data-testid="recent-rsvps">
                  {stats.recentRsvps.map((g) => (
                    <li key={g.id} className="flex items-center justify-between gap-3 rounded-lg bg-gold/5 px-3.5 py-2.5 text-sm">
                      <span className="truncate font-medium text-brown">{g.guestName}</span>
                      <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${STATUS_BADGE[g.attendanceStatus]}`}>
                        {STATUS_LABEL[g.attendanceStatus]}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="card-royal mt-8 p-5 sm:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <h3 className="font-display text-lg font-semibold text-maroon">Guest Management</h3>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gold-deep" />
                    <input
                      data-testid="guests-search-input"
                      className="input-royal !pl-9 sm:w-60"
                      placeholder="Search name or mobile…"
                      value={search}
                      onChange={(e) => onSearch(e.target.value)}
                    />
                  </div>
                  <select data-testid="guests-status-filter" className="input-royal sm:w-44" value={status} onChange={(e) => onStatus(e.target.value)}>
                    <option value="">All responses</option>
                    <option value="yes">Attending</option>
                    <option value="no">Not attending</option>
                    <option value="maybe">Maybe</option>
                  </select>
                  <button data-testid="guests-export-btn" onClick={exportCsv} className="btn-maroon !px-4 !py-2.5 text-xs">
                    <Download className="h-4 w-4" /> Export CSV
                  </button>
                </div>
              </div>

              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-gold/30 text-[11px] uppercase tracking-wider text-brown/55">
                      <th className="py-3 pr-4">Guest</th>
                      <th className="py-3 pr-4">Attendance</th>
                      <th className="py-3 pr-4">Guests</th>
                      <th className="py-3 pr-4">Events</th>
                      <th className="py-3 pr-4">Accom.</th>
                      <th className="py-3 pr-4">Submitted</th>
                      <th className="py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody data-testid="guests-table-body">
                    {data.guests.map((g) => (
                      <tr key={g.id} data-testid={`guest-row-${g.id}`} className="border-b border-gold/15 last:border-0 hover:bg-gold/5">
                        <td className="py-3 pr-4">
                          <p className="font-medium text-brown">{g.guestName}</p>
                          <p className="text-xs text-brown/55">{g.mobileNumber}</p>
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${STATUS_BADGE[g.attendanceStatus]}`}>
                            {STATUS_LABEL[g.attendanceStatus]}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-brown/80">{g.attendeeCount}</td>
                        <td className="py-3 pr-4 text-brown/80">{(g.eventsAttending || []).length}</td>
                        <td className="py-3 pr-4 text-brown/80">{g.accommodationRequired ? "Yes" : "—"}</td>
                        <td className="py-3 pr-4 text-xs text-brown/60">{fmtDate(g.createdAt)}</td>
                        <td className="py-3">
                          <div className="flex gap-1.5">
                            <button
                              data-testid={`guest-edit-btn-${g.id}`}
                              onClick={() => setEditing(g)}
                              className="rounded-lg p-2 text-gold-deep transition-colors hover:bg-gold/10"
                              aria-label={`Edit ${g.guestName}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              data-testid={`guest-delete-btn-${g.id}`}
                              onClick={() => setDeleting(g)}
                              className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50"
                              aria-label={`Delete ${g.guestName}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!data.guests.length && (
                      <tr>
                        <td colSpan="8" className="py-10 text-center text-sm italic text-brown/55" data-testid="guests-empty-state">
                          No RSVPs found{search || status ? " for this filter" : " yet — share the website with your guests!"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-brown/60" data-testid="guests-page-info">
                  Page {data.page} of {data.totalPages} · {data.total} total
                </span>
                <div className="flex gap-2">
                  <button data-testid="guests-prev-page" disabled={data.page <= 1} onClick={() => gotoPage(data.page - 1)} className="btn-outline !px-3 !py-1.5 text-xs disabled:opacity-40">
                    <ChevronLeft className="h-4 w-4" /> Prev
                  </button>
                  <button data-testid="guests-next-page" disabled={data.page >= data.totalPages} onClick={() => gotoPage(data.page + 1)} className="btn-outline !px-3 !py-1.5 text-xs disabled:opacity-40">
                    Next <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      <AnimatePresence>
        {editing && <GuestForm key="edit" initial={editing} onSave={saveGuest} onClose={() => setEditing(null)} saving={saving} />}
      </AnimatePresence>

      <AnimatePresence>
        {deleting && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-maroon-deep/70 backdrop-blur-sm" onClick={() => setDeleting(null)} />
            <motion.div
              data-testid="guest-delete-modal"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative z-10 w-full max-w-sm rounded-2xl bg-ivory p-7 text-center shadow-2xl"
            >
              <Trash2 className="mx-auto h-8 w-8 text-red-500" />
              <h3 className="mt-3 font-display text-xl font-semibold text-maroon">Delete this RSVP?</h3>
              <p className="mt-2 text-sm text-brown/70">
                {deleting.guestName} · {deleting.mobileNumber} — this cannot be undone.
              </p>
              <div className="mt-6 flex gap-3">
                <button data-testid="guest-delete-confirm-btn" onClick={confirmDelete} className="flex-1 rounded-full bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700">
                  Delete
                </button>
                <button data-testid="guest-delete-cancel-btn" onClick={() => setDeleting(null)} className="btn-outline flex-1">
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
