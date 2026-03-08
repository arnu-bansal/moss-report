"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";

const LANG_EXT: Record<string, string> = {
  java: ".java", c: ".c", cpp: ".cpp", python: ".py",
  javascript: ".js", typescript: ".ts", txt: ".txt"
};

const AI_MODELS = ["ChatGPT", "Claude", "Gemini", "Copilot", "DeepSeek"];

export default function ProjectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const [project, setProject] = useState<any>(null);
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [runningMoss, setRunningMoss] = useState(false);
  const [submitDone, setSubmitDone] = useState(false);
  const [mossStatus, setMossStatus] = useState("");
  const [runs, setRuns] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [aiModel, setAiModel] = useState("ChatGPT");
  const [aiCode, setAiCode] = useState("");
  const [aiSubmitting, setAiSubmitting] = useState(false);
  const [aiDone, setAiDone] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiSubmissions, setAiSubmissions] = useState<any[]>([]);
  const [showAiPanel, setShowAiPanel] = useState(false);

  const isAdmin = (session?.user as any)?.role === "admin";

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status]);

  useEffect(() => {
    if (!projectId) return;
    fetch("/api/projects/" + projectId + "/info").then(r => r.json()).then(d => setProject(d.project));
    fetch("/api/projects/" + projectId + "/runs").then(r => r.json()).then(d => setRuns(d.runs || []));
    fetch("/api/projects/" + projectId + "/ai-submit").then(r => r.json()).then(d => setAiSubmissions(d.aiSubmissions || []));
  }, [projectId]);

  async function handleSubmit() {
    if (!code.trim()) { setError("Paste your code first"); return; }
    setSubmitting(true); setError("");
    const userId = (session?.user as any)?.id;
    const res = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, code, userId, filename: "submission" + (LANG_EXT[project?.language || "java"] || ".java") }),
    });
    const d = await res.json();
    if (d.error) { setError(d.error); setSubmitting(false); return; }
    setSubmitDone(true); setSubmitting(false);
  }

  async function handleAiSubmit() {
    if (!aiCode.trim()) { setAiError("Paste AI code first"); return; }
    setAiSubmitting(true); setAiError("");
    const res = await fetch("/api/projects/" + projectId + "/ai-submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: aiCode, aiModel, adminUserId: (session?.user as any)?.id }),
    });
    const d = await res.json();
    if (d.error) { setAiError(d.error); setAiSubmitting(false); return; }
    setAiDone(true); setAiSubmitting(false);
    setAiCode("");
    // Refresh AI submissions
    fetch("/api/projects/" + projectId + "/ai-submit").then(r => r.json()).then(d => setAiSubmissions(d.aiSubmissions || []));
    setTimeout(() => setAiDone(false), 3000);
  }

  async function handleRunMoss() {
    setRunningMoss(true); setMossStatus("Queued...");
    const res = await fetch("/api/projects/" + projectId + "/run-moss", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: (session?.user as any)?.id }),
    });
    const d = await res.json();
    if (d.error) { setMossStatus("Error: " + d.error); setRunningMoss(false); return; }
    setMossStatus("MOSS is running... results appear in ~30 seconds.");
    const poll = setInterval(async () => {
      const r = await fetch("/api/projects/" + projectId + "/runs");
      const rd = await r.json();
      const latest = rd.runs?.[0];
      if (latest?.status === "COMPLETED") {
        setRuns(rd.runs); setMossStatus("Done! View your report."); setRunningMoss(false); clearInterval(poll);
      } else if (latest?.status === "FAILED") {
        setMossStatus("MOSS run failed."); setRunningMoss(false); clearInterval(poll);
      }
    }, 1000);
  }

  if (!project) return (
    <div style={{ minHeight: "100vh", background: "#050505", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#71717a" }}>Loading...</div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#050505", color: "#d4d4d4", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ borderBottom: "1px solid #1a1a1a", padding: "14px 24px", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 28, height: 28, borderRadius: 6, background: "linear-gradient(135deg,#ef4444,#f97316)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700 }}>C</div>
        <span style={{ fontWeight: 700, fontSize: 15, color: "#f5f5f5", cursor: "pointer" }} onClick={() => router.push("/projects")}>CodeScan</span>
        <span style={{ color: "#3f3f46" }}>/</span>
        <span style={{ fontSize: 13, color: "#71717a" }}>{project.name}</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button onClick={() => router.push("/projects/" + projectId + "/report")}
            style={{ fontSize: 12, padding: "6px 14px", borderRadius: 6, border: "1px solid #ef444444", background: "transparent", color: "#fca5a5", cursor: "pointer" }}>View Report</button>
          <button onClick={() => router.push("/projects")}
            style={{ fontSize: 12, padding: "6px 14px", borderRadius: 6, border: "1px solid #2a2a2a", background: "transparent", color: "#71717a", cursor: "pointer" }}>Back</button>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px", display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>
        <div>
          {/* Student code submit */}
          <div style={{ background: "#0f0f0f", border: "1px solid #1e1e1e", borderRadius: 12, padding: "24px", marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#f5f5f5", marginBottom: 4 }}>
              {isAdmin ? "Submit Code (as Admin)" : "Submit Your Code"}
            </div>
            <div style={{ fontSize: 12, color: "#52525b", marginBottom: 16 }}>Language: <span style={{ color: "#71717a" }}>{project.language}</span></div>
            {submitDone ? (
              <div style={{ background: "#0a0f0a", border: "1px solid #16a34a44", borderRadius: 10, padding: "20px", textAlign: "center" }}>
                <div style={{ fontSize: 14, color: "#86efac", fontWeight: 700, marginBottom: 8 }}>Submitted!</div>
                <button onClick={() => { setSubmitDone(false); setCode(""); }}
                  style={{ fontSize: 12, padding: "6px 16px", borderRadius: 6, border: "1px solid #16a34a44", background: "transparent", color: "#86efac", cursor: "pointer" }}>Submit Another Version</button>
              </div>
            ) : (
              <>
                <textarea value={code} onChange={e => setCode(e.target.value)} placeholder={"Paste your " + project.language + " code here..."}
                  style={{ width: "100%", height: 300, background: "#080808", border: "1px solid #1e1e1e", borderRadius: 10, padding: "16px", color: "#d4d4d4", fontFamily: "monospace", fontSize: 13, resize: "vertical", outline: "none", boxSizing: "border-box" }} />
                {error && <div style={{ fontSize: 12, color: "#ef4444", marginTop: 8 }}>{error}</div>}
                <button onClick={handleSubmit} disabled={submitting}
                  style={{ marginTop: 12, padding: "10px 28px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#ef4444,#f97316)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: submitting ? "not-allowed" : "pointer" }}>
                  {submitting ? "Submitting..." : "Submit Code"}
                </button>
              </>
            )}
          </div>

          {/* AI Reference Code Panel - Admin Only */}
          {isAdmin && (
            <div style={{ background: "#0f0f0f", border: "1px solid #7c3aed44", borderRadius: 12, padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#f5f5f5" }}>AI Reference Submissions</div>
                  <div style={{ fontSize: 12, color: "#52525b", marginTop: 2 }}>Submit AI-generated code to compare against students</div>
                </div>
                <button onClick={() => setShowAiPanel(!showAiPanel)}
                  style={{ fontSize: 12, padding: "6px 14px", borderRadius: 6, border: "1px solid #7c3aed44", background: showAiPanel ? "#1a0a2e" : "transparent", color: "#a78bfa", cursor: "pointer" }}>
                  {showAiPanel ? "Hide" : "+ Add AI Code"}
                </button>
              </div>

              {/* Existing AI submissions */}
              {aiSubmissions.length > 0 && (
                <div style={{ marginBottom: showAiPanel ? 16 : 0 }}>
                  {aiSubmissions.map((s: any) => (
                    <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#171717", border: "1px solid #2a2a2a", borderRadius: 8, marginBottom: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 6, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff", fontWeight: 700 }}>AI</div>
                      <div>
                        <div style={{ fontSize: 13, color: "#f5f5f5", fontWeight: 600 }}>{s.user.name}</div>
                        <div style={{ fontSize: 11, color: "#52525b" }}>v{s.versions[0]?.versionNumber || 1} · {s.versions[0]?.filename}</div>
                      </div>
                      <span style={{ marginLeft: "auto", fontSize: 10, padding: "2px 8px", borderRadius: 99, background: "#1a0a2e", border: "1px solid #7c3aed44", color: "#a78bfa" }}>AI Reference</span>
                    </div>
                  ))}
                </div>
              )}

              {showAiPanel && (
                <div style={{ borderTop: aiSubmissions.length > 0 ? "1px solid #1e1e1e" : "none", paddingTop: aiSubmissions.length > 0 ? 16 : 0 }}>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, color: "#71717a", marginBottom: 6 }}>AI Model</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {AI_MODELS.map(m => (
                        <button key={m} onClick={() => setAiModel(m)}
                          style={{ fontSize: 12, padding: "6px 14px", borderRadius: 6, border: "1px solid " + (aiModel === m ? "#7c3aed" : "#2a2a2a"), background: aiModel === m ? "#1a0a2e" : "transparent", color: aiModel === m ? "#a78bfa" : "#71717a", cursor: "pointer" }}>
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea value={aiCode} onChange={e => setAiCode(e.target.value)}
                    placeholder={"Paste " + aiModel + "'s solution here..."}
                    style={{ width: "100%", height: 250, background: "#080808", border: "1px solid #2a2a2a", borderRadius: 10, padding: "16px", color: "#d4d4d4", fontFamily: "monospace", fontSize: 13, resize: "vertical", outline: "none", boxSizing: "border-box" }} />
                  {aiError && <div style={{ fontSize: 12, color: "#ef4444", marginTop: 8 }}>{aiError}</div>}
                  {aiDone && <div style={{ fontSize: 12, color: "#86efac", marginTop: 8 }}>AI code submitted successfully!</div>}
                  <button onClick={handleAiSubmit} disabled={aiSubmitting}
                    style={{ marginTop: 12, padding: "10px 28px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: aiSubmitting ? "not-allowed" : "pointer" }}>
                    {aiSubmitting ? "Submitting..." : "Submit " + aiModel + " Code"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <div style={{ background: "#0f0f0f", border: "1px solid #1e1e1e", borderRadius: 12, padding: "20px", marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#f5f5f5", marginBottom: 8 }}>Run Similarity Check</div>
            <div style={{ fontSize: 12, color: "#52525b", marginBottom: 16 }}>Compares all submissions including AI references.</div>
            <button onClick={handleRunMoss} disabled={runningMoss}
              style={{ width: "100%", padding: "10px", borderRadius: 8, border: "none", background: runningMoss ? "#1a1a1a" : "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: runningMoss ? "not-allowed" : "pointer" }}>
              {runningMoss ? "Running..." : "Run MOSS Now"}
            </button>
            {mossStatus && (
              <div style={{ fontSize: 12, marginTop: 10, color: mossStatus.includes("Done") ? "#86efac" : "#71717a" }}>
                {mossStatus}
                {mossStatus.includes("Done") && (
                  <span onClick={() => router.push("/projects/" + projectId + "/report")}
                    style={{ color: "#f97316", cursor: "pointer", marginLeft: 8 }}>View Report</span>
                )}
              </div>
            )}
          </div>

          <div style={{ background: "#0f0f0f", border: "1px solid #1e1e1e", borderRadius: 12, padding: "20px" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#f5f5f5", marginBottom: 12 }}>Run History</div>
            {runs.length === 0 ? (
              <div style={{ fontSize: 12, color: "#52525b" }}>No runs yet.</div>
            ) : runs.map((r: any) => (
              <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #1a1a1a" }}>
                <div style={{ fontSize: 11, color: "#52525b" }}>{new Date(r.createdAt).toLocaleString()}</div>
                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: r.status === "COMPLETED" ? "#052e16" : "#1a1a1a", color: r.status === "COMPLETED" ? "#86efac" : "#71717a" }}>{r.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
