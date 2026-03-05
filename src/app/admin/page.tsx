"use client";
import { useState, useEffect } from "react";

export default function AdminPage() {
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [privacy, setPrivacy] = useState({
    revealIdentity: false,
    allowSnippet: false,
  });

  useEffect(() => {
    fetch("/api/admin/moss-runs")
      .then((r) => r.json())
      .then((d) => { setRuns(d.runs || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function triggerMoss() {
    setRunning(true);
    const res = await fetch("/api/admin/run-moss", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: "project-1" }),
    });
    const d = await res.json();
    if (d.run) setRuns((prev) => [d.run, ...prev]);
    setRunning(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#050505", color: "#d4d4d4", fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid #1a1a1a", padding: "14px 24px", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 28, height: 28, borderRadius: 6, background: "linear-gradient(135deg,#6366f1,#a855f7)", display: "flex", alignItems: "center", justifyContent: "center" }}>⚙</div>
        <span style={{ fontWeight: 700, fontSize: 15, color: "#f5f5f5" }}>CodeScan Admin</span>
        <span style={{ marginLeft: "auto", fontSize: 10, background: "#1e1b4b", color: "#818cf8", padding: "3px 10px", borderRadius: 99 }}>ADMIN</span>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 20px" }}>

        {/* Run MOSS */}
        <div style={{ background: "#0a0a14", border: "1px solid #1e1e3a", borderRadius: 12, padding: "24px", marginBottom: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#818cf8", marginBottom: 8 }}>▶ Run MOSS Analysis</div>
          <div style={{ fontSize: 12, color: "#4f4f6a", marginBottom: 16 }}>Triggers a new MOSS plagiarism check for project-1. A snapshot of current submissions will be taken.</div>
          <button
            onClick={triggerMoss}
            disabled={running}
            style={{ padding: "12px 28px", borderRadius: 8, border: "1px solid #4f46e5", background: running ? "#1e1b4b" : "linear-gradient(135deg,#1e1b4b,#312e81)", color: running ? "#6366f1" : "#c7d2fe", fontWeight: 700, fontSize: 13, cursor: running ? "not-allowed" : "pointer" }}
          >
            {running ? "Running..." : "Run MOSS Now"}
          </button>
        </div>

        {/* Privacy Settings */}
        <div style={{ background: "#0a0a14", border: "1px solid #1e1e3a", borderRadius: 12, padding: "24px", marginBottom: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#818cf8", marginBottom: 16 }}>🔒 Privacy Settings</div>
          {[
            { key: "revealIdentity", label: "Reveal counterpart identity to students" },
            { key: "allowSnippet", label: "Allow showing counterpart code snippet (≤10 lines)" },
          ].map(({ key, label }) => (
            <label key={key} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, cursor: "pointer" }}>
              <div
                onClick={() => setPrivacy((p) => ({ ...p, [key]: !p[key as keyof typeof p] }))}
                style={{ width: 38, height: 22, borderRadius: 99, background: privacy[key as keyof typeof privacy] ? "#4f46e5" : "#262626", position: "relative", transition: "background 0.2s", flexShrink: 0 }}
              >
                <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: privacy[key as keyof typeof privacy] ? 19 : 3, transition: "left 0.2s" }} />
              </div>
              <span style={{ fontSize: 13, color: "#a5b4fc" }}>{label}</span>
            </label>
          ))}
        </div>

        {/* Run History */}
        <div style={{ background: "#0a0a14", border: "1px solid #1e1e3a", borderRadius: 12, padding: "24px" }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#818cf8", marginBottom: 16 }}>📋 Run History</div>
          {loading ? (
            <div style={{ fontSize: 13, color: "#4f4f6a" }}>Loading...</div>
          ) : runs.length === 0 ? (
            <div style={{ fontSize: 13, color: "#4f4f6a" }}>No runs yet.</div>
          ) : (
            runs.map((r: any) => (
              <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "#0d0d1a", borderRadius: 8, marginBottom: 8, border: "1px solid #1e1e3a" }}>
                <span style={{ width: 8, he