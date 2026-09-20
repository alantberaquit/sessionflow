import { CalendarPlus, ChevronRight, Clock3, Edit3, Layers3, LoaderCircle, Plus, Save, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import useAuth from "../hooks/useAuth.js";

const API_URL = import.meta.env.VITE_API_URL;
const inputClass = "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100";
const labelClass = "text-sm font-semibold text-slate-700";
const emptyEvent = {
  title: "", slug: "", summary: "", description: "", startDate: "", endDate: "",
  venue: { name: "", address: "", city: "", country: "Philippines" },
  registrationPeriod: { opensAt: "", closesAt: "" },
  registrationFee: { amountInCentavos: 0, currency: "PHP" }, capacity: 100,
  status: "draft", isPublished: false,
};
const emptyPlenary = { title: "", description: "", startsAt: "", endsAt: "", room: "", speakersText: "", displayOrder: 1, isRequired: true, status: "scheduled" };
const emptyBlock = { title: "", description: "", startsAt: "", endsAt: "", displayOrder: 1, minimumSelections: 1, maximumSelections: 1, status: "selection-open" };
const emptyBreakout = { title: "", description: "", room: "", speakersText: "", capacity: 30, displayOrder: 1, status: "available" };

const localDate = (value) => value ? new Date(value).toISOString().slice(0, 16) : "";
const speakersText = (speakers = []) => speakers.map((s) => [s.name, s.jobTitle, s.organization].join(" | ")).join("\n");
const parseSpeakers = (value) => value.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => {
  const [name, jobTitle = "", organization = ""] = line.split("|").map((part) => part.trim());
  return { name, jobTitle, organization };
});
const displayDate = (value) => new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));

function Field({ label, children }) { return <label className={labelClass}>{label}{children}</label>; }

const AdminEventsPage = () => {
  const { token, endSession } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [detail, setDetail] = useState(null);
  const [editor, setEditor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const request = useCallback(async (path, options = {}) => {
    const response = await fetch(`${API_URL}/api/admin${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...options.headers },
    });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401 || response.status === 403) {
      endSession(); navigate("/login", { replace: true, state: { from: "/admin/events" } });
      throw new Error("Your administrator session expired.");
    }
    if (!response.ok) throw new Error(data.message || Object.values(data.errors || {})[0] || "Request failed.");
    return data;
  }, [endSession, navigate, token]);

  const loadEvents = useCallback(async () => {
    setIsLoading(true); setError("");
    try {
      const data = await request("/events");
      setEvents(data.events);
      setSelectedId((current) => current || data.events[0]?._id || "");
    } catch (err) { setError(err.message); }
    finally { setIsLoading(false); }
  }, [request]);

  const loadDetail = useCallback(async (id) => {
    if (!id) { setDetail(null); return; }
    try { setDetail(await request(`/events/${id}`)); }
    catch (err) { setError(err.message); }
  }, [request]);

  useEffect(() => {
    const timeoutId = window.setTimeout(loadEvents, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadEvents]);
  useEffect(() => {
    const timeoutId = window.setTimeout(() => loadDetail(selectedId), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadDetail, selectedId]);

  const blocks = useMemo(() => (detail?.breakoutBlocks || []).map((block) => ({
    ...block, sessions: (detail?.breakoutSessions || []).filter((session) => String(session.breakoutBlock) === String(block._id)),
  })), [detail]);

  const openEvent = (event = null) => setEditor({ type: "event", id: event?._id, values: event ? {
    ...event, startDate: localDate(event.startDate), endDate: localDate(event.endDate),
    registrationPeriod: { opensAt: localDate(event.registrationPeriod?.opensAt), closesAt: localDate(event.registrationPeriod?.closesAt) },
  } : structuredClone(emptyEvent) });
  const openPlenary = (session = null) => setEditor({ type: "plenary", id: session?._id, values: session ? { ...session, startsAt: localDate(session.startsAt), endsAt: localDate(session.endsAt), speakersText: speakersText(session.speakers) } : { ...emptyPlenary, displayOrder: (detail?.plenarySessions?.length || 0) + 1 } });
  const openBlock = (block = null) => setEditor({ type: "block", id: block?._id, values: block ? { ...block, startsAt: localDate(block.startsAt), endsAt: localDate(block.endsAt) } : { ...emptyBlock, displayOrder: blocks.length + 1 } });
  const openBreakout = (blockId, session = null) => setEditor({ type: "breakout", blockId, id: session?._id, values: session ? { ...session, speakersText: speakersText(session.speakers) } : { ...emptyBreakout, displayOrder: (blocks.find((b) => b._id === blockId)?.sessions.length || 0) + 1 } });

  const updateValue = (key, value, group) => setEditor((current) => ({ ...current, values: group ? { ...current.values, [group]: { ...current.values[group], [key]: value } } : { ...current.values, [key]: value } }));

  const saveEditor = async (event) => {
    event.preventDefault(); setIsSaving(true); setError(""); setMessage("");
    try {
      const { type, id, blockId, values } = editor;
      let path; let method = id ? "PUT" : "POST"; let body = { ...values };
      if (type === "event") path = id ? `/events/${id}` : "/events";
      if (type === "plenary") { path = id ? `/events/${selectedId}/plenary-sessions/${id}` : `/events/${selectedId}/plenary-sessions`; body.speakers = parseSpeakers(values.speakersText); }
      if (type === "block") path = id ? `/events/${selectedId}/breakout-blocks/${id}` : `/events/${selectedId}/breakout-blocks`;
      if (type === "breakout") { path = id ? `/events/${selectedId}/breakout-blocks/${blockId}/sessions/${id}` : `/events/${selectedId}/breakout-blocks/${blockId}/sessions`; body.speakers = parseSpeakers(values.speakersText); }
      const data = await request(path, { method, body: JSON.stringify(body) });
      setMessage(data.message); setEditor(null);
      await loadEvents();
      const nextId = type === "event" && !id ? data.event._id : selectedId;
      setSelectedId(nextId); await loadDetail(nextId);
    } catch (err) { setError(err.message); }
    finally { setIsSaving(false); }
  };

  const remove = async (kind, id, blockId) => {
    if (!window.confirm("Delete this item? This cannot be undone.")) return;
    const path = kind === "plenary" ? `/events/${selectedId}/plenary-sessions/${id}` : kind === "block" ? `/events/${selectedId}/breakout-blocks/${id}` : `/events/${selectedId}/breakout-blocks/${blockId}/sessions/${id}`;
    try { const data = await request(path, { method: "DELETE" }); setMessage(data.message); await loadDetail(selectedId); }
    catch (err) { setError(err.message); }
  };

  return <div className="px-5 py-8 sm:px-8 lg:px-10">
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm font-bold uppercase tracking-[.18em] text-violet-600">Program management</p><h1 className="mt-2 text-3xl font-black text-slate-950">Events and sessions</h1><p className="mt-2 max-w-2xl text-slate-600">Build the event schedule, speakers, rooms, capacity, and participant choices from one workspace.</p></div>
        <button onClick={() => openEvent()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 font-bold text-white hover:bg-violet-700"><CalendarPlus className="h-5 w-5"/>New event</button>
      </div>
      {(message || error) && <div className={`mt-6 rounded-xl border px-4 py-3 text-sm font-semibold ${error ? "border-red-200 bg-red-50 text-red-700" : "border-violet-200 bg-violet-50 text-violet-800"}`}>{error || message}</div>}
      <div className="mt-8 grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <p className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-500">Your events</p>
          {isLoading ? <LoaderCircle className="mx-auto my-8 h-6 w-6 animate-spin text-violet-600"/> : events.map((event) => <button key={event._id} onClick={() => setSelectedId(event._id)} className={`mb-1 flex w-full items-center justify-between rounded-xl p-3 text-left ${selectedId === event._id ? "bg-violet-600 text-white" : "hover:bg-slate-50"}`}><span><span className="block text-sm font-bold">{event.title}</span><span className={`mt-1 block text-xs ${selectedId === event._id ? "text-violet-100" : "text-slate-500"}`}>{event.status.replaceAll("-", " ")}</span></span><ChevronRight className="h-4 w-4"/></button>)}
        </aside>
        {!detail ? <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">Create or select an event to manage its program.</section> : <section className="space-y-6">
          <div className="rounded-2xl bg-gradient-to-br from-violet-700 to-indigo-800 p-6 text-white shadow-lg"><div className="flex flex-col gap-4 sm:flex-row sm:justify-between"><div><span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase">{detail.event.status.replaceAll("-", " ")}</span><h2 className="mt-4 text-2xl font-black">{detail.event.title}</h2><p className="mt-2 text-sm text-violet-100">{displayDate(detail.event.startDate)} · {detail.event.venue?.name}</p></div><button onClick={() => openEvent(detail.event)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-4 font-bold text-violet-700"><Edit3 className="h-4 w-4"/>Edit event</button></div></div>
          <ContentSection icon={Clock3} title="Plenary sessions" subtitle="Shared sessions included in the core event program." action="Add plenary" onAction={() => openPlenary()}>
            {(detail.plenarySessions || []).map((session) => <SessionCard key={session._id} session={session} onEdit={() => openPlenary(session)} onDelete={() => remove("plenary", session._id)}/>) }
            {!detail.plenarySessions?.length && <Empty text="No plenary sessions yet."/>}
          </ContentSection>
          <ContentSection icon={Layers3} title="Breakout program" subtitle="Time blocks contain the selectable parallel sessions." action="Add block" onAction={() => openBlock()}>
            {blocks.map((block) => <div key={block._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-black text-slate-950">{block.title}</h3><p className="mt-1 text-sm text-slate-500">{displayDate(block.startsAt)} · Choose {block.minimumSelections}–{block.maximumSelections}</p></div><div className="flex gap-2"><SmallButton onClick={() => openBreakout(block._id)}><Plus className="h-4 w-4"/>Session</SmallButton><SmallButton onClick={() => openBlock(block)}><Edit3 className="h-4 w-4"/></SmallButton><SmallButton danger onClick={() => remove("block", block._id)}><Trash2 className="h-4 w-4"/></SmallButton></div></div><div className="mt-4 grid gap-3 md:grid-cols-2">{block.sessions.map((session) => <SessionCard key={session._id} session={session} compact onEdit={() => openBreakout(block._id, session)} onDelete={() => remove("breakout", session._id, block._id)}/>) }{!block.sessions.length && <Empty text="No selectable sessions in this block."/>}</div></div>)}
            {!blocks.length && <Empty text="No breakout blocks yet."/>}
          </ContentSection>
        </section>}
      </div>
    </div>
    {editor && <Editor editor={editor} updateValue={updateValue} onClose={() => setEditor(null)} onSave={saveEditor} isSaving={isSaving}/>} 
  </div>;
};

function ContentSection({ icon: Icon, title, subtitle, action, onAction, children }) { return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-violet-100 text-violet-700"><Icon className="h-5 w-5"/></span><div><h2 className="font-black text-slate-950">{title}</h2><p className="text-sm text-slate-500">{subtitle}</p></div></div><button onClick={onAction} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-violet-200 px-4 text-sm font-bold text-violet-700 hover:bg-violet-50"><Plus className="h-4 w-4"/>{action}</button></div><div className="mt-5 space-y-3">{children}</div></div> }
function SessionCard({ session, onEdit, onDelete, compact }) { return <article className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex justify-between gap-3"><div><span className="text-xs font-bold uppercase tracking-wide text-violet-600">{session.status.replaceAll("-", " ")}</span><h3 className="mt-1 font-bold text-slate-950">{session.title}</h3>{session.startsAt && <p className="mt-1 text-xs text-slate-500">{displayDate(session.startsAt)}</p>}<p className="mt-2 text-sm text-slate-600">{session.room}{session.capacity ? ` · ${session.capacity} seats` : ""}</p>{!compact && <p className="mt-2 line-clamp-2 text-sm text-slate-500">{session.description}</p>}</div><div className="flex shrink-0 gap-1"><SmallButton onClick={onEdit}><Edit3 className="h-4 w-4"/></SmallButton><SmallButton danger onClick={onDelete}><Trash2 className="h-4 w-4"/></SmallButton></div></div></article> }
function SmallButton({ children, onClick, danger }) { return <button type="button" onClick={onClick} className={`inline-flex h-9 items-center justify-center gap-1 rounded-lg border px-2.5 text-xs font-bold ${danger ? "border-red-200 text-red-600 hover:bg-red-50" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{children}</button> }
function Empty({ text }) { return <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">{text}</div> }

function Editor({ editor, updateValue, onClose, onSave, isSaving }) {
  const v = editor.values; const isEvent = editor.type === "event"; const isBlock = editor.type === "block"; const hasSchedule = editor.type === "plenary" || isBlock;
  return <div className="fixed inset-0 z-[70] overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm"><form onSubmit={onSave} className="mx-auto my-4 max-w-3xl rounded-3xl bg-white shadow-2xl"><div className="sticky top-0 z-10 flex items-center justify-between rounded-t-3xl border-b border-slate-200 bg-white px-6 py-5"><div><p className="text-xs font-bold uppercase tracking-wider text-violet-600">{editor.id ? "Edit" : "Add"}</p><h2 className="text-xl font-black capitalize text-slate-950">{editor.type === "block" ? "breakout block" : `${editor.type} ${editor.type === "event" ? "" : "session"}`}</h2></div><button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl hover:bg-slate-100"><X className="h-5 w-5"/></button></div><div className="grid gap-5 p-6 sm:grid-cols-2">
    <Field label="Title"><input required className={inputClass} value={v.title} onChange={(e) => updateValue("title", e.target.value)}/></Field>
    {isEvent && <Field label="URL slug"><input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" className={inputClass} value={v.slug} onChange={(e) => updateValue("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}/></Field>}
    <label className={`${labelClass} sm:col-span-2`}>{isEvent ? "Summary" : "Description"}<textarea required rows="3" className={inputClass} value={isEvent ? v.summary : v.description} onChange={(e) => updateValue(isEvent ? "summary" : "description", e.target.value)}/></label>
    {isEvent && <label className={`${labelClass} sm:col-span-2`}>Full description<textarea required rows="5" className={inputClass} value={v.description} onChange={(e) => updateValue("description", e.target.value)}/></label>}
    {(isEvent || hasSchedule) && <><Field label={isEvent ? "Event starts" : "Starts"}><input required type="datetime-local" className={inputClass} value={isEvent ? v.startDate : v.startsAt} onChange={(e) => updateValue(isEvent ? "startDate" : "startsAt", e.target.value)}/></Field><Field label={isEvent ? "Event ends" : "Ends"}><input required type="datetime-local" className={inputClass} value={isEvent ? v.endDate : v.endsAt} onChange={(e) => updateValue(isEvent ? "endDate" : "endsAt", e.target.value)}/></Field></>}
    {isEvent && <><Field label="Registration opens"><input required type="datetime-local" className={inputClass} value={v.registrationPeriod.opensAt} onChange={(e) => updateValue("opensAt", e.target.value, "registrationPeriod")}/></Field><Field label="Registration closes"><input required type="datetime-local" className={inputClass} value={v.registrationPeriod.closesAt} onChange={(e) => updateValue("closesAt", e.target.value, "registrationPeriod")}/></Field><Field label="Venue"><input required className={inputClass} value={v.venue.name} onChange={(e) => updateValue("name", e.target.value, "venue")}/></Field><Field label="Address"><input required className={inputClass} value={v.venue.address} onChange={(e) => updateValue("address", e.target.value, "venue")}/></Field><Field label="City"><input required className={inputClass} value={v.venue.city} onChange={(e) => updateValue("city", e.target.value, "venue")}/></Field><Field label="Country"><input required className={inputClass} value={v.venue.country} onChange={(e) => updateValue("country", e.target.value, "venue")}/></Field><Field label="Capacity"><input required min="1" type="number" className={inputClass} value={v.capacity} onChange={(e) => updateValue("capacity", e.target.value)}/></Field><Field label="Fee in centavos"><input required min="0" type="number" className={inputClass} value={v.registrationFee.amountInCentavos} onChange={(e) => updateValue("amountInCentavos", e.target.value, "registrationFee")}/></Field></>}
    {!isEvent && !isBlock && <><Field label="Room"><input required className={inputClass} value={v.room} onChange={(e) => updateValue("room", e.target.value)}/></Field>{editor.type === "breakout" && <Field label="Capacity"><input required min="1" type="number" className={inputClass} value={v.capacity} onChange={(e) => updateValue("capacity", e.target.value)}/></Field>}<label className={`${labelClass} sm:col-span-2`}>Speakers <span className="font-normal text-slate-400">— one per line: Name | Job title | Organization</span><textarea required rows="4" className={inputClass} value={v.speakersText} onChange={(e) => updateValue("speakersText", e.target.value)}/></label></>}
    {!isEvent && <Field label="Display order"><input required min="1" type="number" className={inputClass} value={v.displayOrder} onChange={(e) => updateValue("displayOrder", e.target.value)}/></Field>}
    {isBlock && <><Field label="Minimum choices"><input required min="0" type="number" className={inputClass} value={v.minimumSelections} onChange={(e) => updateValue("minimumSelections", e.target.value)}/></Field><Field label="Maximum choices"><input required min="1" type="number" className={inputClass} value={v.maximumSelections} onChange={(e) => updateValue("maximumSelections", e.target.value)}/></Field></>}
    <Field label="Status"><select className={inputClass} value={v.status} onChange={(e) => updateValue("status", e.target.value)}>{(isEvent ? ["draft","upcoming","registration-open","registration-closed","ongoing","completed","cancelled"] : isBlock ? ["scheduled","selection-open","selection-closed","ongoing","completed","cancelled"] : editor.type === "plenary" ? ["scheduled","ongoing","completed","cancelled"] : ["available","full","closed","ongoing","completed","cancelled"]).map((status) => <option key={status}>{status}</option>)}</select></Field>
    {isEvent && <label className="flex items-center gap-3 self-end rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold"><input type="checkbox" checked={v.isPublished} onChange={(e) => updateValue("isPublished", e.target.checked)}/>Published publicly</label>}
    {editor.type === "plenary" && <label className="flex items-center gap-3 self-end rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold"><input type="checkbox" checked={v.isRequired} onChange={(e) => updateValue("isRequired", e.target.checked)}/>Required for participants</label>}
  </div><div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-5"><button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-5 py-2.5 font-bold text-slate-600">Cancel</button><button disabled={isSaving} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 font-bold text-white disabled:opacity-60">{isSaving ? <LoaderCircle className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4"/>}Save</button></div></form></div>;
}

export default AdminEventsPage;
