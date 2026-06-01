require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

// LOGIN
app.post("/api/auth/login", async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: "Invite code required" });
  try {
    const result = await pool.query(
      "SELECT role FROM invite_codes WHERE code = $1",
      [code.trim()]
    );
    if (result.rows.length === 0)
      return res.status(401).json({ error: "Invalid invite code" });
    res.json({ role: result.rows[0].role });
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
    const result = await pool.query(
      `INSERT INTO teacher_applicants
         (full_name, email, phone, date_of_birth, subjects, grade_levels)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [full_name, email, phone || null, date_of_birth || null, subjects || [], grade_levels || []]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      if (err.detail.includes("email")) {
        return res.status(409).json({ error: "This email already has an application" });
      }
      if (err.detail.includes("phone")) {
        return res.status(409).json({ error: "This phone number already has an application" });
      }
    }
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET APPLICANTS (with filters)
app.get("/api/applicants", async (req, res) => {
  const { search, subject, grade, status, sort = "submitted_at", order = "desc" } = req.query;
  const conditions = [];
  const values = [];
  let i = 1;
  if (search) { conditions.push(`(full_name ILIKE $${i} OR email ILIKE $${i})`); values.push(`%${search}%`); i++; }
  if (subject) { conditions.push(`$${i} = ANY(subjects)`); values.push(subject); i++; }
  if (grade) { conditions.push(`$${i} = ANY(grade_levels)`); values.push(grade); i++; }
  if (status) { conditions.push(`status = $${i}`); values.push(status); i++; }
  if (req.query.minDob) { conditions.push(`date_of_birth >= $${i}`); values.push(req.query.minDob); i++; }
  if (req.query.maxDob) { conditions.push(`date_of_birth <= $${i}`); values.push(req.query.maxDob); i++; }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const safeSort = ["submitted_at", "full_name"].includes(sort) ? sort : "submitted_at";
  const safeOrder = order === "asc" ? "ASC" : "DESC";
  try {
    const result = await pool.query(
      `SELECT * FROM teacher_applicants ${where} ORDER BY ${safeSort} ${safeOrder}`,
      values
    );
    res.json(result.rows);
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
    const result = await pool.query(
      `UPDATE teacher_applicants SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Applicant not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET META (for filter dropdowns)
app.get("/api/meta", async (req, res) => {
  try {
    const [s, g] = await Promise.all([
      pool.query("SELECT DISTINCT UNNEST(subjects) AS val FROM teacher_applicants ORDER BY val"),
      pool.query("SELECT DISTINCT UNNEST(grade_levels) AS val FROM teacher_applicants ORDER BY val"),
    ]);
    res.json({ subjects: s.rows.map((r) => r.val), grade_levels: g.rows.map((r) => r.val) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ API running on http://localhost:${PORT}`));