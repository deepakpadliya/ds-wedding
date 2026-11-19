import { useEffect, useState } from "react";
import { toast } from "sonner";
import api, { getErrorMessage } from "@/lib/api";
import PlannerList from "./PlannerList";
import CustomChecklist from "./CustomChecklist";
import { LayoutDashboard, Users, BedDouble, Music2, ListChecks, ListPlus, CreditCard, PiggyBank, Wallet } from "lucide-react";
import { MEAL_SLOTS, SECTIONS, SECTION_GROUPS, rupee } from "./schema";

const ICONS = {
  overview: LayoutDashboard, guest: Users, attendee: BedDouble, performance: Music2, task: ListChecks, custom: ListPlus,
  vendor: Wallet, payment: CreditCard, fund: PiggyBank,
};

const WEDDING_DAY = new Date("2026-12-12T00:00:00");

function Stat({ label, value, sub, tone }) {
  return (
    <div className="card-royal p-5">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-brown/60">{label}</p>
      <p className={`mt-2 font-display text-2xl font-semibold ${tone === "bad" ? "text-red-700" : tone === "good" ? "text-green-700" : "text-maroon"}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-brown/60">{sub}</p>}
    </div>
  );
}

function Overview({ go, s }) {
  if (!s) return <p className="py-16 text-center italic text-brown/55">Loading…</p>;
  const { budget: b, guests: g, tasks: t, dance } = s;
  const gap = b.funds - b.vendorRemaining;
  const days = Math.ceil((WEDDING_DAY - new Date().setHours(0, 0, 0, 0)) / 86400000);
  const pct = t.total ? Math.round((t.done / t.total) * 100) : 0;
  return (
    <div data-testid="planner-overview" className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Days to the wedding" value={days > 0 ? days : days === 0 ? "Today 🎉" : "Done"} sub="12 Dec 2026" />
        <Stat label="Total agreed" value={rupee(b.agreed)} sub="with all vendors" />
        <Stat label="Paid to vendors" value={rupee(b.vendorPaid)} sub={`${b.agreed ? Math.round((b.vendorPaid / b.agreed) * 100) : 0}% of agreed`} />
        <Stat label="Still to pay" value={rupee(b.vendorRemaining)} />
        <Stat label="Funds available" value={rupee(b.funds)} />
        <Stat label={gap >= 0 ? "Cushion after vendors" : "Shortfall"} value={rupee(Math.abs(gap))} tone={gap >= 0 ? "good" : "bad"} sub="funds minus vendor balance" />
        <Stat label="Guests invited" value={g.invitees.toLocaleString("en-IN")} sub={`${g.households} families / entries`} />
        <Stat label="Rooms needed" value={g.rooms} sub={`${g.cardsPending} patrikas not written yet`} />
      </div>
      {dance?.pending > 0 && (
        <button onClick={() => go("performance")} className="card-royal w-full border-gold p-5 text-left transition-colors hover:border-maroon">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-brown/60">Dance requests</p>
          <p className="mt-2 font-display text-2xl font-semibold text-maroon">{dance.pending} waiting for approval</p>
          <p className="mt-1 text-xs text-brown/60">Guests who signed up from the website · {dance.total} in the line-up in total</p>
        </button>
      )}
      <div className="grid gap-4">
        <button onClick={() => go("task")} className="card-royal p-5 text-left transition-colors hover:border-gold">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-brown/60">Checklist progress</p>
          <p className="mt-2 font-display text-2xl font-semibold text-maroon">{t.done} of {t.total} done</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-gold/20"><div className="h-full rounded-full bg-maroon" style={{ width: `${pct}%` }} /></div>
        </button>
      </div>
      <p className="text-xs text-brown/55">Payments logged in the ledger (wedding only): {rupee(b.paymentsLogged)}. The vendor “Paid” column is entered on the Vendors tab.</p>
    </div>
  );
}

// Head-count per meal, totalled over everyone currently listed (respects search / filters).
function MealTotals({ shown }) {
  return (
    <div className="mt-5">
      <p className="text-[11px] font-medium uppercase tracking-wider text-brown/60">Meal head-count (guests listed below)</p>
      <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
        {MEAL_SLOTS.map(([k, label]) => (
          <div key={k} className="rounded-lg border border-gold/25 bg-white/60 px-3 py-2">
            <p className="text-[10px] leading-tight text-brown/60">{label}</p>
            <p className="font-display text-lg font-semibold text-maroon">{shown.reduce((a, r) => a + (r[k] || 0), 0)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Gift / room / arrival counts over the guests currently listed.
function AttendeeStats({ shown }) {
  const rooms = shown.filter((r) => r.roomNo);
  const stats = [
    ["Gifts given", `${shown.filter((r) => r.giftGiven).length} of ${shown.length}`],
    ["Gifts pending", shown.filter((r) => !r.giftGiven).length],
    ["Rooms allocated", rooms.length],
    ["Without a room", shown.length - rooms.length],
    ["Arrived", `${shown.filter((r) => r.arrived).length} of ${shown.length}`],
  ];
  return (
    <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
      {stats.map(([label, v]) => (
        <div key={label} className="rounded-lg border border-gold/25 bg-white/60 px-3 py-2">
          <p className="text-[10px] leading-tight text-brown/60">{label}</p>
          <p className="font-display text-lg font-semibold text-maroon">{v}</p>
        </div>
      ))}
    </div>
  );
}

export default function Planner() {
  const [section, setSection] = useState(() => {
    try { const s = localStorage.getItem("planner-section"); return SECTIONS.some((x) => x.id === s) ? s : "overview"; } catch { return "overview"; }
  });
  const [summary, setSummary] = useState(null);
  const go = (id) => {
    setSection(id);
    try { localStorage.setItem("planner-section", id); } catch { /* private mode */ }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  // Headline numbers: used by the Overview and for the badge on Dance. Refreshed whenever you move between sections.
  useEffect(() => {
    api.get("/v1/admin/planner/summary").then(({ data }) => setSummary(data)).catch((e) => section === "overview" && toast.error(getErrorMessage(e, "Could not load the overview")));
  }, [section]);
  const badge = (id) => (id === "performance" ? summary?.dance?.pending || 0 : 0);
  const current = SECTIONS.find((x) => x.id === section);

  return (
    <div data-testid="planner" className="lg:grid lg:grid-cols-[230px_minmax(0,1fr)] lg:items-start lg:gap-6">
      {/* Phones / tablets: one compact dropdown */}
      <div className="no-print mb-4 lg:hidden">
        <select data-testid="planner-section-select" aria-label="Planner section" className="input-royal font-medium" value={section} onChange={(e) => go(e.target.value)}>
          {SECTION_GROUPS.map((g) => (
            g.label
              ? <optgroup key={g.label} label={g.label}>{g.sections.map((x) => <option key={x.id} value={x.id}>{x.label}{badge(x.id) ? ` (${badge(x.id)} new)` : ""}</option>)}</optgroup>
              : g.sections.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)
          ))}
        </select>
      </div>

      {/* Desktop: vertical sidebar, grouped, stays in view while you scroll */}
      <nav className="no-print card-royal sticky top-4 hidden max-h-[calc(100vh-2rem)] overflow-y-auto p-3 lg:block" aria-label="Planner sections">
        {SECTION_GROUPS.map((g, gi) => (
          <div key={g.label || "top"} className={gi ? "mt-4" : ""}>
            {g.label && <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-brown/50">{g.label}</p>}
            <ul className="space-y-0.5">
              {g.sections.map((x) => {
                const Icon = ICONS[x.id];
                const active = section === x.id;
                return (
                  <li key={x.id}>
                    <button
                      data-testid={`planner-tab-${x.id}`} onClick={() => go(x.id)} aria-current={active ? "page" : undefined}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors ${active ? "bg-maroon text-ivory shadow" : "text-brown/80 hover:bg-gold/10"}`}
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${active ? "text-gold" : "text-gold-deep"}`} />
                      <span className="flex-1 truncate">{x.label}</span>
                      {badge(x.id) > 0 && <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${active ? "bg-ivory text-maroon" : "bg-maroon text-ivory"}`}>{badge(x.id)}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="min-w-0">
        <h2 className="sr-only">{current?.label}</h2>
        {section === "overview" ? <Overview go={go} s={summary} /> : section === "custom" ? <CustomChecklist /> : (
          <PlannerList key={section} kind={section}>
            {section === "guest" ? (ctx) => <MealTotals shown={ctx.shown} /> : section === "attendee" ? (ctx) => <AttendeeStats shown={ctx.shown} /> : undefined}
          </PlannerList>
        )}
      </div>
    </div>
  );
}
