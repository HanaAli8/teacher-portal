import { useState, useEffect, useCallback } from "react";

const API = "https://ample-art-production-4160.up.railway.app/api";

const STATUS_COLORS = {
  pending:  "badge-pending",
  reviewed: "badge-reviewed",
  accepted: "badge-accepted",
  rejected: "badge-rejected",
};

function ApplicantRow({ applicant, onStatusChange }) {
  const [open, setOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const a = applicant;

  async function updateStatus(newStatus) {
    setUpdating(true);
    try {
      const res = await fetch(`${API}/applicants/${a.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) onStatusChange(a.id, newStatus);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <>
      <tr style={styles.tr} onClick={() => setOpen(!open)}>
        <td style={styles.td}>
          <div style={styles.nameCell}>
            <div style={styles.avatar}>{a.full_name.charAt(0).toUpperCase()}</div>
            <div>
              <div style={styles.nameText}>{a.full_name}</div>
              <div style={styles.emailText}>{a.email}</div>
            </div>
          </div>
        </td>
        <td style={styles.td}>{a.phone || "—"}</td>
        <td style={styles.td}>{a.date_of_birth ? new Date(a.date_of_birth).toLocaleDateString("en-GB") : "—"}</td>
        <td style={styles.td}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {(a.subjects || []).slice(0, 2).map((s) => <span key={s} className="tag">{s}</span>)}
            {(a.subjects || []).length > 2 && <span className="tag">+{a.subjects.length - 2}</span>}
          </div>
        </td>
        <td style={styles.td}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {(a.grade_levels || []).slice(0, 2).map((g) => <span key={g} className="tag">{g}</span>)}
            {(a.grade_levels || []).length > 2 && <span className="tag">+{a.grade_levels.length - 2}</span>}
          </div>
        </td>
        <td style={styles.td}><span className={`badge ${STATUS_COLORS[a.status]}`}>{a.status}</span></td>
        <td style={styles.td}>{new Date(a.submitted_at).toLocaleDateString("en-GB")}</td>
      </tr>

      {open && (
        <tr>
          <td colSpan={7} style={styles.expandedTd}>
            <div style={styles.expandedInner}>
              <div style={styles.expandedGrid}>
                <div>
                  <div style={styles.expandLabel}>All Subjects</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {(a.subjects || []).map((s) => <span key={s} className="tag">{s}</span>)}
                    {!a.subjects?.length && <span style={{ color: "var(--ink-light)", fontSize: "0.85rem" }}>None specified</span>}
                  </div>
                </div>
                <div>
                  <div style={styles.expandLabel}>All Grade Levels</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {(a.grade_levels || []).map((g) => <span key={g} className="tag">{g}</span>)}
                    {!a.grade_levels?.length && <span style={{ color: "var(--ink-light)", fontSize: "0.85rem" }}>None specified</span>}
                  </div>
                </div>
              </div>
              <div style={styles.actionRow}>
                <span style={{ fontSize: "0.82rem", color: "var(--ink-light)", fontWeight: 600 }}>Update Status:</span>
                {["pending", "reviewed", "accepted", "rejected"].map((s) => (
                  <button key={s} className={`btn btn-sm ${a.status === s ? "btn-primary" : "btn-outline"}`}
                    disabled={updating || a.status === s}
                    onClick={(e) => { e.stopPropagation(); updateStatus(s); }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function SchoolDashboard({ onLogout }) {
  const [applicants, setApplicants] = useState([]);
  const [meta, setMeta] = useState({ subjects: [], grade_levels: [] });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: "", subject: "", grade: "", status: "", sort: "submitted_at", order: "desc" });

  function setFilter(k, v) { setFilters((f) => ({ ...f, [k]: v })); }

  const fetchApplicants = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    try {
      const res = await fetch(`${API}/applicants?${params}`);
      const data = await res.json();
      setApplicants(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => {
    fetch(`${API}/meta`).then((r) => r.json()).then(setMeta).catch(console.error);
  }, []);

  useEffect(() => { fetchApplicants(); }, [fetchApplicants]);

  function handleStatusChange(id, newStatus) {
    setApplicants((prev) => prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a)));
  }

  const counts = {
    total: applicants.length,
    pending: applicants.filter((a) => a.status === "pending").length,
    accepted: applicants.filter((a) => a.status === "accepted").length,
  };

  return (
    <div style={styles.page}>
      <aside style={styles.sidebar}>
        <div style={styles.sidebarTop}>
          <div style={styles.logoMark}>✦</div>
          <div style={styles.brand}>TeachConnect</div>
          <div style={styles.schoolLabel}>School Portal</div>
        </div>
        <div style={styles.statsBox}>
          <div style={styles.stat}>
            <div style={styles.statNum}>{counts.total}</div>
            <div style={styles.statLabel}>Total Applicants</div>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.stat}>
            <div style={{ ...styles.statNum, color: "var(--gold)" }}>{counts.pending}</div>
            <div style={styles.statLabel}>Awaiting Review</div>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.stat}>
            <div style={{ ...styles.statNum, color: "var(--green)" }}>{counts.accepted}</div>
            <div style={styles.statLabel}>Accepted</div>
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <button className="btn btn-outline" style={{ width: "100%", justifyContent: "center", color: "#fff", borderColor: "rgba(255,255,255,0.2)" }} onClick={onLogout}>
          Sign Out
        </button>
      </aside>

      <main style={styles.main}>
        <div style={styles.mainHeader} className="fade-up">
          <h1 style={styles.title}>Teacher Applicants</h1>
          <p style={styles.subtitle}>Browse and filter all submitted applications. Click a row to expand details and update status.</p>
        </div>

        <div style={styles.filtersBar} className="fade-up-2">
          <input className="input" placeholder="🔍  Search by name or email…" style={{ maxWidth: 260 }} value={filters.search} onChange={(e) => setFilter("search", e.target.value)} />
          <select className="input" style={{ maxWidth: 180 }} value={filters.subject} onChange={(e) => setFilter("subject", e.target.value)}>
            <option value="">All Subjects</option>
            {meta.subjects.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select className="input" style={{ maxWidth: 180 }} value={filters.grade} onChange={(e) => setFilter("grade", e.target.value)}>
            <option value="">All Grades</option>
            {meta.grade_levels.map((g) => <option key={g}>{g}</option>)}
          </select>
          <select className="input" style={{ maxWidth: 160 }} value={filters.status} onChange={(e) => setFilter("status", e.target.value)}>
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
          <select className="input" style={{ maxWidth: 180 }} value={`${filters.sort}-${filters.order}`}
            onChange={(e) => { const [sort, order] = e.target.value.split("-"); setFilter("sort", sort); setFilter("order", order); }}>
            <option value="submitted_at-desc">Newest First</option>
            <option value="submitted_at-asc">Oldest First</option>
            <option value="full_name-asc">Name A–Z</option>
            <option value="full_name-desc">Name Z–A</option>
          </select>
        </div>

        <div style={styles.tableWrap} className="fade-up-3">
          {loading ? (
            <div style={styles.loadingBox}>
              <div className="spinner" style={{ borderTopColor: "var(--gold)", borderColor: "var(--cream)" }} />
              <span style={{ color: "var(--ink-light)" }}>Loading applicants…</span>
            </div>
          ) : applicants.length === 0 ? (
            <div style={styles.emptyBox}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
              <div style={{ fontFamily: "var(--ff-display)", fontSize: "1.1rem" }}>No applicants found</div>
              <div style={{ color: "var(--ink-light)", fontSize: "0.85rem", marginTop: 6 }}>Try adjusting your filters</div>
            </div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  {["Applicant", "Phone", "Date of Birth", "Subjects", "Grades", "Status", "Applied"].map((h) => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {applicants.map((a) => <ApplicantRow key={a.id} applicant={a} onStatusChange={handleStatusChange} />)}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}

const styles = {
  page: { display: "flex", minHeight: "100vh" },
  sidebar: { width: 220, background: "var(--ink)", color: "#fff", display: "flex", flexDirection: "column", padding: "32px 20px", flexShrink: 0 },
  sidebarTop: { marginBottom: 32 },
  logoMark: { color: "var(--gold)", fontSize: 20, marginBottom: 8 },
  brand: { fontFamily: "var(--ff-display)", fontSize: "1.3rem", fontWeight: 600 },
  schoolLabel: { fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", marginTop: 2, textTransform: "uppercase", letterSpacing: "0.08em" },
  statsBox: { background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "18px 16px", display: "flex", flexDirection: "column", marginBottom: 24 },
  stat: { padding: "10px 0", textAlign: "center" },
  statNum: { fontFamily: "var(--ff-display)", fontSize: "1.8rem", fontWeight: 600, lineHeight: 1 },
  statLabel: { fontSize: "0.72rem", color: "rgba(255,255,255,0.45)", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.06em" },
  statDivider: { height: 1, background: "rgba(255,255,255,0.08)" },
  main: { flex: 1, padding: "36px 40px", overflow: "auto" },
  mainHeader: { marginBottom: 24 },
  title: { fontFamily: "var(--ff-display)", fontSize: "2rem", fontWeight: 600, marginBottom: 4 },
  subtitle: { color: "var(--ink-light)", fontSize: "0.88rem", maxWidth: 540 },
  filtersBar: { display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 24, background: "#fff", padding: "16px 18px", borderRadius: 12, boxShadow: "var(--shadow)" },
  tableWrap: { background: "#fff", borderRadius: 14, boxShadow: "var(--shadow)", overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { padding: "13px 16px", textAlign: "left", fontSize: "0.72rem", fontWeight: 700, color: "var(--ink-light)", letterSpacing: "0.06em", textTransform: "uppercase", background: "var(--cream)", borderBottom: "1px solid var(--border)" },
  tr: { borderBottom: "1px solid var(--border)", cursor: "pointer", transition: "background 0.15s" },
  td: { padding: "14px 16px", fontSize: "0.86rem", verticalAlign: "middle" },
  nameCell: { display: "flex", alignItems: "center", gap: 12 },
  avatar: { width: 36, height: 36, borderRadius: "50%", background: "var(--ink)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.85rem", flexShrink: 0 },
  nameText: { fontWeight: 600, fontSize: "0.88rem" },
  emailText: { fontSize: "0.76rem", color: "var(--ink-light)", marginTop: 2 },
  expandedTd: { background: "var(--cream)", padding: 0 },
  expandedInner: { padding: "18px 24px 18px 64px" },
  expandedGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 16 },
  expandLabel: { fontSize: "0.72rem", fontWeight: 700, color: "var(--ink-light)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 },
  actionRow: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
  loadingBox: { display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "60px 0" },
  emptyBox: { padding: "60px 0", textAlign: "center" },
};