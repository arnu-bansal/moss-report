"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSignup() {
    if (!name || !email || !password) { setError("All fields required"); return; }
    setLoading(true); setError("");
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const d = await res.json();
    if (d.error) { setError(d.error); setLoading(false); return; }
    router.push("/login?registered=1");
  }

  return (
    <div style={{ minHeight: "100vh", background: "#050505", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#0f0f0f", border: "1px solid #1e1e1e", borderRadius: 12, padding: "40px", width: 380 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: "linear-gradient(135deg,#ef4444,#f97316)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700 }}>C</div>
          <span style={{ fontWeight: 700, fontSize: 16, color: "#f5f5f5" }}>Create Account</span>
        </div>
        {[
          { label: "Full Name", value: name, set: setName, type: "text", placeholder: "John Doe" },
          { label: "Email", value: email, set: setEmail, type: "email", placeholder: "you@university.edu" },
          { label: "Password", value: password, set: setPassword, type: "password", placeholder: "••••••••" },
        ].map((f) => (
          <div key={f.label} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: "#71717a", marginBottom: 6 }}>{f.label}</div>
            <input type={f.type} value={f.value} onChange={(e) => f.set(e.target.value)} placeholder={f.placeholder}
              style={{ width: "100%", background: "#171717", border: "1px solid #2a2a2a", borderRadius: 8, padding: "10px 12px", color: "#f5f5f5", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
          </div>
        ))}
        {error && <div style={{ fontSize: 12, color: "#ef4444", marginBottom: 12 }}>{error}</div>}
        <button onClick={handleSignup} disabled={loading}
          style={{ width: "100%", padding: "12px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#ef4444,#f97316)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", marginBottom: 16 }}>
          {loading ? "Creating account..." : "Sign Up"}
        </button>
        <div style={{ fontSize: 12, color: "#52525b", textAlign: "center" }}>
          Already have an account? <a href="/login" style={{ color: "#f97316", textDecoration: "none" }}>Sign in</a>
        </div>
      </div>
    </div>
  );
}
