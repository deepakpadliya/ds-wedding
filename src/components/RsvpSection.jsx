import { useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Info, Send } from "lucide-react";
import { toast } from "sonner";
import api, { getErrorMessage } from "@/lib/api";
import { EVENTS, WEDDING } from "@/config/weddingDetails";
import Reveal, { SectionHeading } from "./Reveal";

const INDIAN_MOBILE = /^[6-9]\d{9}$/;
const INTERNATIONAL = /^\+\d{10,14}$/;
const VALID_EVENT_IDS = EVENTS.map((e) => e.id);

const EMPTY = {
  guestName: "",
  mobileNumber: "",
  attendanceStatus: "yes",
  attendeeCount: 1,
  eventsAttending: [],
  accommodationRequired: false,
  message: "",
};

function Detail({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gold/20 py-2 last:border-0">
      <span className="text-xs uppercase tracking-wider text-brown/55">{label}</span>
      <span className="text-right text-sm font-medium text-brown">{value}</span>
    </div>
  );
}

function ResponseSummary({ guest, testId }) {
  const attendingEvents = EVENTS.filter((e) => guest.eventsAttending?.includes(e.id));
  return (
    <div data-testid={testId} className="card-royal mx-auto max-w-xl p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <CheckCircle2 className="h-6 w-6 shrink-0 text-sage" />
        <p className="font-display text-xl font-semibold text-maroon">
          {guest.guestName}, your RSVP is on record
        </p>
      </div>
      <div className="mt-5">
        <Detail label="Mobile" value={guest.mobileNumber} />
        <Detail label="Attendance" value={guest.attendanceStatus === "yes" ? "Joyfully attending" : guest.attendanceStatus === "no" ? "Regretfully not attending" : "Maybe"} />
        {guest.attendanceStatus !== "no" && (
          <>
            <Detail label="Attendees" value={guest.attendeeCount} />
            <Detail label="Events" value={attendingEvents.length ? attendingEvents.map((e) => e.title).join(", ") : "—"} />
            <Detail label="Accommodation" value={guest.accommodationRequired ? "Required" : "Not required"} />
          </>
        )}
      </div>
      {testId === "rsvp-duplicate-card" && (
        <p className="mt-5 flex items-start gap-2 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          This mobile number has already responded. To make any changes, please call us at{" "}
          <a className="font-semibold underline" href={WEDDING.telNumber(WEDDING.contacts[0].number)}>
            {WEDDING.contacts[0].number}
          </a>
          .
        </p>
      )}
    </div>
  );
}

export default function RsvpSection() {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { type: 'success' | 'duplicate', guest }

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.guestName.trim() || form.guestName.trim().length < 2) e.guestName = "Please enter the guest's full name";
    const mobile = form.mobileNumber.replace(/[\s-]/g, "");
    if (!mobile) e.mobileNumber = "Mobile number is required";
    else if (!(INTERNATIONAL.test(mobile) || (mobile.length === 10 && INDIAN_MOBILE.test(mobile))))
      e.mobileNumber = "Enter a valid Indian mobile number (10 digits starting 6-9) or international format with +";
    if (form.attendanceStatus !== "no") {
      if (form.attendeeCount < 1 || form.attendeeCount > 20) e.attendeeCount = "Attendees must be between 1 and 20";
      if (form.eventsAttending.length === 0) e.eventsAttending = "Please select at least one event";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fix the highlighted fields");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        guestName: form.guestName.trim(),
        mobileNumber: form.mobileNumber.replace(/[\s-]/g, ""),
      };
      const { data } = await api.post("/v1/rsvp", payload);
      setResult({ type: "success", guest: data });
      setForm(EMPTY);
      toast.success("RSVP received with love — thank you!");
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.existing) {
        setResult({ type: "duplicate", guest: err.response.data.existing });
        toast.info("This mobile number already has an RSVP");
      } else {
        toast.error(getErrorMessage(err, "Could not submit RSVP"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = (key) => `input-royal ${errors[key] ? "!border-red-400 !ring-red-100" : ""}`;

  return (
    <section id="rsvp" data-testid="rsvp-section" className="section-pad scroll-mt-20 bg-beige/50">
      <div className="wrap">
        <SectionHeading eyebrow="RSVP" title="Kindly Respond by 1 December 2026" script="will you join us?" />

        {result ? (
          <div className="space-y-6">
            <ResponseSummary guest={result.guest} testId={result.type === "duplicate" ? "rsvp-duplicate-card" : "rsvp-success-card"} />
            <div className="text-center">
              <button data-testid="rsvp-again-btn" className="btn-outline" onClick={() => setResult(null)}>
                Submit another RSVP
              </button>
            </div>
          </div>
        ) : (
          <Reveal>
            <form data-testid="rsvp-form" onSubmit={submit} className="card-royal mx-auto max-w-2xl p-6 sm:p-10" noValidate>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="text-xs font-medium uppercase tracking-wider text-brown/70">Guest Name *</span>
                  <input
                    data-testid="rsvp-name-input"
                    className={inputCls("guestName") + " mt-1.5"}
                    value={form.guestName}
                    onChange={(e) => set("guestName", e.target.value)}
                    placeholder="Full name"
                  />
                  {errors.guestName && <span className="mt-1 block text-xs text-red-600">{errors.guestName}</span>}
                </label>

                <label className="block">
                  <span className="text-xs font-medium uppercase tracking-wider text-brown/70">Mobile Number *</span>
                  <input
                    data-testid="rsvp-mobile-input"
                    className={inputCls("mobileNumber") + " mt-1.5"}
                    value={form.mobileNumber}
                    onChange={(e) => set("mobileNumber", e.target.value)}
                    placeholder="9876543210 or +44…"
                    inputMode="tel"
                  />
                  {errors.mobileNumber && <span className="mt-1 block text-xs text-red-600">{errors.mobileNumber}</span>}
                </label>

                <label className="block">
                  <span className="text-xs font-medium uppercase tracking-wider text-brown/70">Number of Attendees *</span>
                  <input
                    data-testid="rsvp-attendee-count"
                    type="number"
                    min="1"
                    max="20"
                    className={inputCls("attendeeCount") + " mt-1.5"}
                    value={form.attendeeCount}
                    onChange={(e) => set("attendeeCount", parseInt(e.target.value || "1", 10))}
                    disabled={form.attendanceStatus === "no"}
                  />
                  {errors.attendeeCount && <span className="mt-1 block text-xs text-red-600">{errors.attendeeCount}</span>}
                </label>
              </div>

              <div className="mt-5">
                <span className="text-xs font-medium uppercase tracking-wider text-brown/70">Attendance Status *</span>
                <div className="mt-2 grid gap-2.5 sm:grid-cols-3">
                  {[
                    { v: "yes", label: "Yes, joyfully attend", tid: "rsvp-status-yes" },
                    { v: "no", label: "Regretfully decline", tid: "rsvp-status-no" },
                    { v: "maybe", label: "Not sure yet", tid: "rsvp-status-maybe" },
                  ].map((o) => (
                    <button
                      key={o.v}
                      type="button"
                      data-testid={o.tid}
                      onClick={() => set("attendanceStatus", o.v)}
                      className={`rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                        form.attendanceStatus === o.v
                          ? "border-gold-deep bg-maroon text-ivory shadow"
                          : "border-gold/40 bg-white/60 text-brown hover:border-gold"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              {form.attendanceStatus !== "no" && (
                <div className="mt-5">
                  <span className="text-xs font-medium uppercase tracking-wider text-brown/70">
                    Events Attending * <span className="normal-case tracking-normal text-brown/50">(all times IST)</span>
                  </span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {EVENTS.map((ev) => {
                      const active = form.eventsAttending.includes(ev.id);
                      return (
                        <button
                          key={ev.id}
                          type="button"
                          data-testid={`rsvp-event-chip-${ev.id}`}
                          onClick={() =>
                            set(
                              "eventsAttending",
                              active
                                ? form.eventsAttending.filter((x) => x !== ev.id)
                                : [...form.eventsAttending, ev.id]
                            )
                          }
                          className={`chip ${active ? "chip-active" : ""}`}
                        >
                          {ev.title} · {ev.time}
                        </button>
                      );
                    })}
                  </div>
                  {errors.eventsAttending && <span className="mt-1.5 block text-xs text-red-600">{errors.eventsAttending}</span>}

                  <label className="mt-5 flex items-center gap-3">
                    <input
                      data-testid="rsvp-accommodation-check"
                      type="checkbox"
                      checked={form.accommodationRequired}
                      onChange={(e) => set("accommodationRequired", e.target.checked)}
                      className="h-4 w-4 accent-[#641E2B]"
                    />
                    <span className="text-sm text-brown/80">Yes, I will need accommodation assistance</span>
                  </label>
                </div>
              )}

              <div className="mt-5 grid gap-5">
                <label className="block">
                  <span className="text-xs font-medium uppercase tracking-wider text-brown/70">Additional Message</span>
                  <textarea
                    data-testid="rsvp-message-input"
                    className="input-royal mt-1.5 min-h-[96px] resize-y"
                    value={form.message}
                    onChange={(e) => set("message", e.target.value)}
                    placeholder="A message for the couple…"
                  />
                </label>
              </div>

              {errors._server && (
                <p data-testid="rsvp-error-banner" className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4" /> {errors._server}
                </p>
              )}

              <button data-testid="rsvp-submit-btn" type="submit" disabled={submitting} className="btn-maroon mt-7 w-full disabled:opacity-60">
                {submitting ? (
                  <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
                    Sending with love…
                  </motion.span>
                ) : (
                  <>
                    <Send className="h-4 w-4" /> Send RSVP
                  </>
                )}
              </button>
              <p className="mt-3 text-center text-xs text-brown/55">
                One RSVP per mobile number — duplicates will show your existing response.
              </p>
            </form>
          </Reveal>
        )}
      </div>
    </section>
  );
}
