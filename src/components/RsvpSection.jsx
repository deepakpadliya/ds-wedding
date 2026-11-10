import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Heart, Info, Minus, Plus, Send } from "lucide-react";
import { toast } from "sonner";
import api, { getErrorMessage } from "@/lib/api";
import { DAYS, WEDDING } from "@/config/weddingDetails";
import useEvents, { eventVisibleToSide } from "@/hooks/useEvents";
import useContacts from "@/hooks/useContacts";
import { useSide } from "@/context/SideContext";
import Reveal, { SectionHeading } from "./Reveal";

const INDIAN_MOBILE = /^[6-9]\d{9}$/;
const INTERNATIONAL = /^\+\d{10,14}$/;

const EMPTY = {
  guestName: "",
  mobileNumber: "",
  attendanceStatus: "",
  attendeeCount: 1,
  side: "",
  eventsAttending: [],
  accommodationRequired: null,
  message: "",
};

const STEPS_ATTENDING = ["name", "mobile", "side", "status", "count", "events", "stay", "message"];
const STEPS_DECLINING = ["name", "mobile", "side", "status", "message"];

const WISHES = [
  "Wishing you a lifetime of love and laughter! 💛",
  "Can't wait to dance at your wedding! 💃🕺",
  "Congratulations Deepak & Shruti! 🎉",
  "May your journey together be beautiful ✨",
];

function Hearts() {
  const reduce = useReducedMotion();
  const items = useMemo(
    () => Array.from({ length: 18 }, (_, i) => ({ id: i, left: 5 + Math.random() * 90, delay: Math.random() * 0.8, size: 14 + Math.random() * 16, dur: 2.4 + Math.random() * 1.6 })),
    []
  );
  if (reduce) return null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {items.map((h) => (
        <motion.span
          key={h.id}
          className="absolute bottom-0 text-maroon/50"
          style={{ left: `${h.left}%` }}
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: -380, opacity: [0, 1, 0] }}
          transition={{ duration: h.dur, delay: h.delay, ease: "easeOut" }}
        >
          <Heart style={{ width: h.size, height: h.size }} className="fill-current" />
        </motion.span>
      ))}
    </div>
  );
}

function ThankYouCard({ guest, testId }) {
  const contacts = useContacts();
  const callNumber = (contacts[guest.side] || contacts.groom)[0]?.number || WEDDING.contacts[0].number;
  const duplicate = testId === "rsvp-duplicate-card";
  const first = (guest.guestName || "").split(" ")[0];
  const declined = guest.attendanceStatus === "no";
  const headline = duplicate
    ? `Thank you, ${first} — we already have your response`
    : declined
      ? `Thank you, ${first}, for letting us know`
      : `Thank you, ${first}, for your response`;
  const body = declined
    ? "We will miss you on our special days, but you will be in our hearts and prayers. Thank you for your blessings."
    : "We are so happy you will be celebrating with us. We will be waiting for you in all the wedding vibes — the music, the colours, the laughter and the love.";
  return (
    <motion.div
      data-testid={testId}
      initial={{ opacity: 0, scale: 0.94, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="card-royal relative mx-auto max-w-xl overflow-hidden p-8 text-center sm:p-10"
    >
      {!duplicate && !declined && <Hearts />}
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2, stiffness: 200, damping: 12 }}>
        <Heart className="mx-auto h-10 w-10 fill-maroon/15 text-maroon" />
      </motion.div>
      <p className="mt-4 font-script text-4xl text-gold-deep">With love &amp; gratitude</p>
      <p className="mt-3 font-display text-2xl font-semibold text-maroon">{headline}</p>
      <p className="mt-3 font-lora italic text-brown/75">{body}</p>
      <p className="mt-5 text-sm text-brown/60">— Deepak &amp; Shruti and families</p>
      {duplicate && (
        <p className="mt-6 flex items-start gap-2 rounded-lg bg-amber-50 px-4 py-3 text-left text-sm text-amber-800">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          To change your response, please call us at{" "}
          <a className="font-semibold underline" href={WEDDING.telNumber(callNumber)}>
            {WEDDING.displayNumber(callNumber)}
          </a>
          .
        </p>
      )}
    </motion.div>
  );
}

function Question({ title, hint }) {
  return (
    <div className="text-center">
      <h3 className="font-display text-2xl font-semibold text-maroon sm:text-3xl">{title}</h3>
      {hint && <p className="mt-2 font-lora italic text-brown/65">{hint}</p>}
    </div>
  );
}

function Choice({ active, onClick, emoji, title, sub, testId }) {
  return (
    <motion.button
      type="button"
      data-testid={testId}
      onClick={onClick}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.97 }}
      className={`flex flex-col items-center rounded-2xl border px-4 py-5 text-center transition-colors ${
        active ? "border-gold-deep bg-maroon text-ivory shadow-lg" : "border-gold/40 bg-white/70 text-brown hover:border-gold"
      }`}
    >
      <span className="text-3xl" aria-hidden="true">{emoji}</span>
      <span className="mt-2 font-display text-lg font-semibold">{title}</span>
      {sub && <span className={`mt-0.5 text-xs ${active ? "text-ivory/75" : "text-brown/60"}`}>{sub}</span>}
    </motion.button>
  );
}

export default function RsvpSection() {
  const EVENTS = useEvents();
  const pageSide = useSide();
  const reduce = useReducedMotion();
  const [form, setForm] = useState({ ...EMPTY, side: pageSide || "" });
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const locked = useRef(false); // true while a tapped choice is gliding to the next question
  const [result, setResult] = useState(null); // { type: 'success' | 'duplicate', guest }

  const allSteps = form.attendanceStatus === "no" ? STEPS_DECLINING : STEPS_ATTENDING;
  const steps = pageSide ? allSteps.filter((k) => k !== "side") : allSteps; // side already known from the URL
  const key = steps[Math.min(step, steps.length - 1)];
  const isLast = step >= steps.length - 1;
  const first = form.guestName.trim().split(" ")[0];
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const sideEvents = EVENTS.filter((ev) => eventVisibleToSide(ev, form.side));

  const check = (k) => {
    if (k === "name" && form.guestName.trim().length < 2) return "Please tell us your name 🙂";
    if (k === "mobile") {
      const mobile = form.mobileNumber.replace(/[\s-]/g, "");
      if (!mobile) return "We need a number to reach you";
      if (!(INTERNATIONAL.test(mobile) || (mobile.length === 10 && INDIAN_MOBILE.test(mobile))))
        return "Enter a 10-digit Indian mobile number, or an international one starting with +";
    }
    if (k === "side" && !form.side) return "Tap one to continue";
    if (k === "status" && !form.attendanceStatus) return "Tap one to continue";
    if (k === "events" && form.eventsAttending.length === 0) return "Pick at least one celebration to join";
    if (k === "stay" && form.accommodationRequired === null) return "Tap one to continue";
    return "";
  };

  const go = (delta) => {
    setDir(delta);
    setError("");
    setStep((s) => Math.max(0, s + delta));
  };

  const fail = (msg) => {
    setError(msg);
    setShake((n) => n + 1);
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const attending = form.attendanceStatus !== "no";
      const payload = {
        guestName: form.guestName.trim(),
        mobileNumber: form.mobileNumber.replace(/[\s-]/g, ""),
        attendanceStatus: form.attendanceStatus,
        attendeeCount: attending ? form.attendeeCount : 0,
        side: form.side,
        eventsAttending: attending ? form.eventsAttending.filter((id) => sideEvents.some((e) => e.id === id)) : [],
        accommodationRequired: attending ? !!form.accommodationRequired : false,
        message: form.message,
      };
      const { data } = await api.post("/v1/rsvp", payload);
      setResult({ type: "success", guest: data });
      toast.success("Thank you! We can't wait to celebrate with you.");
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.existing) {
        setResult({ type: "duplicate", guest: err.response.data.existing });
        toast.info("This mobile number already has an RSVP");
      } else {
        fail(getErrorMessage(err, "Could not send your RSVP — please try again"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const next = () => {
    if (locked.current) return;
    const msg = check(key);
    if (msg) return fail(msg);
    if (isLast) return submit();
    go(1);
  };

  // Tapping a big choice card selects it and glides to the next question.
  const choose = (k, v) => {
    set(k, v);
    setError("");
    locked.current = true;
    setTimeout(() => {
      locked.current = false;
      go(1);
    }, 320);
  };

  const reset = () => {
    setResult(null);
    setForm({ ...EMPTY, side: pageSide || "" });
    setStep(0);
    setDir(1);
  };

  const toggleEvent = (id) =>
    set("eventsAttending", form.eventsAttending.includes(id) ? form.eventsAttending.filter((x) => x !== id) : [...form.eventsAttending, id]);
  const allSelected = sideEvents.length > 0 && sideEvents.every((e) => form.eventsAttending.includes(e.id));

  const variants = {
    enter: (d) => ({ opacity: 0, x: reduce ? 0 : d * 50 }),
    center: { opacity: 1, x: 0 },
    exit: (d) => ({ opacity: 0, x: reduce ? 0 : d * -50 }),
  };

  const body = {
    name: (
      <div className="space-y-6">
        <Question title="First things first — what's your name?" hint="So we can welcome you properly" />
        <input
          data-testid="rsvp-name-input"
          className="input-royal mx-auto block max-w-md text-center text-lg"
          value={form.guestName}
          onChange={(e) => set("guestName", e.target.value)}
          placeholder="Your full name"
          autoComplete="name"
        />
      </div>
    ),
    mobile: (
      <div className="space-y-6">
        <Question title={`Lovely to meet you, ${first || "friend"}!`} hint="Where can we reach you? One RSVP per mobile number." />
        <input
          data-testid="rsvp-mobile-input"
          autoFocus
          className="input-royal mx-auto block max-w-md text-center text-lg"
          value={form.mobileNumber}
          onChange={(e) => set("mobileNumber", e.target.value)}
          placeholder="9876543210 or +44…"
          inputMode="tel"
          autoComplete="tel"
        />
      </div>
    ),
    side: (
      <div className="space-y-6">
        <Question title="Whose side of the celebration are you joining from?" hint="We'll show you the events planned for you" />
        <div className="mx-auto grid max-w-lg gap-4 sm:grid-cols-2">
          <Choice testId="rsvp-side-bride" emoji="👰" title="Shruti's side" sub="Bride's family & friends" active={form.side === "bride"} onClick={() => choose("side", "bride")} />
          <Choice testId="rsvp-side-groom" emoji="🤵" title="Deepak's side" sub="Groom's family & friends" active={form.side === "groom"} onClick={() => choose("side", "groom")} />
        </div>
      </div>
    ),
    status: (
      <div className="space-y-6">
        <Question title="Will you be celebrating with us?" hint="Be honest — we'll save you a seat either way 😉" />
        <div className="mx-auto grid max-w-2xl gap-4 sm:grid-cols-3">
          <Choice
            testId="rsvp-status-yes"
            emoji="🎉"
            title="Yes, I'll be there!"
            sub="Count me in"
            active={form.attendanceStatus === "yes"}
            onClick={() => choose("attendanceStatus", "yes")}
          />
          <Choice
            testId="rsvp-status-maybe"
            emoji="🤔"
            title="Not sure yet"
            sub="I'll try my best"
            active={form.attendanceStatus === "maybe"}
            onClick={() => choose("attendanceStatus", "maybe")}
          />
          <Choice
            testId="rsvp-status-no"
            emoji="💌"
            title="Can't make it"
            sub="Sending my blessings"
            active={form.attendanceStatus === "no"}
            onClick={() => choose("attendanceStatus", "no")}
          />
        </div>
      </div>
    ),
    count: (
      <div className="space-y-6">
        <Question title="Wonderful! How many will be coming?" hint="Including you" />
        <div className="flex items-center justify-center gap-6">
          <button
            type="button"
            data-testid="rsvp-count-minus"
            aria-label="One fewer guest"
            onClick={() => set("attendeeCount", Math.max(1, form.attendeeCount - 1))}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/50 bg-white/70 text-maroon transition hover:bg-gold/10 active:scale-90"
          >
            <Minus className="h-5 w-5" />
          </button>
          <div className="w-24 text-center">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={form.attendeeCount}
                data-testid="rsvp-attendee-count"
                initial={{ opacity: 0, y: -12, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.8 }}
                className="block font-display text-6xl font-semibold text-maroon"
              >
                {form.attendeeCount}
              </motion.span>
            </AnimatePresence>
          </div>
          <button
            type="button"
            data-testid="rsvp-count-plus"
            aria-label="One more guest"
            onClick={() => set("attendeeCount", Math.min(20, form.attendeeCount + 1))}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/50 bg-white/70 text-maroon transition hover:bg-gold/10 active:scale-90"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
        <div className="flex min-h-[28px] flex-wrap justify-center gap-1.5" aria-hidden="true">
          {Array.from({ length: form.attendeeCount }, (_, i) => (
            <motion.span key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 14 }}>
              <Heart className="h-5 w-5 fill-maroon/20 text-maroon" />
            </motion.span>
          ))}
        </div>
        <p className="text-center text-sm text-brown/60">
          {form.attendeeCount === 1 ? "Just you — we can't wait!" : form.attendeeCount === 2 ? "You + 1 — lovely!" : `${form.attendeeCount} lovely guests — the more the merrier!`}
        </p>
      </div>
    ),
    events: (
      <div className="space-y-5">
        <Question title="Which celebrations will you join?" hint="Tap to pick — all times are IST" />
        <div className="text-center">
          <button
            type="button"
            data-testid="rsvp-select-all"
            onClick={() => set("eventsAttending", allSelected ? [] : sideEvents.map((e) => e.id))}
            className={`chip ${allSelected ? "chip-active" : ""}`}
          >
            {allSelected ? "Clear all" : "✨ I'll come to everything!"}
          </button>
        </div>
        <div className="space-y-4">
          {DAYS.map((d) => {
            const list = sideEvents.filter((e) => e.day === d.day);
            if (!list.length) return null;
            return (
              <div key={d.day}>
                <p className="eyebrow mb-2 text-center">{d.weekday} · {d.dateLabel}</p>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {list.map((ev) => {
                    const active = form.eventsAttending.includes(ev.id);
                    return (
                      <motion.button
                        key={ev.id}
                        type="button"
                        data-testid={`rsvp-event-chip-${ev.id}`}
                        onClick={() => toggleEvent(ev.id)}
                        whileTap={{ scale: 0.97 }}
                        className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                          active ? "border-gold-deep bg-maroon text-ivory shadow" : "border-gold/40 bg-white/70 text-brown hover:border-gold"
                        }`}
                      >
                        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${active ? "border-gold bg-gold text-maroon" : "border-gold/50"}`}>
                          {active && <Check className="h-4 w-4" />}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold">{ev.title}</span>
                          <span className={`block text-xs ${active ? "text-ivory/75" : "text-brown/60"}`}>{ev.time}</span>
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    ),
    stay: (
      <div className="space-y-6">
        <Question title="Shall we arrange a place for you to stay?" hint="Coming from afar? Our families will take care of you" />
        <div className="mx-auto grid max-w-lg gap-4 sm:grid-cols-2">
          <Choice testId="rsvp-stay-yes" emoji="🛏️" title="Yes, please" sub="I'd love some help" active={form.accommodationRequired === true} onClick={() => choose("accommodationRequired", true)} />
          <Choice testId="rsvp-stay-no" emoji="🏡" title="I'm all set" sub="No need, thank you" active={form.accommodationRequired === false} onClick={() => choose("accommodationRequired", false)} />
        </div>
      </div>
    ),
    message: (
      <div className="space-y-5">
        <Question
          title={form.attendanceStatus === "no" ? "Leave a blessing for the couple" : "Anything you'd like to tell the couple?"}
          hint="Optional — a wish, a blessing or a funny memory"
        />
        <textarea
          data-testid="rsvp-message-input"
          className="input-royal mx-auto block min-h-[110px] max-w-xl resize-y"
          value={form.message}
          onChange={(e) => set("message", e.target.value)}
          placeholder="Write your wishes here…"
          maxLength={1000}
        />
        <div className="flex flex-wrap justify-center gap-2">
          {WISHES.map((w) => (
            <button key={w} type="button" onClick={() => set("message", w)} className={`chip ${form.message === w ? "chip-active" : ""}`}>
              {w}
            </button>
          ))}
        </div>
      </div>
    ),
  }[key];

  return (
    <section id="rsvp" data-testid="rsvp-section" className="section-pad scroll-mt-20 bg-beige/50">
      <div className="wrap">
        <SectionHeading eyebrow="RSVP" title="Kindly Respond by 1 December 2026" script="will you join us?" />

        {result ? (
          <div className="space-y-6">
            <ThankYouCard guest={result.guest} testId={result.type === "duplicate" ? "rsvp-duplicate-card" : "rsvp-success-card"} />
            <div className="text-center">
              <button data-testid="rsvp-again-btn" className="btn-outline" onClick={reset}>
                RSVP for another guest
              </button>
            </div>
          </div>
        ) : (
          <Reveal>
            <form
              data-testid="rsvp-form"
              onSubmit={(e) => {
                e.preventDefault();
                next();
              }}
              className="card-royal mx-auto flex min-h-[460px] max-w-2xl flex-col p-6 sm:p-10"
              noValidate
            >
              <div className="mb-8">
                <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.18em] text-brown/55">
                  <span>Question {Math.min(step + 1, steps.length)} of {steps.length}</span>
                  <span>{Math.round(((step + 1) / steps.length) * 100)}%</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gold/20">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-gold to-maroon"
                    animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>

              <div className="flex flex-1 flex-col justify-center overflow-hidden">
                <AnimatePresence mode="wait" custom={dir} initial={false}>
                  <motion.div key={key} custom={dir} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.28, ease: "easeOut" }}>
                    {body}
                  </motion.div>
                </AnimatePresence>

                <AnimatePresence>
                  {error && (
                    <motion.p
                      key={shake}
                      data-testid="rsvp-error-banner"
                      role="alert"
                      initial={{ opacity: 0, x: 0 }}
                      animate={{ opacity: 1, x: reduce ? 0 : [0, -8, 8, -6, 6, 0] }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      className="mx-auto mt-5 max-w-md rounded-lg bg-red-50 px-4 py-2.5 text-center text-sm text-red-700"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <div className="mt-8 flex items-center justify-between gap-3">
                <button
                  type="button"
                  data-testid="rsvp-back-btn"
                  onClick={() => go(-1)}
                  disabled={step === 0}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-brown/70 transition hover:bg-gold/10 disabled:invisible"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                {/* Choice steps advance on tap, but keep a Continue button for keyboard / revisits. */}
                <button data-testid="rsvp-submit-btn" type="submit" disabled={submitting} className="btn-maroon disabled:opacity-60">
                  {submitting ? (
                    <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
                      Sending with love…
                    </motion.span>
                  ) : isLast ? (
                    <>
                      <Send className="h-4 w-4" /> Send with love
                    </>
                  ) : (
                    <>
                      Continue <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </Reveal>
        )}
      </div>
    </section>
  );
}
