import { useEffect, useMemo, useState } from "react";

const STATUS_OPTIONS = ["open", "blocked", "done", "cancelled", "closed"];
const PRIORITY_OPTIONS = ["critical", "high", "medium", "low"];
const CATEGORY_OPTIONS = ["CS", "Website", "Finance", "Logistics", "Marketing", "Product", "IT", "Other"];
const SOURCE_OPTIONS = ["AI email", "Weekly meeting", "Management", "Customer", "Bug", "Project", "Other"];

const pageStyle = { minHeight: "100vh", background: "#f5f7fb", fontFamily: "Arial, sans-serif", color: "#0f172a" };
const topbar = { background: "#0f172a", color: "#fff", padding: "18px 26px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 };
const card = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 22, padding: 22, marginBottom: 20, boxShadow: "0 8px 24px rgba(15,23,42,0.06)" };
const input = { width: "100%", padding: 12, borderRadius: 12, border: "1px solid #cbd5e1", boxSizing: "border-box", background: "#fff" };
const miniButton = { border: "none", background: "#eef2ff", color: "#3730a3", borderRadius: 10, padding: "7px 9px", fontWeight: 900, cursor: "pointer", fontSize: 12 };

export default function ActionsPage() {
  const [actions, setActions] = useState([]);
  const [statusMsg, setStatusMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [ownerFilter, setOwnerFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("open");
  const [etaFilter, setEtaFilter] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [noteText, setNoteText] = useState({});
  const [form, setForm] = useState({ title: "", owner_name: "", owner_email: "", eta: "", status: "open", priority: "medium", brand: "", category: "CS", source: "AI email", progress: 0, context_notes: "" });

  useEffect(() => { loadActions(); }, []);

  async function apiRequest(url, options = {}) {
    const res = await fetch(url, { ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) } });
    const payload = await res.json().catch(() => null);
    if (!res.ok) throw new Error(payload?.error || `Request failed: ${res.status}`);
    return payload;
  }

  async function loadActions() {
    try {
      setLoading(true);
      const rows = await apiRequest("/api/actions?includeClosed=true");
      setActions(Array.isArray(rows) ? rows : []);
      setStatusMsg("");
    } catch (error) { setStatusMsg(`Load failed: ${error.message}`); }
    finally { setLoading(false); }
  }

  function resetForm() {
    setEditingId(null);
    setForm({ title: "", owner_name: "", owner_email: "", eta: "", status: "open", priority: "medium", brand: "", category: "CS", source: "AI email", progress: 0, context_notes: "" });
  }

  function startEdit(action) {
    setEditingId(action.id);
    setForm({ title: action.title || "", owner_name: action.owner_name || "", owner_email: action.owner_email || "", eta: action.eta || "", status: action.status || "open", priority: action.priority || "medium", brand: action.brand || "", category: action.category || "CS", source: action.source || "AI email", progress: Number(action.progress || 0), context_notes: action.context_notes || "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveAction() {
    if (!form.title.trim()) { setStatusMsg("Action title is required."); return; }
    try {
      setLoading(true);
      const method = editingId ? "PATCH" : "POST";
      const url = editingId ? `/api/actions?id=${encodeURIComponent(editingId)}` : "/api/actions";
      await apiRequest(url, { method, body: JSON.stringify(form) });
      setStatusMsg(editingId ? "Action updated." : "Action created.");
      resetForm();
      await loadActions();
    } catch (error) { setStatusMsg(`Save failed: ${error.message}`); }
    finally { setLoading(false); }
  }

  async function updateAction(action, patch) {
    try { setLoading(true); await apiRequest(`/api/actions?id=${encodeURIComponent(action.id)}`, { method: "PATCH", body: JSON.stringify(patch) }); await loadActions(); }
    catch (error) { setStatusMsg(`Update failed: ${error.message}`); }
    finally { setLoading(false); }
  }

  async function addNote(action) {
    const text = (noteText[action.id] || "").trim();
    if (!text) return;
    const current = Array.isArray(action.comments) ? action.comments : [];
    await updateAction(action, { comments: current.concat([{ text, author: "Hub", date: new Date().toISOString() }]) });
    setNoteText({ ...noteText, [action.id]: "" });
  }

  function ownerColor(owner = "") {
    const palette = ["#2563eb", "#7c3aed", "#0f766e", "#db2777", "#ea580c", "#4f46e5", "#0891b2", "#65a30d"];
    let total = 0;
    for (const char of owner || "Unassigned") total += char.charCodeAt(0);
    return palette[total % palette.length];
  }

  function badge(value, type = "status") {
    const maps = {
      status: { open:["#dbeafe", "#1d4ed8"], blocked:["#fef3c7", "#92400e"], done:["#dcfce7", "#166534"], cancelled:["#fee2e2", "#991b1b"], closed:["#e5e7eb", "#374151"] },
      priority: { critical:["#fee2e2", "#991b1b"], high:["#ffedd5", "#c2410c"], medium:["#e0f2fe", "#0369a1"], low:["#dcfce7", "#166534"] }
    };
    const [bg, color] = (maps[type] && maps[type][value]) || ["#f1f5f9", "#475569"];
    return <span style={{ display:"inline-block", padding:"6px 10px", borderRadius:999, background:bg, color, fontWeight:900, fontSize:12 }}>{value || "-"}</span>;
  }

  function etaBadge(eta) {
    if (!eta) return <span style={{ color:"#64748b" }}>No ETA</span>;
    const today = new Date(); today.setHours(0,0,0,0);
    const d = new Date(`${eta}T00:00:00`);
    const diff = Math.round((d - today) / 86400000);
    let bg = "#dcfce7", color = "#166534", label = eta;
    if (diff < 0) { bg = "#fee2e2"; color = "#991b1b"; label = `${eta} · overdue`; }
    else if (diff <= 3) { bg = "#fef3c7"; color = "#92400e"; label = `${eta} · soon`; }
    return <span style={{ display:"inline-block", padding:"6px 10px", borderRadius:999, background:bg, color, fontWeight:900, fontSize:12 }}>{label}</span>;
  }

  function isOverdue(a) { if (!a.eta || ["done", "cancelled", "closed"].includes(a.status) || a.archived) return false; const today = new Date(); today.setHours(0,0,0,0); return new Date(`${a.eta}T00:00:00`) < today; }
  function dueThisWeek(a) { if (!a.eta || ["done", "cancelled", "closed"].includes(a.status) || a.archived) return false; const today = new Date(); today.setHours(0,0,0,0); const d = new Date(`${a.eta}T00:00:00`); const diff = Math.round((d - today) / 86400000); return diff >= 0 && diff <= 7; }

  function downloadOpenActions() {
    const open = actions.filter((a) => a.status === "open" && !a.archived);
    const blob = new Blob([JSON.stringify(open, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "open-action-board-actions.json"; a.click(); URL.revokeObjectURL(url);
  }

  const owners = Array.from(new Set(actions.map((a) => a.owner_name).filter(Boolean))).sort();
  const closedThisMonth = actions.filter((a) => ["done", "cancelled", "closed"].includes(a.status) && a.updated_at && new Date(a.updated_at).getMonth() === new Date().getMonth());
  const averageAge = useMemo(() => { const open = actions.filter((a) => a.status === "open" && !a.archived && a.created_at); if (!open.length) return 0; const now = Date.now(); return Math.round(open.reduce((sum, a) => sum + Math.max(0, (now - new Date(a.created_at).getTime()) / 86400000), 0) / open.length); }, [actions]);

  const filtered = actions.filter((action) => {
    if (!showArchived && (action.archived || ["done", "cancelled", "closed"].includes(action.status))) return false;
    if (ownerFilter && action.owner_name !== ownerFilter) return false;
    if (statusFilter && statusFilter !== "all" && action.status !== statusFilter) return false;
    if (etaFilter && action.eta !== etaFilter) return false;
    const q = searchFilter.toLowerCase().trim();
    if (q && ![action.title, action.owner_name, action.owner_email, action.context_notes, action.brand, action.category, action.source].some((v) => String(v || "").toLowerCase().includes(q))) return false;
    return true;
  });

  return <div style={pageStyle}>
    <div style={topbar}><div><div style={{ fontSize:26, fontWeight:950 }}>TG Actions</div><div style={{ color:"#cbd5e1", marginTop:4 }}>Action Board | AI Automatic Email</div></div><div><a href="/" style={{ color:"#dbeafe", fontWeight:900, textDecoration:"none", marginRight:14 }}>Back to Hub</a><a href="/api/actions?reminder=true" target="_blank" rel="noreferrer" style={{ background:"#fff", color:"#0f172a", padding:"10px 14px", borderRadius:12, textDecoration:"none", fontWeight:900 }}>Reminder JSON</a></div></div>
    <main style={{ padding:24 }}>
      <section style={card}><div style={{ display:"flex", justifyContent:"space-between", gap:18, flexWrap:"wrap" }}><div><h1 style={{ margin:0, fontSize:40 }}>Actions</h1><p style={{ color:"#4b5563", lineHeight:1.7 }}>Central source of truth. Reminders must only include actions with status <b>open</b>.</p></div><button onClick={downloadOpenActions} style={{ background:"#2563eb", color:"#fff", border:"none", borderRadius:12, padding:"10px 14px", fontWeight:900, cursor:"pointer", height:"fit-content" }}>Export open actions</button></div><div style={{ display:"grid", gridTemplateColumns:"repeat(6, 1fr)", gap:12, marginTop:18 }}><Kpi title="Open" value={actions.filter((a) => a.status === "open" && !a.archived).length} color="#1d4ed8" /><Kpi title="Blocked" value={actions.filter((a) => a.status === "blocked" && !a.archived).length} color="#92400e" /><Kpi title="Overdue" value={actions.filter(isOverdue).length} color="#991b1b" /><Kpi title="Closed this month" value={closedThisMonth.length} color="#166534" /><Kpi title="Due this week" value={actions.filter(dueThisWeek).length} color="#7c3aed" /><Kpi title="Avg age" value={`${averageAge}d`} color="#475569" /></div></section>

      <section style={card}><h2>{editingId ? "Edit action" : "Add new action"}</h2><div style={{ display:"grid", gridTemplateColumns:"1.4fr .8fr 1fr .7fr .7fr .7fr", gap:12 }}><Field label="Action / title"><input value={form.title} onChange={(e) => setForm({ ...form, title:e.target.value })} style={input} /></Field><Field label="Owner"><input value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name:e.target.value })} style={input} /></Field><Field label="Owner email"><input value={form.owner_email} onChange={(e) => setForm({ ...form, owner_email:e.target.value })} style={input} /></Field><Field label="ETA"><input type="date" value={form.eta || ""} onChange={(e) => setForm({ ...form, eta:e.target.value })} style={input} /></Field><Field label="Status"><select value={form.status} onChange={(e) => setForm({ ...form, status:e.target.value })} style={input}>{STATUS_OPTIONS.map((x) => <option key={x}>{x}</option>)}</select></Field><Field label="Priority"><select value={form.priority} onChange={(e) => setForm({ ...form, priority:e.target.value })} style={input}>{PRIORITY_OPTIONS.map((x) => <option key={x}>{x}</option>)}</select></Field></div><div style={{ display:"grid", gridTemplateColumns:".8fr .8fr .8fr .8fr", gap:12, marginTop:12 }}><Field label="Brand"><input value={form.brand} onChange={(e) => setForm({ ...form, brand:e.target.value })} style={input} /></Field><Field label="Category"><select value={form.category} onChange={(e) => setForm({ ...form, category:e.target.value })} style={input}>{CATEGORY_OPTIONS.map((x) => <option key={x}>{x}</option>)}</select></Field><Field label="Source"><select value={form.source} onChange={(e) => setForm({ ...form, source:e.target.value })} style={input}>{SOURCE_OPTIONS.map((x) => <option key={x}>{x}</option>)}</select></Field><Field label="Progress %"><input type="number" min="0" max="100" value={form.progress} onChange={(e) => setForm({ ...form, progress:e.target.value })} style={input} /></Field></div><Field label="Context / notes"><textarea value={form.context_notes} onChange={(e) => setForm({ ...form, context_notes:e.target.value })} style={{ ...input, minHeight:100, lineHeight:1.6 }} /></Field><div style={{ display:"flex", gap:10, marginTop:14 }}><button onClick={saveAction} disabled={loading} style={{ background:"#15803d", color:"#fff", border:"none", borderRadius:12, padding:"12px 16px", fontWeight:900, cursor:"pointer" }}>{editingId ? "Save changes" : "Add action"}</button>{editingId && <button onClick={resetForm} style={{ background:"#e5e7eb", color:"#111827", border:"none", borderRadius:12, padding:"12px 16px", fontWeight:900, cursor:"pointer" }}>Cancel edit</button>}</div>{statusMsg && <div style={{ marginTop:14, color:statusMsg.includes("failed") ? "#b91c1c" : "#166534", fontWeight:900 }}>{statusMsg}</div>}</section>

      <section style={card}><div style={{ display:"flex", justifyContent:"space-between", gap:14, alignItems:"center", flexWrap:"wrap" }}><h2 style={{ margin:0 }}>Actions table</h2><label style={{ display:"flex", alignItems:"center", gap:8, fontWeight:900 }}><input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} /> Show archived / closed</label></div><div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:12, marginTop:16 }}><select value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)} style={input}><option value="">All owners</option>{owners.map((owner) => <option key={owner}>{owner}</option>)}</select><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={input}><option value="open">Open only</option><option value="blocked">Blocked only</option><option value="all">All statuses</option>{STATUS_OPTIONS.map((x) => <option key={x}>{x}</option>)}</select><input type="date" value={etaFilter} onChange={(e) => setEtaFilter(e.target.value)} style={input} /><input value={searchFilter} onChange={(e) => setSearchFilter(e.target.value)} placeholder="Search..." style={input} /></div><div style={{ overflowX:"auto", marginTop:16 }}><table style={{ width:"100%", borderCollapse:"collapse", background:"#fff" }}><thead><tr style={{ textAlign:"left", color:"#64748b", borderBottom:"1px solid #e5e7eb" }}>{["Owner", "Action", "ETA", "Status", "Context", "Last updated", "Edit"].map((h) => <th key={h} style={{ padding:"12px 10px", fontSize:13 }}>{h}</th>)}</tr></thead><tbody>{filtered.map((action) => { const color = ownerColor(action.owner_name); return <tr key={action.id} style={{ borderBottom:"1px solid #f1f5f9", opacity:action.archived ? .55 : 1 }}><td style={{ padding:"12px 10px", minWidth:160 }}><div style={{ display:"flex", alignItems:"center", gap:10 }}><span style={{ width:12, height:12, borderRadius:"50%", background:color, display:"inline-block" }} /><div><div style={{ fontWeight:950 }}>{action.owner_name || "Unassigned"}</div><div style={{ color:"#64748b", fontSize:12 }}>{action.owner_email || ""}</div></div></div></td><td style={{ padding:"12px 10px", minWidth:260 }}><div style={{ fontWeight:900 }}>{action.title}</div><div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:6 }}>{badge(action.priority || "medium", "priority")}<span style={{ color:"#64748b", fontSize:12, paddingTop:6 }}>{action.category || ""} · {action.brand || "No brand"} · {action.progress || 0}%</span></div></td><td style={{ padding:"12px 10px", minWidth:130 }}>{etaBadge(action.eta)}</td><td style={{ padding:"12px 10px", minWidth:120 }}>{badge(action.status)}</td><td style={{ padding:"12px 10px", minWidth:340, color:"#334155", lineHeight:1.55 }}><div style={{ whiteSpace:"pre-wrap" }}>{action.context_notes || ""}</div>{Array.isArray(action.comments) && action.comments.length > 0 && <details style={{ marginTop:8 }}><summary style={{ cursor:"pointer", fontWeight:900 }}>Comments ({action.comments.length})</summary>{action.comments.map((c, i) => <div key={i} style={{ marginTop:8, background:"#f8fafc", borderRadius:10, padding:10 }}><div style={{ color:"#64748b", fontSize:12 }}>{c.date ? new Date(c.date).toLocaleString() : ""}</div><div>{c.text}</div></div>)}</details>}<div style={{ display:"flex", gap:6, marginTop:8 }}><input value={noteText[action.id] || ""} onChange={(e) => setNoteText({ ...noteText, [action.id]:e.target.value })} placeholder="Add comment..." style={{ ...input, padding:8 }} /><button onClick={() => addNote(action)} style={miniButton}>Add</button></div></td><td style={{ padding:"12px 10px", minWidth:150, color:"#64748b" }}>{action.updated_at ? new Date(action.updated_at).toLocaleString() : ""}</td><td style={{ padding:"12px 10px", minWidth:230 }}><div style={{ display:"flex", gap:6, flexWrap:"wrap" }}><button onClick={() => startEdit(action)} style={miniButton}>Edit</button>{action.status !== "done" && <button onClick={() => updateAction(action, { status:"done", progress:100 })} style={miniButton}>Done</button>}{action.status !== "blocked" && <button onClick={() => updateAction(action, { status:"blocked" })} style={miniButton}>Blocked</button>}{action.status !== "open" && <button onClick={() => updateAction(action, { status:"open", archived:false })} style={miniButton}>Reopen</button>}<button onClick={() => updateAction(action, { archived:!action.archived })} style={miniButton}>{action.archived ? "Restore" : "Archive"}</button></div></td></tr>; })}{!filtered.length && <tr><td colSpan={7} style={{ padding:18, color:"#64748b" }}>No action found.</td></tr>}</tbody></table></div></section>
    </main>
  </div>;
}

function Kpi({ title, value, color }) { return <div style={{ background:"#fff", border:`1px solid ${color}33`, borderTop:`5px solid ${color}`, borderRadius:16, padding:16 }}><div style={{ color, fontWeight:900 }}>{title}</div><div style={{ fontSize:32, fontWeight:950, marginTop:6 }}>{value}</div></div>; }
function Field({ label, children }) { return <div style={{ marginTop:12 }}><div style={{ fontWeight:900, marginBottom:8 }}>{label}</div>{children}</div>; }
