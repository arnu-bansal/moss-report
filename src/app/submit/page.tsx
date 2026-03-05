"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SubmitPage() {
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit() {
    if (!code.trim()) { setError("Please paste your code first."); return; }
    setSubmitting(true);
    setError("");
    const res = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: "project-1", code }),
    });
    const d = await res.json();
    if (d.error) { setError(d.error); setSubmitting(false); return; }
    setSuccess(true);
    setSubmitting(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#050505", color: "#d4d4d4", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ borderBottom: "1px solid #1a1a1a", padding: "14px 24px", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 28, height: 28, borderRadius: 6, background: "linear-gradient(135deg,#ef4444,#f97316)", display: "flex", alignItems: "center", justifyContent: "center" }}>?</div>
        <span style={{ fontWeight: 700, fontSize: 15, color: "#f5f5f5" }}>CodeScan</span>
        <span style={{ color: "#3f3f46" }}>/</span>
        <span style={{ fontSize: 13, color: "#71717a" }}>Submit Code</span>
        <button onClick={() => router.push("/")} style={{ marginLeft: "auto", fontSize: 12, padding: "5px 12px", borderRadius: 6, border: "1px solid #2a2a2a", background: "transparent", color: "#71717a", cursor: "pointer" }}>? Back</button>
      </div>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 20px" }}>
        {success ? (
          <div style={{ background: "#0a0f0a", border: "1px solid #16a34a55", borderRadius: 12, padding: "32px", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>?</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#86efac", marginBottom: 8 }}>Submitted Successfully!</div>
            <div style={{ fontSize: 13, color: "#4a7c59", marginBottom: 24 }}>Your code has been saved. Wait for the admin to run MOSS analysis.</div>
            <button onClick={() => router.push("/report")} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#ef4444,#f97316)", color: "#fff", fontWeight: 700, cursor: "pointer" }}>View My Report</button>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#f5f5f5", marginBottom: 4 }}>Submit Your Code</div>
            <div style={{ fontSize: 13, color: "#71717a", marginBottom: 24 }}>Paste your code below. Each submission creates a new version.</div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste your code here..."
              style={{ width: "100%", height: 400, background: "#080808", border: "1px solid #1e1e1e", borderRadius: 10, padding: "16px", color: "#d4d4d4", fontFamily: "monospace", fontSize: 13, resize: "vertical", outline: "none" }}
            />
            {error && <div style={{ fontSize: 12, color: "#ef4444", marginTop: 8 }}>{error}</div>}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{ marginTop: 16, padding: "12px 32px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#ef4444,#f97316)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: submitting ? "not-allowed" : "pointer" }}
            >
              {submitting ? "Submitting..." : "Submit Code"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
