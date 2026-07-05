import { useEffect, useMemo, useState } from "react";

const STATUS_OPTIONS = ["open", "blocked", "done", "cancelled", "closed"];
const PRIORITY_OPTIONS = ["critical", "high", "medium", "low"];
const CATEGORY_OPTIONS = ["CS", "Website", "Finance", "Logistics", "Marketing", "Product", "IT", "Operations", "Automation", "Customer Experience", "Reporting", "Other"];
const SOURCE_OPTIONS = ["AI email", "Weekly meeting", "Management", "Customer", "Bug", "Project", "Other"];

const statusMeta = {
  open: { label: "Open", bg: "#e8f3ff", fg: "#0b63ce", dot: "#0b63ce" },
  blocked: { label: "Blocked", bg: "#fff4d6", fg: "#9a6700", dot: "#f2b600" },
  done: { label: "Done", bg: "#dff7e8", fg: "#0f7a3b", dot: "#00c875" },
  cancelled: { label: "Cancelled", bg: "#ffe2e2", fg: "#b42318", dot: "#e2445c" },
  closed: { label: "Closed", bg: "#eceff3", fg: "#475467", dot: "#667085" }
};

const priorityMeta = {
  critical: { label: "Critical", bg: "#ffe2e2", fg: "#b42318" },
  high: { label: "High", bg: "#fff0e5", fg: "#c2410c" },
  medium: { label: "Medium", bg: "#e8f3ff", fg: "#0b63ce" },
  low: { label: "Low", bg: "#e8f8ef", fg: "#0f7a3b" }
};

const colors = ["#579bfc", "#a25ddc", "#00c875", "#e2445c", "#fdab3d", "#0086c9", "#9cd326", "#ff642e", "#66ccff"];

const pageStyle = {
  minHeight: "100vh",
  background: "#f6f7fb",
  fontFamily: "Arial, sans-serif",
  color: "#172b4d"
};

const inputStyle = {
  width: "100%",
  padding: 12,
  borderRadius: 10,
  border: "1px solid #d0d5dd",
  boxSizing: "border-box",
  background: "#fff"
};

const smallButton = {
  border: "none",
  background: "#f0f3ff",
  color: "#344054",
  borderRadius: 8,
  padding: "7px 9px",
  fontWeight: 800,
  cursor: "pointer",
  fontSize: 12
};

function firstName(name = "") {
  const clean = String(name || "").trim();
  if (!clean) return "Unassigned";
  if (clean.includes("/")) return clean.split("/").map((x) => x.trim().split(" ")[0]).join(" / ");
  if (clean.toLowerCase().includes(" and ")) return clean.split(/ and /i).map((x) => x.trim().split(" ")[0]).join(" / ");
  return clean.split(" ")[0];
}

function ownerColor(owner = "") {
  const name = firstName(owner);
  let total = 0;
  for (const char of name) total += char.charCodeAt(0);
  return colors[total % colors.length];
}

function isClosed(action) {
  return action.archived || ["done", "cancelled", "closed"].includes(action.status);
}

function isOverdue(action) {
  if (!action.eta || isClosed(action)) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(`${action.eta}T00:00:00`) < today;
}

function dueInDays(action) {
  if (!action.eta) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((new Date(`${action.eta}T00:00:00`) - today) / 86400000);
}

function dueThisWeek(action) {
  const d = dueInDays(action);
  return d !== null && d >= 0 && d <= 7 && !isClosed(action);
}

function formatDate(date) {
  if (!date) return "No ETA";
  try {
    return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return date;
  }
}

function apiDateTime(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function Badge({ value, type = "status" }) {
  const meta = type === "priority" ? priorityMeta[value] || priorityMeta.medium : statusMeta[value] || statusMeta.open;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 10px", borderRadius: 999, background: meta.bg, color: meta.fg, fontWeight: 900, fontSize: 12, whiteSpace: "nowrap" }}>
      {type === "status" && <span style={{ width: 8, height: 8, borderRadius: "50%", background: meta.dot }} />}
      {meta.label}
    </span>
  );
}

function Kpi({ title, value, color, hint }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #eaecf0", borderRadius: 18, padding: 18, boxShadow: "0 8px 24px rgba(16,24,40,.06)", borderTop: `5px solid ${color}` }}>
      <div style={{ color: "#667085", fontWeight: 900, fontSize: 12, textTransform: "uppercase", letterSpacing: .4 }}>{title}</div>
      <div style={{ fontSize: 34, fontWeight: 950, marginTop: 8, color: "#101828" }}>{value}</div>
      {hint && <div style={{ color: "#667085", marginTop: 6, fontSize: 13 }}>{hint}</div>}
    </div>
  );
}

function ProgressBar({ value }) {
  const v = Math.max(0, Math.min(100, Number(value || 0)));
  return (
    <div style={{ minWidth: 95 }}>
      <div style={{ height: 9, background: "#eef2f7", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ width: `${v}%`, height: "100%", background: v >= 100 ? "#00c875" : v >= 50 ? "#579bfc" : "#fdab3d" }} />
      </div>
      <div style={{ color: "#667085", fontSize: 12, marginTop: 4, fontWeight: 800 }}>{v}%</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div style={{ fontWeight: 900, color: "#344054", marginBottom: 7, fontSize: 13 }}>{label}</div>
      {children}
    </div>
  );
}

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
  const [selectedAction, setSelectedAction] = useState(null);
  const [noteText, setNoteText] = useState({});
  const [form, setForm] = useState({
    title: "",
    owner_name: "",
    owner_email: "",
    eta: "",
    status: "open",
    priority: "medium",
    brand: "",
    category: "CS",
    source: "AI email",
    progress: 0,
    context_notes: ""
  });

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
      const rows = await apiRequest("/api/actions-admin?includeClosed=true");
      setActions(Array.isArray(rows) ? rows : []);
      setStatusMsg("");
    } catch (error) {
      setStatusMsg(`Load failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setEditingId(null);
    setForm({ title: "", owner_name: "", owner_email: "", eta: "", status: "open", priority: "medium", brand: "", category: "CS", source: "AI email", progress: 0, context_notes: "" });
  }

  function startEdit(action) {
    setEditingId(action.id);
    setForm({
      title: action.title || "",
      owner_name: firstName(action.owner_name || ""),
      owner_email: action.owner_email || "",
      eta: action.eta || "",
      status: action.status || "open",
      priority: action.priority || "medium",
      brand: action.brand || "",
      category: action.category || "CS",
      source: action.source || "AI email",
      progress: Number(action.progress || 0),
      context_notes: action.context_notes || ""
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveAction() {
    if (!form.title.trim()) {
      setStatusMsg("Action title is required.");
      return;
    }
    try {
      setLoading(true);
      const method = editingId ? "PATCH" : "POST";
      const url = editingId ? `/api/actions-admin?id=${encodeURIComponent(editingId)}` : "/api/actions-admin";
      await apiRequest(url, { method, body: JSON.stringify({ ...form, owner_name: firstName(form.owner_name) }) });
      setStatusMsg(editingId ? "Action updated." : "Action created.");
      resetForm();
      await loadActions();
    } catch (error) {
      setStatusMsg(`Save failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function updateAction(action, patch, successMessage = "Action updated.") {
    try {
      setLoading(true);

      const saved = await apiRequest(`/api/actions-admin?id=${encodeURIComponent(action.id)}`, {
        method: "PATCH",
        body: JSON.stringify(patch)
      });

      setStatusMsg(successMessage);

      if (selectedAction && selectedAction.id === action.id) {
        setSelectedAction(saved || { ...selectedAction, ...patch, updated_at: new Date().toISOString() });
      }

      await loadActions();
    } catch (error) {
      setStatusMsg(`Update failed: ${error.message}`);
      alert(`Update failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function closeAction(action) {
    await updateAction(
      action,
      { status: "done", progress: 100, archived: true },
      "Action closed. It is now hidden from the default Open view."
    );
  }

  async function blockAction(action) {
    await updateAction(
      action,
      { status: "blocked", archived: false },
      "Action marked as blocked."
    );
  }

  async function reopenAction(action) {
    await updateAction(
      action,
      { status: "open", archived: false },
      "Action reopened."
    );
  }

  async function archiveAction(action) {
    await updateAction(
      action,
      { archived: !action.archived },
      action.archived ? "Action restored." : "Action archived."
    );
  }

  async function addNote(action) {
    const text = (noteText[action.id] || "").trim();
    if (!text) return;
    const current = Array.isArray(action.comments) ? action.comments : [];
    const next = current.concat([{ text, author: "Hub", date: new Date().toISOString() }]);
    await updateAction(action, { comments: next });
    setNoteText({ ...noteText, [action.id]: "" });
  }

  function downloadOpenActions() {
    const open = actions.filter((a) => a.status === "open" && !a.archived);
    const blob = new Blob([JSON.stringify(open, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "open-action-board-actions.json"; a.click();
    URL.revokeObjectURL(url);
  }

  const owners = useMemo(() => Array.from(new Set(actions.map((a) => firstName(a.owner_name)).filter(Boolean))).sort(), [actions]);

  const filtered = useMemo(() => actions.filter((action) => {
    if (!showArchived && isClosed(action)) return false;
    if (ownerFilter && firstName(action.owner_name) !== ownerFilter) return false;
    if (statusFilter && statusFilter !== "all" && action.status !== statusFilter) return false;
    if (etaFilter && action.eta !== etaFilter) return false;
    const q = searchFilter.toLowerCase().trim();
    if (q && ![action.title, action.owner_name, action.owner_email, action.context_notes, action.brand, action.category, action.source].some((v) => String(v || "").toLowerCase().includes(q))) return false;
    return true;
  }), [actions, showArchived, ownerFilter, statusFilter, etaFilter, searchFilter]);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const action of filtered) {
      const owner = firstName(action.owner_name);
      if (!map.has(owner)) map.set(owner, []);
      map.get(owner).push(action);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const closedThisMonth = actions.filter((a) => {
    if (!["done", "cancelled", "closed"].includes(a.status)) return false;
    if (!a.updated_at) return false;
    const d = new Date(a.updated_at), now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });

  const openActions = actions.filter((a) => a.status === "open" && !a.archived);
  const topOwner = (() => {
    const counts = {};
    for (const a of openActions) counts[firstName(a.owner_name)] = (counts[firstName(a.owner_name)] || 0) + 1;
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted[0] ? `${sorted[0][0]} (${sorted[0][1]})` : "—";
  })();

  const averageAge = (() => {
    const open = actions.filter((a) => a.status === "open" && !a.archived && a.created_at);
    if (!open.length) return 0;
    const now = Date.now();
    const days = open.reduce((sum, a) => sum + Math.max(0, (now - new Date(a.created_at).getTime()) / 86400000), 0) / open.length;
    return Math.round(days);
  })();

  const aiSummary = (() => {
    const overdue = actions.filter(isOverdue).length;
    const blocked = actions.filter((a) => a.status === "blocked" && !a.archived).length;
    const dueWeek = actions.filter(dueThisWeek).length;
    const categories = {};
    for (const a of openActions) categories[a.category || "Other"] = (categories[a.category || "Other"] || 0) + 1;
    const topCat = Object.entries(categories).sort((a, b) => b[1] - a[1])[0]?.[0] || "operations";
    return `${openActions.length} actions remain open. ${overdue} are overdue, ${blocked} are blocked and ${dueWeek} are due this week. The highest workload is currently with ${topOwner}. Most open actions are related to ${topCat}.`;
  })();

  return (
    <div style={pageStyle}>
      <div style={{ background: "linear-gradient(135deg,#111827,#1f2937)", color: "#fff", padding: "22px 30px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 18 }}>
        <div>
          <a href="/" style={{ color: "#c7d2fe", textDecoration: "none", fontWeight: 900 }}>← Back to Hub</a>
          <h1 style={{ margin: "8px 0 4px", fontSize: 36 }}>Action Board</h1>
          <div style={{ color: "#d0d5dd" }}>Reference board for Action Board | AI Automatic Email reminders</div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a href="https://sunday-lilac.vercel.app/api/action-board-feed?token=tgr_actions_2026_9Kf7LmP2xQ8vNcR4" target="_blank" rel="noreferrer" style={{ background: "#fff", color: "#111827", padding: "11px 14px", borderRadius: 12, textDecoration: "none", fontWeight: 900 }}>Reminder JSON</a>
          <button onClick={downloadOpenActions} style={{ background: "#579bfc", color: "#fff", border: "none", borderRadius: 12, padding: "11px 14px", fontWeight: 900, cursor: "pointer" }}>Export open actions</button>
        </div>
      </div>

      <div style={{ padding: 26, maxWidth: 1680, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 14, marginBottom: 18 }}>
          <Kpi title="Open" value={openActions.length} color="#579bfc" />
          <Kpi title="Blocked" value={actions.filter((a) => a.status === "blocked" && !a.archived).length} color="#fdab3d" />
          <Kpi title="Overdue" value={actions.filter(isOverdue).length} color="#e2445c" />
          <Kpi title="Due this week" value={actions.filter(dueThisWeek).length} color="#a25ddc" />
          <Kpi title="Closed this month" value={closedThisMonth.length} color="#00c875" />
          <Kpi title="Top owner" value={topOwner} color="#0086c9" hint={`Avg age: ${averageAge}d`} />
        </div>

        <div style={{ background: "#fff", border: "1px solid #eaecf0", borderRadius: 18, padding: 18, marginBottom: 18, boxShadow: "0 8px 24px rgba(16,24,40,.06)" }}>
          <div style={{ fontWeight: 950, fontSize: 20, marginBottom: 8 }}>🤖 Executive Summary</div>
          <div style={{ color: "#475467", lineHeight: 1.65 }}>{aiSummary}</div>
        </div>

        {statusMsg && (
          <div style={{ background: statusMsg.includes("failed") ? "#fff1f3" : "#ecfdf3", color: statusMsg.includes("failed") ? "#b42318" : "#027a48", border: "1px solid " + (statusMsg.includes("failed") ? "#fecdd3" : "#abefc6"), borderRadius: 14, padding: 12, marginBottom: 18, fontWeight: 900 }}>
            {statusMsg}
          </div>
        )}

        <div style={{ background: "#fff", border: "1px solid #eaecf0", borderRadius: 18, padding: 18, marginBottom: 18, boxShadow: "0 8px 24px rgba(16,24,40,.06)" }}>
          <div style={{ fontWeight: 950, fontSize: 22, marginBottom: 14 }}>{editingId ? "Edit action" : "Add new action"}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr .8fr 1fr .7fr .75fr .75fr", gap: 12 }}>
            <Field label="Action"><input value={form.title} onChange={(e) => setForm({ ...form, title:e.target.value })} placeholder="Action title" style={inputStyle} /></Field>
            <Field label="Owner"><input value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name:e.target.value })} placeholder="Owner" style={inputStyle} /></Field>
            <Field label="Owner email"><input value={form.owner_email} onChange={(e) => setForm({ ...form, owner_email:e.target.value })} placeholder="owner@email.com" style={inputStyle} /></Field>
            <Field label="ETA"><input type="date" value={form.eta || ""} onChange={(e) => setForm({ ...form, eta:e.target.value })} style={inputStyle} /></Field>
            <Field label="Status"><select value={form.status} onChange={(e) => setForm({ ...form, status:e.target.value })} style={inputStyle}>{STATUS_OPTIONS.map((x) => <option key={x} value={x}>{x}</option>)}</select></Field>
            <Field label="Priority"><select value={form.priority} onChange={(e) => setForm({ ...form, priority:e.target.value })} style={inputStyle}>{PRIORITY_OPTIONS.map((x) => <option key={x} value={x}>{x}</option>)}</select></Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: ".8fr .8fr .8fr .8fr", gap: 12, marginTop: 14 }}>
            <Field label="Brand"><input value={form.brand} onChange={(e) => setForm({ ...form, brand:e.target.value })} placeholder="Brand" style={inputStyle} /></Field>
            <Field label="Category"><select value={form.category} onChange={(e) => setForm({ ...form, category:e.target.value })} style={inputStyle}>{CATEGORY_OPTIONS.map((x) => <option key={x} value={x}>{x}</option>)}</select></Field>
            <Field label="Source"><select value={form.source} onChange={(e) => setForm({ ...form, source:e.target.value })} style={inputStyle}>{SOURCE_OPTIONS.map((x) => <option key={x} value={x}>{x}</option>)}</select></Field>
            <Field label="Progress %"><input type="number" min="0" max="100" value={form.progress} onChange={(e) => setForm({ ...form, progress:e.target.value })} style={inputStyle} /></Field>
          </div>

          <div style={{ marginTop: 14 }}><Field label="Context"><textarea value={form.context_notes} onChange={(e) => setForm({ ...form, context_notes:e.target.value })} placeholder="Clean management context..." style={{ ...inputStyle, minHeight: 90, lineHeight: 1.6 }} /></Field></div>

          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <button onClick={saveAction} disabled={loading} style={{ background: "#00c875", color: "#fff", border: "none", borderRadius: 10, padding: "12px 16px", fontWeight: 950, cursor: "pointer" }}>{editingId ? "Save changes" : "Add action"}</button>
            {editingId && <button onClick={resetForm} style={{ background: "#eef2f7", color: "#344054", border: "none", borderRadius: 10, padding: "12px 16px", fontWeight: 950, cursor: "pointer" }}>Cancel edit</button>}
          </div>
          {statusMsg && <div style={{ marginTop: 12, color: statusMsg.includes("failed") ? "#b42318" : "#0f7a3b", fontWeight: 900 }}>{statusMsg}</div>}
        </div>

        <div style={{ background: "#fff", border: "1px solid #eaecf0", borderRadius: 18, padding: 18, boxShadow: "0 8px 24px rgba(16,24,40,.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "center", flexWrap: "wrap", marginBottom: 14 }}>
            <div style={{ fontWeight: 950, fontSize: 22 }}>Actions by owner</div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 900, color: "#344054" }}>
              <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
              Show archived / closed
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1.4fr", gap: 12, marginBottom: 16 }}>
            <select value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)} style={inputStyle}><option value="">All owners</option>{owners.map((owner) => <option key={owner} value={owner}>{owner}</option>)}</select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={inputStyle}><option value="open">Open only</option><option value="blocked">Blocked only</option><option value="all">All statuses</option>{STATUS_OPTIONS.map((x) => <option key={x} value={x}>{x}</option>)}</select>
            <input type="date" value={etaFilter} onChange={(e) => setEtaFilter(e.target.value)} style={inputStyle} />
            <input value={searchFilter} onChange={(e) => setSearchFilter(e.target.value)} placeholder="Search action, owner, context, category..." style={inputStyle} />
          </div>

          <div style={{ display: "grid", gap: 18 }}>
            {grouped.map(([owner, items]) => {
              const color = ownerColor(owner);
              return (
                <div key={owner} style={{ border: "1px solid #eaecf0", borderRadius: 16, overflow: "hidden" }}>
                  <div style={{ background: "#f9fafb", padding: "12px 14px", borderLeft: `7px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: "50%", background: color, color: "#fff", display: "grid", placeItems: "center", fontWeight: 950 }}>{owner.slice(0,1)}</div>
                      <div style={{ fontWeight: 950, fontSize: 18 }}>{owner}</div>
                      <div style={{ color: "#667085", fontWeight: 800 }}>{items.length} actions</div>
                    </div>
                  </div>

                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
                      <thead>
                        <tr style={{ textAlign: "left", color: "#667085", borderBottom: "1px solid #eaecf0" }}>
                          {["Action", "Priority", "ETA", "Progress", "Status", "Context", "Last update", ""].map((h) => <th key={h} style={{ padding: "11px 10px", fontSize: 12, textTransform: "uppercase" }}>{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((action) => (
                          <tr key={action.id} style={{ borderBottom: "1px solid #f2f4f7", opacity: action.archived ? .55 : 1 }}>
                            <td style={{ padding: "13px 10px", minWidth: 280 }}>
                              <div onClick={() => setSelectedAction(action)} style={{ fontWeight: 950, color: "#101828", cursor: "pointer" }}>{action.title}</div>
                              <div style={{ color: "#667085", fontSize: 12, marginTop: 5 }}>{action.category || "Other"} · {action.brand || "No brand"} · {action.source || "No source"}</div>
                            </td>
                            <td style={{ padding: "13px 10px" }}><Badge value={action.priority || "medium"} type="priority" /></td>
                            <td style={{ padding: "13px 10px", whiteSpace: "nowrap" }}>
                              <span style={{ display: "inline-block", padding: "7px 10px", borderRadius: 999, background: isOverdue(action) ? "#ffe2e2" : dueThisWeek(action) ? "#fff4d6" : "#e8f8ef", color: isOverdue(action) ? "#b42318" : dueThisWeek(action) ? "#9a6700" : "#0f7a3b", fontWeight: 900, fontSize: 12 }}>
                                {formatDate(action.eta)}
                              </span>
                            </td>
                            <td style={{ padding: "13px 10px" }}><ProgressBar value={action.progress} /></td>
                            <td style={{ padding: "13px 10px" }}><Badge value={action.status || "open"} /></td>
                            <td style={{ padding: "13px 10px", minWidth: 420, maxWidth: 520, color: "#344054", lineHeight: 1.5 }}>
                              <div style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{action.context_notes || ""}</div>
                            </td>
                            <td style={{ padding: "13px 10px", color: "#667085", whiteSpace: "nowrap" }}>{apiDateTime(action.updated_at)}</td>
                            <td style={{ padding: "13px 10px", minWidth: 250 }}>
                              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                <button onClick={() => startEdit(action)} style={smallButton}>Edit</button>
                                {action.status !== "done" && <button onClick={() => closeAction(action)} style={smallButton}>Done</button>}
                                {action.status !== "blocked" && <button onClick={() => blockAction(action)} style={smallButton}>Blocked</button>}
                                {action.status !== "open" && <button onClick={() => reopenAction(action)} style={smallButton}>Reopen</button>}
                                <button onClick={() => archiveAction(action)} style={smallButton}>{action.archived ? "Restore" : "Archive"}</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
            {!grouped.length && <div style={{ padding: 24, color: "#667085" }}>No actions found.</div>}
          </div>
        </div>
      </div>

      {selectedAction && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(16,24,40,.35)", zIndex: 20, display: "flex", justifyContent: "flex-end" }} onClick={() => setSelectedAction(null)}>
          <div style={{ width: 520, background: "#fff", height: "100%", padding: 24, overflowY: "auto", boxShadow: "-20px 0 40px rgba(16,24,40,.18)" }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedAction(null)} style={{ ...smallButton, float: "right" }}>Close</button>
            <div style={{ clear: "both" }} />
            <Badge value={selectedAction.status || "open"} />
            <h2 style={{ fontSize: 30, margin: "16px 0 8px", color: "#101828" }}>{selectedAction.title}</h2>
            <div style={{ color: "#667085", lineHeight: 1.6 }}>{selectedAction.context_notes}</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 20 }}>
              <DrawerInfo label="Owner" value={firstName(selectedAction.owner_name)} />
              <DrawerInfo label="ETA" value={formatDate(selectedAction.eta)} />
              <DrawerInfo label="Priority" value={selectedAction.priority} />
              <DrawerInfo label="Progress" value={`${selectedAction.progress || 0}%`} />
              <DrawerInfo label="Brand" value={selectedAction.brand || "—"} />
              <DrawerInfo label="Category" value={selectedAction.category || "—"} />
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 22 }}>
              <button onClick={() => closeAction(selectedAction)} style={{ background:"#00c875", color:"#fff", border:"none", borderRadius:10, padding:"10px 12px", fontWeight:900, cursor:"pointer" }}>Close as Done</button>
              <button onClick={() => blockAction(selectedAction)} style={{ background:"#fdab3d", color:"#fff", border:"none", borderRadius:10, padding:"10px 12px", fontWeight:900, cursor:"pointer" }}>Mark Blocked</button>
              <button onClick={() => reopenAction(selectedAction)} style={{ background:"#579bfc", color:"#fff", border:"none", borderRadius:10, padding:"10px 12px", fontWeight:900, cursor:"pointer" }}>Reopen</button>
              <button onClick={() => archiveAction(selectedAction)} style={{ background:"#344054", color:"#fff", border:"none", borderRadius:10, padding:"10px 12px", fontWeight:900, cursor:"pointer" }}>{selectedAction.archived ? "Restore" : "Archive"}</button>
            </div>

            <div style={{ marginTop: 24 }}>
              <div style={{ fontWeight: 950, fontSize: 20 }}>Activity</div>
              {Array.isArray(selectedAction.comments) && selectedAction.comments.length > 0 ? selectedAction.comments.map((c, i) => (
                <div key={i} style={{ background: "#f9fafb", border: "1px solid #eaecf0", borderRadius: 12, padding: 12, marginTop: 10 }}>
                  <div style={{ color: "#667085", fontSize: 12, fontWeight: 800 }}>{c.author || "Hub"} · {apiDateTime(c.date)}</div>
                  <div style={{ marginTop: 6, color: "#344054", lineHeight: 1.5 }}>{c.text}</div>
                </div>
              )) : <div style={{ color: "#667085", marginTop: 10 }}>No comments yet.</div>}

              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <input value={noteText[selectedAction.id] || ""} onChange={(e) => setNoteText({ ...noteText, [selectedAction.id]:e.target.value })} placeholder="Add comment..." style={inputStyle} />
                <button onClick={() => addNote(selectedAction)} style={{ background:"#579bfc", color:"#fff", border:"none", borderRadius:10, padding:"0 14px", fontWeight:900, cursor:"pointer" }}>Add</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DrawerInfo({ label, value }) {
  return (
    <div style={{ background: "#f9fafb", border: "1px solid #eaecf0", borderRadius: 12, padding: 12 }}>
      <div style={{ color: "#667085", fontWeight: 900, fontSize: 12, textTransform: "uppercase" }}>{label}</div>
      <div style={{ marginTop: 6, fontWeight: 950, color: "#101828" }}>{value}</div>
    </div>
  );
}