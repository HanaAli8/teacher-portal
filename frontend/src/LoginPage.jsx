import { useState } from "react";
import logoFull from "./assets/logo-full.png";
const API = "https://imanschools.edu.lb/api";

export default function LoginPage({ onLogin }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/login.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid code");
      onLogin(data.role);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.left}>
        <div style={styles.leftInner}>
          <div style={styles.logoWrap}>
            <img src={logoFull} alt="Iman Islamic Schools" style={styles.logoImg} />
          </div>
          <div style={styles.decorLine} />
          <div style={styles.roles}>
            <div style={styles.roleCard}>
              <span style={styles.roleIcon}>🎓</span>
              <div>
                <div style={styles.roleTitle}>For Applicants</div>
                <div style={styles.roleDesc}>Submit your profile and teaching preferences</div>
              </div>
            </div>
            <div style={styles.roleCard}>
              <span style={styles.roleIcon}>🏫</span>
              <div>
                <div style={styles.roleTitle}>For Schools</div>
                <div style={styles.roleDesc}>Browse and filter qualified teacher candidates</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.right}>
        <div style={styles.card} className="fade-up">
          <h2 style={styles.cardTitle}>Welcome back</h2>
          <p style={styles.cardSub}>Enter your invite code to continue</p>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div>
              <label>Invite Code</label>
              <input
                className="input"
                type="text"
                placeholder="e.g. TEACH"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoFocus
              />
            </div>
            {error && <div style={styles.errorBox}>{error}</div>}
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center", padding: "13px" }}
              disabled={loading || !code.trim()}
            >
              {loading ? <span className="spinner" /> : "Sign In →"}
            </button>
          </form>
          <p style={styles.hint}>Contact your administrator if you need an invite code.</p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { display: "flex", minHeight: "100vh" },
  left: { flex: "0 0 480px", background: "var(--ink)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 48px" },
  leftInner: { maxWidth: 340 },
  logoWrap: { background: "#fff", borderRadius: 14, padding: "16px 20px", marginBottom: 28, display: "inline-block" },
  logoImg: { width: 200, display: "block" },
  decorLine: { width: 48, height: 2, background: "var(--gold)", marginBottom: 32 },
  roles: { display: "flex", flexDirection: "column", gap: 16 },
  roleCard: { display: "flex", alignItems: "flex-start", gap: 14, padding: "16px 18px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" },
  roleIcon: { fontSize: 22, marginTop: 2 },
  roleTitle: { fontWeight: 600, fontSize: "0.9rem", marginBottom: 2 },
  roleDesc: { fontSize: "0.78rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.5 },
  right: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 40px", background: "var(--paper)" },
  card: { width: "100%", maxWidth: 400, background: "#fff", borderRadius: 16, padding: "40px 36px", boxShadow: "var(--shadow-lg)" },
  cardTitle: { fontFamily: "var(--ff-display)", fontSize: "1.8rem", fontWeight: 600, marginBottom: 6 },
  cardSub: { color: "var(--ink-light)", fontSize: "0.9rem", marginBottom: 28 },
  form: { display: "flex", flexDirection: "column", gap: 20 },
  errorBox: { background: "var(--red-light)", color: "var(--red)", padding: "10px 14px", borderRadius: 8, fontSize: "0.85rem" },
  hint: { marginTop: 20, fontSize: "0.78rem", color: "#aaa", textAlign: "center" },
};