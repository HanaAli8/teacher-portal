import { useState } from "react";
import LoginPage from "./LoginPage";
import ApplicantForm from "./ApplicantForm";
import SchoolDashboard from "./SchoolDashboard";

export default function App() {
  const [role, setRole] = useState(null);

  function handleLogin(r) { setRole(r); }
  function handleLogout() { setRole(null); }

  if (!role) return <LoginPage onLogin={handleLogin} />;
  if (role === "applicant") return <ApplicantForm onLogout={handleLogout} />;
  if (role === "school") return <SchoolDashboard onLogout={handleLogout} />;
}