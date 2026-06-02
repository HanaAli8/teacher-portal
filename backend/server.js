require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

// LOGIN
app.post("/api/auth/login", async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: "Invite code required" });
  try {
    const [rows] = await pool.query(
      "SELECT role FROM invite_codes WHERE code = ?",
      [code.trim()]
    );
    if (rows.length === 0)
      return res.status(401).json({ error: "Invalid invite code" });
    res.json({ role: rows[0].role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// SUBMIT APPLICATION
app.post("/api/applicants", async (req, res) => {
  const { full_name, email, phone, date_of_birth, subjects, grade_levels } = req.body;
  if (!full_name || !email)
    return res.status(400).json({ error: "Name and email are required" });
  try {
    const [result] = await pool.query(
      `INSERT INTO teacher_applicants
         (full_name, email, phone, date_of_birth, subjects, grade_levels)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        full_name,
        email,
        phone || null,
        date_of_birth || null,
        JSON.stringify(subjects || []),
        JSON.stringify(grade_levels || []),
      ]
    );
    const [rows] = await pool.query("SELECT * FROM teacher_applicants WHERE id = ?", [result.insertId]);
    res.status(201).json(parseApplicant(rows[0]));
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      if (err.message.includes("email"))
        return res.status(409).json({ error: "This email already has an application" });
      if (err.message.includes("phone"))
        return res.status(409).json({ error: "This phone number already has an application" });
    }
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// helper to parse JSON arrays from MySQL
function parseApplicant(a) {
  if (!a) return a;
  function parseField(val) {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    try { return JSON.parse(val); } catch(e) { return val.split(",").map(s => s.trim()).filter(Boolean); }
  }
  return {
    ...a,
    subjects: parseField(a.subjects),
    grade_levels: parseField(a.grade_levels),
  };
}
// GET APPLICANTS (with filters)
app.get("/api/applicants", async (req, res) => {
  const { search, subject, grade, status, sort = "submitted_at", order = "desc", minDob, maxDob } = req.query;
  const conditions = [];
  const values = [];

  if (search) { conditions.push(`(full_name LIKE ? OR email LIKE ?)`); values.push(`%${search}%`, `%${search}%`); }
  if (subject) { conditions.push(`JSON_CONTAINS(subjects, JSON_QUOTE(?))`); values.push(subject); }
  if (grade) { conditions.push(`JSON_CONTAINS(grade_levels, JSON_QUOTE(?))`); values.push(grade); }
  if (status) { conditions.push(`status = ?`); values.push(status); }
  if (minDob) { conditions.push(`date_of_birth >= ?`); values.push(minDob); }
  if (maxDob) { conditions.push(`date_of_birth <= ?`); values.push(maxDob); }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const safeSort = ["submitted_at", "full_name"].includes(sort) ? sort : "submitted_at";
  const safeOrder = order === "asc" ? "ASC" : "DESC";

  try {
    const [rows] = await pool.query(
      `SELECT * FROM teacher_applicants ${where} ORDER BY ${safeSort} ${safeOrder}`,
      values
    );
    res.json(rows.map(parseApplicant));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// UPDATE STATUS
app.patch("/api/applicants/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const allowed = ["pending", "reviewed", "accepted", "rejected"];
  if (!allowed.includes(status))
    return res.status(400).json({ error: "Invalid status" });
  try {
    await pool.query(
      `UPDATE teacher_applicants SET status = ?, updated_at = NOW() WHERE id = ?`,
      [status, id]
    );
    const [rows] = await pool.query("SELECT * FROM teacher_applicants WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ error: "Applicant not found" });
    res.json(parseApplicant(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE APPLICANT
app.delete("/api/applicants/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query(
      "DELETE FROM teacher_applicants WHERE id = ?", [id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Applicant not found" });
    res.json({ deleted: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET META
app.get("/api/meta", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT subjects, grade_levels FROM teacher_applicants");
    const subjects = new Set();
    const grade_levels = new Set();
    rows.forEach((r) => {
      (JSON.parse(r.subjects || "[]")).forEach((s) => subjects.add(s));
      (JSON.parse(r.grade_levels || "[]")).forEach((g) => grade_levels.add(g));
    });
    res.json({ subjects: [...subjects].sort(), grade_levels: [...grade_levels].sort() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ API running on http://localhost:${PORT}`));