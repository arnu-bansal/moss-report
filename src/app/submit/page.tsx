"use client";
import { useState } from "react";

export default function SubmitPage() {
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!code.trim()) {
      setError("Please paste your code before submitting.");
      return;
    }
    setSubmitting(true);
    setError("");
    const res = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, projectId: "project-1", userId: "student-1" }),
    });
    const d = await res.json();
    if (d.version) {
      setSuccess(true);
    } else {
      setError(d.error || "Submission failed.");
    }
    setSubmitting(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#050505", color: "#d4d4d4", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ borderBottom: "1px solid #1a1a1a", padding: "14px 24px", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 28, height: 28, borderRadius: 6, background: "linear-gradient(135deg,#ef4444,#f97316)", display: "flex", alignItems: "center", justifyContent: "center" }}>⚡</div>
        <span style={{ fontWeight: 700, fontSize: 15, color: "#f5f5f5" }}>CodeScan</span>
        <span style={{ color: "#3f3f46" }}>/</span>
        <span style={{ fontSize: 13, color: "#71717a" }}>Submit Code</span>
        <a href="/" style={{ marginLeft: "auto", fontSize: 12, color: "#71717a", textDecoration: "none" }}>← My Report</a>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 20px" }}>
        {success ? (
          <div style={{ background: "#0a0f0a", border: "1px solid #16a34a55", borderRadius: 12, padding: "40px", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#86efac", marginBottom: 8 }}>Submission Successful!</div>
            <div style={{ fontSize: 13, color: "#4a7c59", marginBottom: 24 }}>Your code has been saved. Check your similarity report after the next MOSS run.</div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <a href="/" style={{ padding: "10px 24px", borderRadius: 8, background: "#052e16", border: "1px solid #16a34a", color: "#86efac", fontSize: 13, textDecoration: "none" }}>View My Report</a>
              <button onClick={() => { setSuccess(false); setCode(""); }} style={{ padding: "10px 24px", borderRadius: 8, background: "#171717", border: "1px solid #2a2a2a", color: "#a3a3a3", fontSize: 13, cursor: "pointer" }}>Submit Again</button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#f5f5f5", marginBottom: 6 }}>Submit Your Code</div>
              <div style={{ fontSize: 13, color: "#52525b" }}>CS101 — Assignment 3. Paste your code below and click Submit.</div>
            </div>

            <div style={{ background: "#0f0f0f", border: "1px solid #1e1e1e", borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
              <div style={{ padding: "10px 16px", borderBottom: "1px solid #1a1a1a", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, color: "#52525b" }}>Your code</span>
                <span style={{ marginLeft: "auto", fontSize: 11, color: "#3f3f46" }}>{code.split("\n").length} lines</span>
              </div>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Paste your code here..."
                style={{
                  width: "100%", minHeight: 400, background: "#080808", border: "none", outline: "none",
                  color: "#d4d4d4", fontFamily: "monospace", fontSize: 13, lineHeight: "1.7",
                  padding: "16px", resize: "vertical", boxSizing: "border-box",
                }}
              />
            </div>

            {error && (
              <div style={{ fontSize: 12, color: "#ef4444", marginBottom: 12, padding: "10px 14px", background: "#450a0a", borderRadius: 8 }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{ padding: "12px 32px", borderRadius: 8, border: "none", background: submitting ? "#1a1a1a" : "linear-gradient(135deg,#ef4444,#f97316)", color: submitting ? "#52525b" : "#fff", fontWeight: 700, fontSize: 14, cursor: submitting ? "not-allowed" : "pointer" }}
              >
                {submitting ? "Submitting..." : "Submit Code"}
              </button>
              <span style={{ fontSize: 11, color: "#3f3f46" }}>Your submission will be versioned automatically.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}