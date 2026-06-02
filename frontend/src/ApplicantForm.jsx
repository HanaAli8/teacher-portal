import { useState } from "react";
const API = "https://imanschools.edu.lb/api";

const SUBJECTS = [
  "Mathematics", "Physics", "Chemistry", "Biology", "English",
  "Arabic", "French", "History", "Geography", "Computer Science",
  "Art", "Music", "Physical Education", "Philosophy", "Economics",
];

const GRADES = [
  "KG1", "KG2",
  "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6",
  "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12",
];

function Toggle({ label, checked, onChange }) {
  return (
    <button type="button" onClick={onChange} style={{
      padding: "6px 14px", borderRadius: 20, fontSize: "0.8rem",
      border: checked ? "none" : "1.5px solid var(--border)",
      background: checked ? "var(--ink)" : "#fff",
      color: checked ? "#fff" : "var(--ink-light)",
      cursor: "pointer", fontFamily: "var(--ff-body)", fontWeight: 500,
      transition: "all 0.15s",
    }}>
      {label}
    </button>
  );
}

function RequiredMark() {
  return <span style={styles.requiredMark}>*</span>;
}

export default function ApplicantForm({ onLogout }) {
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", date_of_birth: "",
    subjects: [], grade_levels: [],
  });
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function set(field, val) { setForm((f) => ({ ...f, [field]: val })); }

  function toggleArr(field, val) {
    setForm((f) => ({
      ...f,
      [field]: f[field].includes(val) ? f[field].filter((x) => x !== val) : [...f[field], val],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    setErrorMsg("");
    if (!form.date_of_birth) return setErrorMsg("Date of birth is required.");
    if (form.subjects.length === 0) return setErrorMsg("Please select at least one subject.");
    setStatus("loading");
    try {
      const res = await fetch(`${API}/applicants.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      setStatus("success");
    } catch (err) {
      setErrorMsg(err.message);
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div style={styles.page}>
        <div style={styles.successCard} className="fade-up">
          <div style={styles.successIcon}>✓</div>
          <h2 style={styles.successTitle}>Application Submitted!</h2>
          <p style={styles.successText}>
            Thank you, <strong>{form.full_name}</strong>. Your application has been received.
          </p>
          <button className="btn btn-outline" onClick={onLogout} style={{ marginTop: 24 }}>Sign Out</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header} className="fade-up">
          <div>
            <div style={styles.logoRow}>
              <span style={styles.logoMark}>✦</span>
              <span style={styles.brand}>TeachConnect</span>
            </div>
            <h1 style={styles.title}>Teacher Application</h1>
            <p style={styles.subtitle}>Fill in your details to apply for a teaching position</p>
          </div>
          <button className="btn btn-outline" onClick={onLogout}>Sign Out</button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.section} className="fade-up-2">
            <h3 style={styles.sectionTitle}><span style={styles.sectionNum}>01</span> Personal Information</h3>
            <div style={styles.grid2}>
              <div>
                <label>Full Name <RequiredMark /></label>
                <input className="input" required value={form.full_name} onChange={(e) => set("full_name", e.target.value)} placeholder="Your full name" />
              </div>
              <div>
                <label>Date of Birth <RequiredMark /></label>
                <input className="input" type="date" required value={form.date_of_birth} onChange={(e) => set("date_of_birth", e.target.value)} />
              </div>
              <div>
                <label>Email Address <RequiredMark /></label>
                <input className="input" type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@email.com" />
              </div>
              <div>
                <label>Phone Number <RequiredMark /></label>
                <input className="input" type="tel" required value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+961 ..." />
              </div>
            </div>
          </div>

          <div style={styles.section} className="fade-up-3">
           <h3 style={styles.sectionTitle}><span style={styles.sectionNum}>02</span> Teaching Subjects <RequiredMark /></h3>
            <p style={styles.sectionHint}>Select all subjects you can teach</p>
            <div style={styles.toggleGrid}>
              {SUBJECTS.map((s) => <Toggle key={s} label={s} checked={form.subjects.includes(s)} onChange={() => toggleArr("subjects", s)} />)}
            </div>
          </div>

          <div style={styles.section} className="fade-up-3">
            <h3 style={styles.sectionTitle}><span style={styles.sectionNum}>03</span> Grade Levels</h3>
            <p style={styles.sectionHint}>Select all grade levels you are comfortable teaching</p>
            <div style={styles.toggleGrid}>
              {GRADES.map((g) => <Toggle key={g} label={g} checked={form.grade_levels.includes(g)} onChange={() => toggleArr("grade_levels", g)} />)}
            </div>
          </div>

         {(status === "error" || errorMsg) && <div style={styles.errorBox}>{errorMsg}</div>}

          <div style={styles.submitRow}>
            <button type="submit" className="btn btn-gold" style={{ padding: "13px 36px", fontSize: "0.95rem" }} disabled={status === "loading"}>
              {status === "loading" ? <span className="spinner" /> : "Submit Application →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", background: "var(--paper)", display: "flex", justifyContent: "center", padding: "40px 20px" },
  container: { width: "100%", maxWidth: 780 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 40 },
  logoRow: { display: "flex", alignItems: "center", gap: 8, marginBottom: 8 },
  logoMark: { color: "var(--gold)", fontSize: 18 },
  brand: { fontFamily: "var(--ff-display)", fontSize: "1rem", fontWeight: 600, color: "var(--ink-light)" },
  title: { fontFamily: "var(--ff-display)", fontSize: "2.2rem", fontWeight: 600, marginBottom: 4 },
  subtitle: { color: "var(--ink-light)", fontSize: "0.9rem" },
  form: { display: "flex", flexDirection: "column", gap: 28 },
  section: { background: "#fff", borderRadius: 14, padding: "28px 30px", boxShadow: "var(--shadow)" },
  sectionTitle: { fontFamily: "var(--ff-display)", fontSize: "1.15rem", fontWeight: 600, marginBottom: 6, display: "flex", alignItems: "center", gap: 12 },
  sectionNum: { color: "var(--gold)", fontSize: "0.75rem", fontFamily: "var(--ff-body)", fontWeight: 700, letterSpacing: "0.08em" },
  requiredMark: { color: "var(--red)" },
  sectionHint: { color: "var(--ink-light)", fontSize: "0.82rem", marginBottom: 16 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 18 },
  toggleGrid: { display: "flex", flexWrap: "wrap", gap: 8 },
  errorBox: { background: "var(--red-light)", color: "var(--red)", padding: "12px 16px", borderRadius: 8, fontSize: "0.88rem" },
  submitRow: { display: "flex", justifyContent: "flex-end", paddingBottom: 40 },
  successCard: { margin: "auto", textAlign: "center", background: "#fff", borderRadius: 16, padding: "60px 48px", maxWidth: 460, boxShadow: "var(--shadow-lg)" },
  successIcon: { width: 64, height: 64, borderRadius: "50%", background: "var(--green-light)", color: "var(--green)", fontSize: "1.8rem", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" },
  successTitle: { fontFamily: "var(--ff-display)", fontSize: "1.8rem", fontWeight: 600, marginBottom: 12 },
  successText: { color: "var(--ink-light)", lineHeight: 1.7 },
};
