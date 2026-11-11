import { useEffect, useState } from "react";
import { toast } from "sonner";
import api, { getErrorMessage } from "@/lib/api";
import { SETTING_DEFAULTS } from "@/hooks/useSettings";

function Toggle({ checked, onChange, disabled, testId }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      data-testid={testId}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors disabled:opacity-50 ${checked ? "border-maroon bg-maroon" : "border-gold/50 bg-gold/20"}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-ivory shadow transition-all ${checked ? "left-6" : "left-0.5"}`} />
    </button>
  );
}

export default function SiteSettings() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get("/v1/settings")
      .then(({ data }) => setSettings({ ...SETTING_DEFAULTS, ...data.settings }))
      .catch((e) => toast.error(getErrorMessage(e, "Could not load settings")));
  }, []);

  const update = async (patch) => {
    setSaving(true);
    try {
      const { data } = await api.put("/v1/admin/settings", patch);
      setSettings({ ...SETTING_DEFAULTS, ...data.settings });
      toast.success("Saved");
    } catch (e) {
      toast.error(getErrorMessage(e, "Could not save"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section data-testid="site-settings" className="card-royal mt-8 p-5 sm:p-6">
      <h3 className="font-display text-lg font-semibold text-maroon">Website Sections</h3>
      <p className="mt-1 text-sm text-brown/65">Choose what guests see on the website.</p>
      {!settings ? (
        <p className="py-6 text-center italic text-brown/55">Loading…</p>
      ) : (
        <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-gold/30 bg-gold/5 p-4">
          <div>
            <p className="font-medium text-brown">Our Story timeline</p>
            <p className="text-xs text-brown/60">
              The dated milestones (first meeting, first call, engagement…). Hidden by default — the couple cards and introduction always stay.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-brown/60">{settings.showTimeline ? "Shown" : "Hidden"}</span>
            <Toggle testId="toggle-timeline" checked={settings.showTimeline} disabled={saving} onChange={(v) => update({ showTimeline: v })} />
          </div>
        </div>
      )}
    </section>
  );
}
