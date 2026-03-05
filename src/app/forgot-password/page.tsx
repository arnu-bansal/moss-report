"use client";
import { useState } from "react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!email) { setError("Enter your email"); return; }
    setLoading(true); setError("");
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const d = await res.json();
    if (d.error) { setError(d.error); setLoading(false); return; }
    setSent(true); setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#050505", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#0f0f0f", border: "1px solid #1e1e1e", borderRadius: 12, padding: "40px", width: 380 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: "linear-gradient(135deg,#ef4444,#f97316)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700 }}>C</div>
          <span style={{ fontWeight: 700, fontSize: 16, color: "#f5f5f5" }}>Reset Password</span>
        </div>
        {sent ? (
          <div style={{ fontSize: 13, color: "#86efac", background: "#052e16", border: "1px solid #16a34a44", borderRadius: 8, padding: "16px", textAlign: "center" }}>
            Check your email for a reset link!<br />
            <a href="/login" style={{ color: "#f97316", fontSize: 12, marginTop: 12, display: "inline-block" }}>Back to login</a>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 13, color: "#71717a", marginBottom: 20 }}>Enter your email and we will send you a reset link.</div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "#71717a", marginBottom: 6 }}>Email</div>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@university.edu"
                style={{ width: "100%", background: "#171717", border: "1px solid #2a2a2a", borderRadius: 8, padding: "10px 12px", color: "#f5f5f5", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
            </div>
            {error && <div style={{ fontSize: 12, color: "#ef4444", marginBottom: 12 }}>{error}</div>}
            <button onClick={handleSubmit} disabled={loading}
              style={{ width: "100%", padding: "12px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#ef4444,#f97316)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", marginBottom: 16 }}>
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
            <div style={{ textAlign: "center" }}>
              <a href="/login" style={{ fontSize: 12, color: "#71717a", textDecoration: "none" }}>Back to login</a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
