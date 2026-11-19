import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Check, Columns3, Download, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import api, { getErrorMessage } from "@/lib/api";
import SidePanel from "../SidePanel";

const BASE = "/v1/admin/planner";
const TYPES = [["text", "Text"], ["number", "Number"], ["date", "Date"], ["checkbox", "Checkbox"], ["select", "Dropdown"]];
const labelCls = "text-xs font-medium uppercase tracking-wider text-brown/70";
const TEMPLATES = [
  { title: "Return gifts", name: "Return gifts", columns: [["Name", "text"], ["Delivered", "checkbox"]] },
  { title: "Room allocation", name: "Room allocation", columns: [["Guest", "text"], ["Room no.", "text"], ["Checked in", "checkbox"]] },
];
const toDraft = (c) => ({ ...c, optionsText: (c.options || []).join(", ") });

// Name the checklist and define its columns (the only things a row holds).
function ListPanel({ list, onSave, onDelete, onClose, saving }) {
  const [name, setName] = useState(list?.name || "");
  const [cols, setCols] = useState((list?.columns || []).map(toDraft));
  const dirty = name !== (list?.name || "") || JSON.stringify(cols) !== JSON.stringify((list?.columns || []).map(toDraft));
  const patch = (i, p) => setCols((l) => l.map((c, j) => (j === i ? { ...c, ...p } : c)));
  const move = (i, d) => setCols((l) => { const n = [...l], j = i + d; if (j < 0 || j >= n.length) return l; [n[i], n[j]] = [n[j], n[i]]; return n; });
  const invalid = !name.trim() || cols.some((c) => !c.label.trim() || (c.type === "select" && !c.optionsText.split(",").some((o) => o.trim())));
  const submit = () => {
    if (invalid || saving) return;
    onSave(name.trim(), cols.map(({ optionsText, ...c }) => ({
      ...c, label: c.label.trim(),
      ...(c.type === "select" ? { options: optionsText.split(",").map((o) => o.trim()).filter(Boolean) } : { options: undefined }),
    })));
  };
  return (
    <SidePanel
      testId="checklist-columns-panel" title={list ? "Checklist settings" : "New checklist"} subtitle={list ? list.name : "Name it, then add the columns you need"}
      dirty={dirty} onClose={onClose} onSubmit={submit} canSubmit={!invalid && !saving}
      footer={<>
        <button onClick={onClose} className="btn-outline flex-1">Cancel</button>
        <button data-testid="checklist-columns-save" disabled={invalid || saving} onClick={submit} className="btn-maroon flex-[2] disabled:opacity-60">{saving ? "Saving…" : list ? "Save changes" : "Create checklist"}</button>
      </>}
    >
      {!list && (
        <div className="mb-5">
          <span className={labelCls}>Quick start (optional)</span>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {TEMPLATES.map((t) => (
              <button key={t.title} type="button" data-testid={`checklist-template-${t.title.split(" ")[0].toLowerCase()}`} className="chip"
                onClick={() => { setName(t.name); setCols(t.columns.map(([label, type]) => ({ label, type, optionsText: "" }))); }}>{t.title}</button>
            ))}
          </div>
        </div>
      )}
      <label className="block">
        <span className={labelCls}>Checklist name *</span>
        <input data-testid="checklist-name-input" className="input-royal mt-1.5" value={name} maxLength={80} autoFocus={!list} placeholder="e.g. Return gifts" onChange={(e) => setName(e.target.value)} />
      </label>
      <p className="mt-5 text-sm text-brown/65">Each column is an input on every row: a text box, number, date, checkbox or dropdown. For example, <b>Name</b> (text) and <b>Delivered</b> (checkbox).</p>
      <div className="mt-4 space-y-3">
        {cols.length === 0 && <p className="rounded-xl border border-dashed border-gold/40 py-8 text-center text-sm italic text-brown/55">No columns yet — add your first one below.</p>}
        {cols.map((c, i) => (
          <div key={c.id || i} className="rounded-xl border border-gold/30 bg-white/70 p-3">
            <div className="flex items-end gap-2">
              <label className="min-w-0 flex-1">
                <span className={labelCls}>Column name</span>
                <input className="input-royal mt-1" value={c.label} placeholder="e.g. Name, Delivered, Room no." onChange={(e) => patch(i, { label: e.target.value })} maxLength={60} autoFocus={!c.id && i === cols.length - 1 && !!name} />
              </label>
              <label>
                <span className={labelCls}>Type</span>
                <select className="input-royal mt-1" value={c.type} onChange={(e) => patch(i, { type: e.target.value })}>
                  {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </label>
            </div>
            {c.type === "select" && (
              <label className="mt-2 block">
                <span className={labelCls}>Options (comma separated)</span>
                <input className="input-royal mt-1" value={c.optionsText} placeholder="e.g. Pending, Done, Not needed" onChange={(e) => patch(i, { optionsText: e.target.value })} />
              </label>
            )}
            <div className="mt-2 flex justify-end gap-1">
              <button type="button" aria-label="Move column up" disabled={i === 0} onClick={() => move(i, -1)} className="rounded-full p-1.5 text-brown/70 hover:bg-gold/15 disabled:opacity-25"><ArrowUp className="h-4 w-4" /></button>
              <button type="button" aria-label="Move column down" disabled={i === cols.length - 1} onClick={() => move(i, 1)} className="rounded-full p-1.5 text-brown/70 hover:bg-gold/15 disabled:opacity-25"><ArrowDown className="h-4 w-4" /></button>
              <button type="button" aria-label={`Delete column ${c.label}`} onClick={() => setCols((l) => l.filter((_, j) => j !== i))} className="rounded-full p-1.5 text-red-500/80 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>
      <button type="button" data-testid="checklist-add-column" onClick={() => setCols((l) => [...l, { label: "", type: l.length ? "text" : "text", optionsText: "" }])} className="btn-outline mt-4 !px-4 !py-2 text-xs"><Plus className="h-4 w-4" /> Add column</button>
      {list && (
        <div className="mt-8 border-t border-gold/25 pt-5">
          <button type="button" data-testid="checklist-delete" onClick={onDelete} className="flex items-center gap-2 text-sm text-red-600 hover:underline"><Trash2 className="h-4 w-4" /> Delete this checklist and all its rows</button>
        </div>
      )}
    </SidePanel>
  );
}

// One answer. Text / number / date save when you leave the box; checkbox and dropdown save at once.
function Answer({ col, value, onChange }) {
  if (col.type === "checkbox")
    return (
      <button type="button" aria-label={col.label} aria-pressed={!!value} onClick={() => onChange(!value)}
        className={`flex h-7 w-7 items-center justify-center rounded-md border transition-colors ${value ? "border-maroon bg-maroon text-ivory" : "border-gold/50 bg-white/70 text-transparent hover:border-gold"}`}>
        <Check className="h-4 w-4" />
      </button>
    );
  if (col.type === "select")
    return (
      <select aria-label={col.label} className="input-royal !w-auto !py-1.5 !text-xs" value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
        <option value="">—</option>
        {col.options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  const type = col.type === "number" ? "number" : col.type === "date" ? "date" : "text";
  return (
    <input
      key={String(value ?? "")} aria-label={col.label} type={type} inputMode={type === "number" ? "decimal" : undefined}
      defaultValue={value ?? ""} className="input-royal !py-1.5 !text-xs" style={{ minWidth: type === "date" ? 130 : type === "number" ? 90 : 160 }}
      onBlur={(e) => { if (e.target.value !== String(value ?? "")) onChange(e.target.value); }}
      onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }}
    />
  );
}

export default function CustomChecklist() {
  const [lists, setLists] = useState(null);
  const [activeId, setActiveId] = useState(() => { try { return localStorage.getItem("checklist-active"); } catch { return null; } });
  const [rows, setRows] = useState(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all"); // all | pending | done
  const [bulk, setBulk] = useState(null); // null (closed) | pasted text
  const [title, setTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [panel, setPanel] = useState(null); // null | "new" | "edit"
  const [saving, setSaving] = useState(false);

  const active = lists?.find((l) => l.id === activeId) || lists?.[0] || null;
  const cols = active?.columns || [];
  const listId = active?.id;
  const textCol = cols.find((c) => c.type === "text"); // quick-add and pasted names go here
  const tickCol = cols.find((c) => c.type === "checkbox"); // drives the progress bar and the Pending / done filter

  useEffect(() => {
    api.get(`${BASE}/custom-lists`).then(({ data }) => setLists(data.lists)).catch((e) => { toast.error(getErrorMessage(e, "Could not load the checklists")); setLists([]); });
  }, []);
  useEffect(() => {
    if (!listId) { setRows(lists ? [] : null); return; }
    let live = true;
    setRows(null); setQuery(""); setStatus("all"); setBulk(null);
    api.get(`${BASE}/custom`, { params: { listId } })
      .then(({ data }) => live && setRows(data.items))
      .catch((e) => { toast.error(getErrorMessage(e, "Could not load the checklist")); live && setRows([]); });
    return () => { live = false; };
  }, [listId]); // eslint-disable-line react-hooks/exhaustive-deps
  const choose = (id) => { setActiveId(id); try { localStorage.setItem("checklist-active", id); } catch { /* private mode */ } };

  const isDone = (r) => !!(tickCol && r.values?.[tickCol.id]);
  const done = (rows || []).filter(isDone).length;
  const filtering = !!query.trim() || status !== "all";
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (rows || []).filter((r) => {
      if (status === "done" && !isDone(r)) return false;
      if (status === "pending" && isDone(r)) return false;
      return !q || Object.values(r.values || {}).some((v) => String(v ?? "").toLowerCase().includes(q));
    });
  }, [rows, query, status, tickCol]); // eslint-disable-line react-hooks/exhaustive-deps

  const setAnswer = async (row, col, v) => {
    const values = { ...(row.values || {}) };
    if (v === "" || v === null || v === false) delete values[col.id]; else values[col.id] = v;
    const before = rows;
    setRows((l) => l.map((r) => (r.id === row.id ? { ...r, values } : r)));
    try { await api.patch(`${BASE}/custom/${row.id}`, { values }); }
    catch (e) { setRows(before); toast.error(getErrorMessage(e, "Could not save")); }
  };

  const add = async (e) => {
    e.preventDefault();
    if (adding || (textCol && !title.trim())) return;
    setAdding(true);
    try {
      const { data } = await api.post(`${BASE}/custom`, { listId, values: textCol ? { [textCol.id]: title } : {} });
      setRows((l) => [...l, data]); setTitle("");
    } catch (err) { toast.error(getErrorMessage(err, "Could not add")); }
    finally { setAdding(false); }
  };
  const addMany = async () => {
    const texts = bulk.split("\n").map((t) => t.trim()).filter(Boolean);
    if (!texts.length || adding) return;
    setAdding(true);
    try {
      const { data } = await api.post(`${BASE}/custom/bulk`, { listId, columnId: textCol.id, texts });
      setRows((l) => [...l, ...data.items]); setBulk(null); toast.success(`${data.items.length} added`);
    } catch (err) { toast.error(getErrorMessage(err, "Could not add the list")); }
    finally { setAdding(false); }
  };
  const remove = async (row) => {
    if (!window.confirm("Delete this row?")) return;
    try { await api.delete(`${BASE}/custom/${row.id}`); setRows((l) => l.filter((r) => r.id !== row.id)); }
    catch (e) { toast.error(getErrorMessage(e, "Could not delete")); }
  };
  const move = async (row, d) => {
    const from = rows.findIndex((r) => r.id === row.id), to = from + d;
    if (to < 0 || to >= rows.length) return;
    const before = rows, next = [...rows];
    [next[from], next[to]] = [next[to], next[from]];
    setRows(next);
    try { await api.post(`${BASE}/custom/reorder`, { ids: next.map((r) => r.id) }); }
    catch (e) { setRows(before); toast.error(getErrorMessage(e, "Could not change the order")); }
  };
  const saveList = async (name, columns) => {
    setSaving(true);
    try {
      if (panel === "new") {
        const { data } = await api.post(`${BASE}/custom-lists`, { name, columns });
        setLists(data.lists); choose(data.id); toast.success("Checklist created");
      } else {
        const { data } = await api.patch(`${BASE}/custom-lists/${active.id}`, { name, columns });
        setLists(data.lists); toast.success("Saved");
      }
      setPanel(null);
    } catch (e) { toast.error(getErrorMessage(e, "Could not save the checklist")); }
    finally { setSaving(false); }
  };
  const deleteList = async () => {
    if (!window.confirm(`Delete the checklist "${active.name}" and all ${rows?.length || 0} of its rows? This cannot be undone.`)) return;
    try { const { data } = await api.delete(`${BASE}/custom-lists/${active.id}`); setLists(data.lists); setPanel(null); toast.success("Checklist deleted"); }
    catch (e) { toast.error(getErrorMessage(e, "Could not delete the checklist")); }
  };

  return (
    <section data-testid="planner-custom" className="card-royal p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold text-maroon">Custom checklists</h3>
          <p className="mt-1 max-w-xl text-sm text-brown/65">Make as many checklists as you like, each with columns you choose — text, numbers, dates, checkboxes or dropdowns.</p>
        </div>
        {active && (
          <div className="flex gap-2">
            <a href={`/api${BASE}/custom/export?listId=${encodeURIComponent(active.id)}`} className="btn-outline !px-4 !py-2 text-xs"><Download className="h-4 w-4" /> CSV</a>
            <button data-testid="checklist-manage-columns" onClick={() => setPanel("edit")} className="btn-maroon !px-4 !py-2 text-xs"><Columns3 className="h-4 w-4" /> Columns · {cols.length}</button>
          </div>
        )}
      </div>

      {lists && (
        <div role="tablist" aria-label="Checklists" className="mt-5 flex flex-wrap gap-2">
          {lists.map((l) => (
            <button key={l.id} role="tab" aria-selected={l.id === active?.id} data-testid={`checklist-tab-${l.id}`} onClick={() => choose(l.id)} className={`chip ${l.id === active?.id ? "chip-active" : ""}`}>{l.name}</button>
          ))}
          <button data-testid="checklist-new" onClick={() => setPanel("new")} className="chip border-dashed"><Plus className="mr-1 inline h-3.5 w-3.5" />New checklist</button>
        </div>
      )}

      {lists && !active && (
        <div className="mt-8 rounded-xl border border-dashed border-gold/40 py-12 text-center">
          <p className="font-lora italic text-brown/65">You don't have any checklists yet.</p>
          <button onClick={() => setPanel("new")} className="btn-maroon mt-4 !px-5 !py-2 text-xs"><Plus className="h-4 w-4" /> Create your first checklist</button>
        </div>
      )}

      {active && (
        <>
          {cols.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-gold/40 py-10 text-center">
              <p className="font-lora italic text-brown/65">This checklist has no columns yet.</p>
              <button onClick={() => setPanel("edit")} className="btn-maroon mt-4 !px-5 !py-2 text-xs"><Plus className="h-4 w-4" /> Add columns</button>
            </div>
          ) : (
            <>
              {tickCol && rows && (
                <div className="mt-5 rounded-xl border border-gold/30 bg-gold/5 px-4 py-2.5">
                  <p className="text-[11px] uppercase tracking-wider text-brown/60">{tickCol.label} · {done} of {rows.length}</p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-gold/20"><div className="h-full rounded-full bg-maroon transition-all" style={{ width: `${rows.length ? (done / rows.length) * 100 : 0}%` }} /></div>
                </div>
              )}

              <form onSubmit={add} className="mt-5 flex gap-2">
                {textCol && <input data-testid="checklist-new-title" className="input-royal" placeholder={`Add ${textCol.label.toLowerCase()} and press Enter…`} value={title} maxLength={500} onChange={(e) => setTitle(e.target.value)} />}
                <button type="submit" disabled={adding || (textCol && !title.trim())} className="btn-maroon !px-5 !py-2 text-xs disabled:opacity-60"><Plus className="h-4 w-4" /> {textCol ? "Add" : "Add row"}</button>
              </form>
              {textCol && (bulk === null ? (
                <button type="button" data-testid="checklist-bulk-open" onClick={() => setBulk("")} className="mt-2 text-xs text-maroon underline">Add many at once (paste a list)</button>
              ) : (
                <div className="mt-3 rounded-xl border border-gold/30 bg-gold/5 p-3">
                  <textarea data-testid="checklist-bulk-text" autoFocus className="input-royal min-h-[110px]" placeholder={`Paste ${textCol.label.toLowerCase()}s here — one per line`} value={bulk} onChange={(e) => setBulk(e.target.value)} />
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-xs text-brown/60">{bulk.split("\n").filter((l) => l.trim()).length} to add</span>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setBulk(null)} className="btn-outline !px-4 !py-1.5 text-xs">Cancel</button>
                      <button type="button" data-testid="checklist-bulk-add" disabled={adding || !bulk.trim()} onClick={addMany} className="btn-maroon !px-4 !py-1.5 text-xs disabled:opacity-60">{adding ? "Adding…" : "Add all"}</button>
                    </div>
                  </div>
                </div>
              ))}

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <div className="relative min-w-[200px] flex-1">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brown/40" />
                  <input className="input-royal !pl-10" placeholder="Search…" value={query} onChange={(e) => setQuery(e.target.value)} />
                </div>
                {tickCol && (
                  <div className="flex gap-2" role="group" aria-label="Filter">
                    {[["all", "All", rows?.length || 0], ["pending", "Pending", (rows?.length || 0) - done], ["done", tickCol.label, done]].map(([v, l, n]) => (
                      <button key={v} type="button" data-testid={`checklist-filter-${v}`} aria-pressed={status === v} onClick={() => setStatus(v)} className={`chip ${status === v ? "chip-active" : ""}`}>{l} · {n}</button>
                    ))}
                  </div>
                )}
              </div>
              {filtering && <p className="mt-2 text-xs italic text-brown/60">Clear the search and filter to change the order.</p>}

              <div className="mt-4 overflow-x-auto rounded-xl border border-gold/20">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gold/10 text-[11px] uppercase tracking-wider text-brown/70">
                    <tr>
                      <th className="w-20 px-3 py-2.5 font-medium">Order</th>
                      {cols.map((c) => <th key={c.id} className="px-3 py-2.5 font-medium">{c.label}</th>)}
                      <th className="w-12 px-3 py-2.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {rows === null && <tr><td colSpan={cols.length + 2} className="py-10 text-center italic text-brown/55">Loading…</td></tr>}
                    {rows !== null && shown.length === 0 && <tr><td colSpan={cols.length + 2} className="py-10 text-center italic text-brown/55">{rows.length ? "Nothing matches." : "No rows yet — add your first one above."}</td></tr>}
                    {shown.map((r) => {
                      const idx = rows.findIndex((x) => x.id === r.id);
                      return (
                        <tr key={r.id} className={`border-t border-gold/15 align-middle hover:bg-gold/5 ${isDone(r) ? "bg-green-50/40" : ""}`}>
                          <td className="whitespace-nowrap px-3 py-2">
                            <span className="mr-1 inline-block w-5 text-center font-display font-semibold text-maroon">{idx + 1}</span>
                            <button aria-label="Move up" disabled={filtering || idx === 0} onClick={() => move(r, -1)} className="rounded-full p-1 hover:bg-gold/15 disabled:opacity-25"><ArrowUp className="h-3.5 w-3.5" /></button>
                            <button aria-label="Move down" disabled={filtering || idx === rows.length - 1} onClick={() => move(r, 1)} className="rounded-full p-1 hover:bg-gold/15 disabled:opacity-25"><ArrowDown className="h-3.5 w-3.5" /></button>
                          </td>
                          {cols.map((c) => <td key={c.id} className="px-3 py-2"><Answer col={c} value={r.values?.[c.id]} onChange={(v) => setAnswer(r, c, v)} /></td>)}
                          <td className="px-3 py-2 text-right"><button aria-label="Delete row" onClick={() => remove(r)} className="rounded-full p-1.5 text-red-500/80 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      {panel && <ListPanel key={panel === "new" ? "new" : active.id} list={panel === "new" ? null : active} saving={saving} onSave={saveList} onDelete={deleteList} onClose={() => setPanel(null)} />}
    </section>
  );
}
