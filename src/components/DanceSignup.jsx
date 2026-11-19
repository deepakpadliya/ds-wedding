import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Music2, Paperclip, Plus, Send, Upload, X } from "lucide-react";
import { toast } from "sonner";
import api, { getErrorMessage } from "@/lib/api";
import { useSide } from "@/context/SideContext";
import Reveal, { SectionHeading } from "./Reveal";

const EMPTY = { performers: "", contact: "", side: "", song: "", links: "", note: "", website: "" };
const MAX_FILES = 3;
const MAX_BYTES = 20 * 1024 * 1024;
const EXT = /\.(mp3|m4a|aac|wav|ogg|mp4|mov|webm)$/i;
const mb = (n) => `${(n / 1048576).toFixed(1)} MB`;
const OCTET = { headers: { "Content-Type": "application/octet-stream" } };

// Files go up in 2 MB pieces (hosting rejects big single requests). The token proves this visitor made the request.
async function uploadFile(id, token, file, onPart) {
  const auth = { "X-Upload-Token": token };
  const { data: init } = await api.post(`/v1/dance/${id}/media/init`, { name: file.name, size: file.size }, { headers: auth });
  try {
    for (let i = 0; i < init.chunks; i++) {
      onPart(i + 1, init.chunks);
      await api.put(`/v1/dance/media/${init.id}/chunks/${i}`, file.slice(i * init.chunkSize, (i + 1) * init.chunkSize), { headers: { ...OCTET.headers, ...auth } });
    }
    await api.post(`/v1/dance/media/${init.id}/complete`, null, { headers: auth });
  } catch (e) {
    await api.delete(`/v1/dance/media/${init.id}`, { headers: auth }).catch(() => {});
    throw e;
  }
}

const SIDES = [
  ["bride", "💃", "Shruti's side", "Bride's family & friends"],
  ["groom", "🕺", "Deepak's side", "Groom's family & friends"],
];
const NOTES = ["About 3 minutes", "We need a mic 🎤", "We have props ✨", "Group of 5+"];

function Notes() {
  const reduce = useReducedMotion();
  const items = useMemo(
    () => Array.from({ length: 16 }, (_, i) => ({ id: i, left: 5 + Math.random() * 90, delay: Math.random() * 0.8, size: 14 + Math.random() * 14, dur: 2.4 + Math.random() * 1.6 })),
    []
  );
  if (reduce) return null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {items.map((h) => (
        <motion.span key={h.id} className="absolute bottom-0 text-maroon/50" style={{ left: `${h.left}%` }} initial={{ y: 0, opacity: 0 }} animate={{ y: -380, opacity: [0, 1, 0] }} transition={{ duration: h.dur, delay: h.delay, ease: "easeOut" }}>
          <Music2 style={{ width: h.size, height: h.size }} />
        </motion.span>
      ))}
    </div>
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
    <motion.button type="button" data-testid={testId} onClick={onClick} whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}
      className={`flex flex-col items-center rounded-2xl border px-4 py-5 text-center transition-colors ${active ? "border-gold-deep bg-maroon text-ivory shadow-lg" : "border-gold/40 bg-white/70 text-brown hover:border-gold"}`}>
      <span className="text-3xl" aria-hidden="true">{emoji}</span>
      <span className="mt-2 font-display text-lg font-semibold">{title}</span>
      {sub && <span className={`mt-0.5 text-xs ${active ? "text-ivory/75" : "text-brown/60"}`}>{sub}</span>}
    </motion.button>
  );
}

export default function DanceSignup() {
  const pageSide = useSide();
  const reduce = useReducedMotion();
  const [form, setForm] = useState({ ...EMPTY, side: pageSide || "" });
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(0);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false); // false | { failed: [names] }
  const [files, setFiles] = useState([]);
  const [progress, setProgress] = useState(null);
  const picker = useRef(null);
  const locked = useRef(false);
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const steps = ["who", "mobile", ...(pageSide ? [] : ["side"]), "song", "media", "note"];
  const key = steps[Math.min(step, steps.length - 1)];
  const isLast = step >= steps.length - 1;
  const lead = form.performers.trim().split(/[\s,&]/)[0];

  const check = (k) => {
    if (k === "who" && !form.performers.trim()) return "Please tell us who will be dancing 🙂";
    if (k === "mobile" && !/^\+?[\d\s-]{10,15}$/.test(form.contact.trim())) return "Enter a valid mobile number so we can reach you";
    if (k === "side" && !form.side) return "Please choose bride's side or groom's side";
    if (k === "song" && !form.song.trim()) return "Please tell us the song name 🎶";
    if (k === "song" && form.links.trim() && !/^https?:\/\//i.test(form.links.trim())) return "Link must start with http:// or https://";
    return "";
  };
  const fail = (msg) => { setError(msg); setShake((n) => n + 1); };
  const go = (d) => { setDir(d); setError(""); setStep((s) => Math.max(0, s + d)); };

  const pick = (list) => {
    const next = [...files];
    for (const f of list) {
      if (next.length >= MAX_FILES) { toast.error(`You can add up to ${MAX_FILES} files`); break; }
      if (!EXT.test(f.name)) toast.error(`"${f.name}" isn't supported — use MP3, M4A, WAV, MP4, MOV or WebM`);
      else if (f.size > MAX_BYTES) toast.error(`"${f.name}" is ${mb(f.size)} — files must be under 20 MB. Paste a link instead.`);
      else next.push(f);
    }
    setFiles(next);
    if (picker.current) picker.current.value = "";
  };

  const submit = async () => {
    setBusy(true);
    try {
      const { data } = await api.post("/v1/dance", { ...form, side: form.side });
      const failed = [];
      for (const [i, f] of files.entries()) {
        try { await uploadFile(data.id, data.token, f, (part, parts) => setProgress(`Uploading file ${i + 1} of ${files.length} (part ${part}/${parts})…`)); }
        catch { failed.push(f.name); }
      }
      setDone({ failed });
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        const loc = detail[0]?.loc?.[0];
        const idx = { performers: "who", contact: "mobile", side: "side", song: "song", links: "song" }[loc];
        if (idx && steps.includes(idx)) { setDir(-1); setStep(steps.indexOf(idx)); }
        fail(detail[0]?.msg || "Please check your details");
      } else fail(getErrorMessage(err, "Could not send your request. Please try again."));
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  const next = () => {
    if (locked.current) return;
    const msg = check(key);
    if (msg) return fail(msg);
    if (isLast) return submit();
    go(1);
  };

  const choose = (v) => {
    set("side", v);
    setError("");
    locked.current = true;
    setTimeout(() => { locked.current = false; go(1); }, 320);
  };

  const reset = () => { setForm({ ...EMPTY, side: pageSide || "" }); setFiles([]); setDone(false); setStep(0); setDir(1); };

  const variants = {
    enter: (d) => ({ opacity: 0, x: reduce ? 0 : d * 50 }),
    center: { opacity: 1, x: 0 },
    exit: (d) => ({ opacity: 0, x: reduce ? 0 : d * -50 }),
  };

  const body = {
    who: (
      <div className="space-y-6">
        <Question title="Who's taking the stage?" hint="A solo star, a couple, or the whole cousin gang" />
        <input data-testid="dance-performers-input" className="input-royal mx-auto block max-w-md text-center text-lg" placeholder="e.g. Rahul & Priya, or Cousins group" maxLength={300} value={form.performers} onChange={(e) => set("performers", e.target.value)} />
      </div>
    ),
    mobile: (
      <div className="space-y-6">
        <Question title={`Love it${lead ? `, ${lead}` : ""}! Where can we reach you?` } hint="We'll call or WhatsApp about your slot" />
        <input data-testid="dance-contact-input" autoFocus className="input-royal mx-auto block max-w-md text-center text-lg" type="tel" inputMode="tel" autoComplete="tel" placeholder="9876543210 or +44…" maxLength={20} value={form.contact} onChange={(e) => set("contact", e.target.value)} />
      </div>
    ),
    side: (
      <div className="space-y-6">
        <Question title="Which side are you dancing for?" hint="So we can balance the line-up" />
        <div className="mx-auto grid max-w-lg gap-4 sm:grid-cols-2">
          {SIDES.map(([v, emoji, title, sub]) => (
            <Choice key={v} testId={`dance-side-${v}`} emoji={emoji} title={title} sub={sub} active={form.side === v} onClick={() => choose(v)} />
          ))}
        </div>
      </div>
    ),
    song: (
      <div className="space-y-5">
        <Question title="What's the song?" hint="Tell us the track that gets you moving 🎶" />
        <input data-testid="dance-song-input" className="input-royal mx-auto block max-w-md text-center text-lg" placeholder="Song name (required)" autoFocus maxLength={200} value={form.song} onChange={(e) => set("song", e.target.value)} />
        <input data-testid="dance-link-input" className="input-royal mx-auto block max-w-md text-center" type="url" inputMode="url" placeholder="YouTube / Spotify link (optional)" maxLength={500} value={form.links} onChange={(e) => set("links", e.target.value)} />
      </div>
    ),
    media: (
      <div className="space-y-5">
        <Question title="Got your music or a rehearsal clip?" hint={`Optional — audio or video, up to ${MAX_FILES} files, 20 MB each`} />
        <input ref={picker} data-testid="dance-file-input" type="file" multiple accept=".mp3,.m4a,.aac,.wav,.ogg,.mp4,.mov,.webm,audio/*,video/*" className="hidden" onChange={(e) => pick([...e.target.files])} />
        {files.length < MAX_FILES && (
          <motion.button type="button" disabled={busy} onClick={() => picker.current?.click()} whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }}
            className="mx-auto flex w-full max-w-md flex-col items-center rounded-2xl border-2 border-dashed border-gold/60 bg-white/60 px-6 py-8 text-brown transition-colors hover:border-gold-deep hover:bg-gold/10">
            <Upload className="h-8 w-8 text-gold-deep" />
            <span className="mt-2 font-display text-lg font-semibold">Tap to add audio / video</span>
            <span className="mt-0.5 text-xs text-brown/60">MP3, M4A, WAV, MP4, MOV, WebM</span>
          </motion.button>
        )}
        <div className="mx-auto max-w-md space-y-2">
          {files.map((f, i) => (
            <motion.div key={`${f.name}-${i}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 rounded-xl border border-gold/30 bg-white/70 px-3 py-2 text-sm">
              <Paperclip className="h-4 w-4 shrink-0 text-gold-deep" />
              <span className="min-w-0 flex-1 truncate">{f.name}</span>
              <span className="text-xs text-brown/50">{mb(f.size)}</span>
              <button type="button" disabled={busy} aria-label={`Remove ${f.name}`} onClick={() => setFiles((l) => l.filter((_, j) => j !== i))} className="rounded-full p-1 text-brown/60 hover:bg-gold/15 disabled:opacity-40"><X className="h-4 w-4" /></button>
            </motion.div>
          ))}
        </div>
      </div>
    ),
    note: (
      <div className="space-y-5">
        <Question title="Anything else we should know?" hint="Optional — duration, props, special requests" />
        <textarea data-testid="dance-note-input" className="input-royal mx-auto block min-h-[100px] max-w-xl resize-y" placeholder="Tell us more…" maxLength={300} value={form.note} onChange={(e) => set("note", e.target.value)} />
        <div className="flex flex-wrap justify-center gap-2">
          {NOTES.map((n) => (
            <button key={n} type="button" onClick={() => set("note", form.note.includes(n) ? form.note : `${form.note}${form.note ? ", " : ""}${n}`.slice(0, 300))} className={`chip ${form.note.includes(n) ? "chip-active" : ""}`}>{n}</button>
          ))}
        </div>
      </div>
    ),
  }[key];

  return (
    <section id="dance" data-testid="dance-section" className="section-pad scroll-mt-20">
      <div className="wrap px-5 sm:px-8">
        <SectionHeading eyebrow="Sangeet" title="Want to Dance?" script="Take the stage" />
        {done ? (
          <div className="space-y-6">
            <motion.div data-testid="dance-success" initial={{ opacity: 0, scale: 0.94, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="card-royal relative mx-auto max-w-xl overflow-hidden p-8 text-center sm:p-10">
              <Notes />
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2, stiffness: 200, damping: 12 }}>
                <Music2 className="mx-auto h-10 w-10 text-maroon" />
              </motion.div>
              <p className="mt-4 font-script text-4xl text-gold-deep">The floor is yours</p>
              <p className="mt-3 font-display text-2xl font-semibold text-maroon">{lead ? `Thank you, ${lead} — ` : ""}your performance request is in!</p>
              <p className="mt-3 font-lora italic text-brown/75">The family will review the line-up and get in touch with you about your slot. Start rehearsing — we can't wait to watch!</p>
              <p className="mt-5 text-sm text-brown/60">— Deepak &amp; Shruti and families</p>
              {done.failed?.length > 0 && (
                <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-left text-sm text-amber-800">
                  Your request was received, but we couldn't upload: {done.failed.join(", ")}. Please share {done.failed.length > 1 ? "them" : "it"} with the family directly (WhatsApp) or send a link instead.
                </p>
              )}
            </motion.div>
            <div className="text-center"><button className="btn-outline" onClick={reset}>Add another performance</button></div>
          </div>
        ) : (
          <Reveal>
            <form data-testid="dance-form" onSubmit={(e) => { e.preventDefault(); next(); }} noValidate className="card-royal relative mx-auto flex min-h-[460px] max-w-2xl flex-col p-6 sm:p-10">
              <div className="mb-8">
                <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.18em] text-brown/55">
                  <span>Step {Math.min(step + 1, steps.length)} of {steps.length}</span>
                  <span>{Math.round((step / steps.length) * 100)}%</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gold/20">
                  <motion.div className="h-full rounded-full bg-gradient-to-r from-gold to-maroon" animate={{ width: `${(step / steps.length) * 100}%` }} transition={{ duration: 0.5, ease: "easeOut" }} />
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
                    <motion.p key={shake} data-testid="dance-error-banner" role="alert" initial={{ opacity: 0, x: 0 }} animate={{ opacity: 1, x: reduce ? 0 : [0, -8, 8, -6, 6, 0] }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}
                      className="mx-auto mt-5 max-w-md rounded-lg bg-red-50 px-4 py-2.5 text-center text-sm text-red-700">
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* honeypot: hidden from people, bots fill it in */}
              <input tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" name="website" value={form.website} onChange={(e) => set("website", e.target.value)} />

              <div className="mt-8 flex items-center justify-between gap-3">
                <button type="button" onClick={() => go(-1)} disabled={step === 0 || busy} className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-brown/70 transition hover:bg-gold/10 disabled:invisible">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button data-testid="dance-submit-btn" type="submit" disabled={busy} className="btn-maroon disabled:opacity-60">
                  {busy ? (
                    <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1 }}>{progress || "Sending with love…"}</motion.span>
                  ) : isLast ? (
                    <><Send className="h-4 w-4" /> Request a slot</>
                  ) : (
                    <>Continue <ArrowRight className="h-4 w-4" /></>
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
