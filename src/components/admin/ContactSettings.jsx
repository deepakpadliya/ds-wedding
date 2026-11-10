import { useEffect, useState } from "react";
import { Phone, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import api, { getErrorMessage } from "@/lib/api";

const SIDES = [
  { key: "groom", title: "Groom's side (Deepak)", sub: "Shown on the /groom page" },
  { key: "bride", title: "Bride's side (Shruti)", sub: "Shown on the /bride page" },
];
const BLANK = { name: "", number: "", label: "Wedding Enquiries & Assistance" };
const cap = "text-[11px] font-medium uppercase tracking-wider text-brown/60";

export default function ContactSettings() {
  const [data, setData] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get("/v1/admin/contacts")
      .then(({ data: d }) => setData({ bride: d.contacts.bride.map(fill), groom: d.contacts.groom.map(fill) }))
      .catch((e) => toast.error(getErrorMessage(e, "Could not load contacts")));
  }, []);

  const fill = (c) => ({ ...BLANK, ...c, name: c.name || "" });
  const edit = (side, i, k, v) => setData((d) => ({ ...d, [side]: d[side].map((c, j) => (j === i ? { ...c, [k]: v } : c)) }));
  const add = (side) => setData((d) => ({ ...d, [side]: [...d[side], { ...BLANK }] }));
  const remove = (side, i) => setData((d) => ({ ...d, [side]: d[side].filter((_, j) => j !== i) }));

  const save = async () => {
    setSaving(true);
    try {
      const { data: res } = await api.put("/v1/admin/contacts", data);
      setData({ bride: res.contacts.bride.map(fill), groom: res.contacts.groom.map(fill) });
      toast.success("Contacts saved");
    } catch (e) {
      toast.error(getErrorMessage(e, "Could not save contacts"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section data-testid="contact-settings" className="card-royal mt-8 p-5 sm:p-6">
      <h3 className="font-display text-lg font-semibold text-maroon">Contact Information</h3>
      <p className="mt-1 text-sm text-brown/65">
        Set who guests should call or WhatsApp for each side. The groom's page shows the groom's contacts and the bride's page shows the bride's. Use a 10-digit Indian number, or add a country code starting with +.
      </p>
      {!data ? (
        <p className="py-8 text-center italic text-brown/55">Loading contacts…</p>
      ) : (
        <>
          <div className="mt-5 grid gap-6 lg:grid-cols-2">
            {SIDES.map((s) => (
              <div key={s.key} data-testid={`contacts-${s.key}`} className="rounded-xl border border-gold/30 bg-gold/5 p-4">
                <p className="flex items-center gap-2 font-semibold text-maroon">
                  <Phone className="h-4 w-4 text-gold-deep" /> {s.title}
                </p>
                <p className="text-xs text-brown/55">{s.sub}</p>
                <div className="mt-4 space-y-4">
                  {data[s.key].map((c, i) => (
                    <div key={i} className="rounded-lg border border-gold/25 bg-ivory/70 p-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block">
                          <span className={cap}>Name (optional)</span>
                          <input className="input-royal mt-1 !py-2" value={c.name} onChange={(e) => edit(s.key, i, "name", e.target.value)} placeholder="e.g. Ajit Ji" />
                        </label>
                        <label className="block">
                          <span className={cap}>Mobile number</span>
                          <input data-testid={`contact-number-${s.key}-${i}`} className="input-royal mt-1 !py-2" inputMode="tel" value={c.number} onChange={(e) => edit(s.key, i, "number", e.target.value)} placeholder="9876543210" />
                        </label>
                        <label className="block sm:col-span-2">
                          <span className={cap}>Label</span>
                          <input className="input-royal mt-1 !py-2" value={c.label} onChange={(e) => edit(s.key, i, "label", e.target.value)} />
                        </label>
                      </div>
                      {data[s.key].length > 1 && (
                        <button onClick={() => remove(s.key, i)} className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-red-500 hover:underline">
                          <Trash2 className="h-3.5 w-3.5" /> Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {data[s.key].length < 6 && (
                  <button onClick={() => add(s.key)} className="btn-outline mt-4 !px-4 !py-2 text-xs">
                    <Plus className="h-4 w-4" /> Add contact
                  </button>
                )}
              </div>
            ))}
          </div>
          <button data-testid="contacts-save-btn" onClick={save} disabled={saving} className="btn-maroon mt-6 disabled:opacity-60">
            {saving ? "Saving…" : "Save Contacts"}
          </button>
        </>
      )}
    </section>
  );
}
