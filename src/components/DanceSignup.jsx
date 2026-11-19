import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Music2, Paperclip, Plus, Send, X } from "lucide-react";
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

const SIDES = [["groom", "Groom's side"], ["bride", "Bride's side"], ["both", "Both"]];

export default function DanceSignup() {
  const pageSide = useSide();
  const [form, setForm] = useState({ ...EMPTY, side: pageSide || "" });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false); // false | { failed: [names] }
  const [files, setFiles] = useState([]);
  const [progress, setProgress] = useState(null); // "Uploading 1 of 2 (part 3/5)…"
  const picker = useRef(null);
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

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

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!form.performers.trim()) next.performers = "Please tell us who will be dancing";
    if (!/^\+?[\d\s-]{10,15}$/.test(form.contact.trim())) next.contact = "Enter a valid mobile number";
    if (form.links.trim() && !/^https?:\/\//i.test(form.links.trim())) next.links = "Link must start with http:// or https://";
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      const { data } = await api.post("/v1/dance", { ...form, side: form.side || null });
      const failed = [];
      for (const [i, f] of files.entries()) {
        try { await uploadFile(data.id, data.token, f, (part, parts) => setProgress(`Uploading file ${i + 1} of ${files.length} (part ${part}/${parts})…`)); }
        catch { failed.push(f.name); }
      }
      setDone({ failed });
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) setErrors(Object.fromEntries(detail.map((d) => [d.loc?.[0], d.msg])));
      else toast.error(getErrorMessage(err, "Could not send your request. Please try again."));
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  const err = (k) => errors[k] && <p className="mt-1 text-xs text-red-700" role="alert">{errors[k]}</p>;

  return (
    <section id="dance" data-testid="dance-section" className="section-pad scroll-mt-20">
      <div className="wrap px-5 sm:px-8">
        <SectionHeading eyebrow="Sangeet" title="Want to Dance?" script="Take the stage" />
        <Reveal className="mx-auto max-w-xl">
          <AnimatePresence mode="wait">
            {done ? (
              <motion.div key="done" data-testid="dance-success" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="card-royal p-8 text-center sm:p-10">
                <Music2 className="mx-auto h-10 w-10 text-maroon" />
                <p className="mt-4 font-display text-2xl font-semibold text-maroon">Your performance request is in!</p>
                <p className="mt-3 font-lora italic text-brown/75">Thank you — the family will review the line-up and get in touch with you about your slot.</p>
                {done.failed?.length > 0 && (
                  <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    Your request was received, but we couldn't upload: {done.failed.join(", ")}. Please share {done.failed.length > 1 ? "them" : "it"} with the family directly (WhatsApp) or send a link instead.
                  </p>
                )}
                <button className="btn-outline mt-6" onClick={() => { setForm({ ...EMPTY, side: pageSide || "" }); setFiles([]); setDone(false); }}>Add another performance</button>
              </motion.div>
            ) : (
              <motion.form key="form" data-testid="dance-form" onSubmit={submit} noValidate className="card-royal space-y-5 p-6 sm:p-8">
                <p className="text-center font-lora italic text-brown/70">Love to dance? Tell us who is performing and to which song — we'll put together the line-up.</p>
                <label className="block">
                  <span className="text-xs font-medium uppercase tracking-wider text-brown/70">Who will dance? *</span>
                  <input data-testid="dance-performers-input" className="input-royal mt-1.5" placeholder="e.g. Rahul & Priya, or Cousins group" maxLength={300} value={form.performers} onChange={set("performers")} />
                  {err("performers")}
                </label>
                <label className="block">
                  <span className="text-xs font-medium uppercase tracking-wider text-brown/70">Your mobile number *</span>
                  <input data-testid="dance-contact-input" className="input-royal mt-1.5" type="tel" inputMode="tel" placeholder="So we can reach you" maxLength={20} value={form.contact} onChange={set("contact")} />
                  {err("contact")}
                </label>
                {!pageSide && (
                  <div>
                    <span className="text-xs font-medium uppercase tracking-wider text-brown/70">Which side?</span>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {SIDES.map(([v, label]) => (
                        <button key={v} type="button" onClick={() => setForm((p) => ({ ...p, side: p.side === v ? "" : v }))} className={`chip ${form.side === v ? "chip-active" : ""}`}>{label}</button>
                      ))}
                    </div>
                  </div>
                )}
                <label className="block">
                  <span className="text-xs font-medium uppercase tracking-wider text-brown/70">Song</span>
                  <input data-testid="dance-song-input" className="input-royal mt-1.5" placeholder="Song name (optional)" maxLength={200} value={form.song} onChange={set("song")} />
                </label>
                <label className="block">
                  <span className="text-xs font-medium uppercase tracking-wider text-brown/70">Song link</span>
                  <input data-testid="dance-link-input" className="input-royal mt-1.5" type="url" inputMode="url" placeholder="YouTube / Spotify link (optional)" maxLength={500} value={form.links} onChange={set("links")} />
                  {err("links")}
                </label>
                <div>
                  <span className="text-xs font-medium uppercase tracking-wider text-brown/70">Upload your song or rehearsal video</span>
                  <p className="mt-1 text-xs text-brown/55">Audio (MP3, M4A, WAV) or video (MP4, MOV, WebM) · up to {MAX_FILES} files, 20 MB each</p>
                  <div className="mt-2 space-y-2">
                    {files.map((f, i) => (
                      <div key={`${f.name}-${i}`} className="flex items-center gap-2 rounded-xl border border-gold/30 bg-white/70 px-3 py-2 text-sm">
                        <Paperclip className="h-4 w-4 shrink-0 text-gold-deep" />
                        <span className="min-w-0 flex-1 truncate">{f.name}</span>
                        <span className="text-xs text-brown/50">{mb(f.size)}</span>
                        <button type="button" disabled={busy} aria-label={`Remove ${f.name}`} onClick={() => setFiles((l) => l.filter((_, j) => j !== i))} className="rounded-full p-1 text-brown/60 hover:bg-gold/15 disabled:opacity-40"><X className="h-4 w-4" /></button>
                      </div>
                    ))}
                  </div>
                  <input ref={picker} data-testid="dance-file-input" type="file" multiple accept=".mp3,.m4a,.aac,.wav,.ogg,.mp4,.mov,.webm,audio/*,video/*" className="hidden" onChange={(e) => pick([...e.target.files])} />
                  {files.length < MAX_FILES && (
                    <button type="button" disabled={busy} onClick={() => picker.current?.click()} className="btn-outline mt-2 !px-4 !py-2 text-xs"><Plus className="h-4 w-4" /> Add audio / video</button>
                  )}
                </div>
                <label className="block">
                  <span className="text-xs font-medium uppercase tracking-wider text-brown/70">Anything else?</span>
                  <textarea className="input-royal mt-1.5 min-h-[72px]" placeholder="Duration, props, special requests…" maxLength={300} value={form.note} onChange={set("note")} />
                </label>
                {/* honeypot: hidden from people, bots fill it in */}
                <input tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" name="website" value={form.website} onChange={set("website")} />
                <div className="text-center">
                  <button data-testid="dance-submit-btn" type="submit" disabled={busy} className="btn-maroon disabled:opacity-60">
                    <Send className="h-4 w-4" /> {busy ? (progress || "Sending…") : "Request a slot"}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </Reveal>
      </div>
    </section>
  );
}
