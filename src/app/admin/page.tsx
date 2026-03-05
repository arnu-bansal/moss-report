"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type Tab = "overview" | "users" | "projects" | "runs";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") { router.push("/login"); return; }
    const role = (session?.user as any)?.role;
    if (role && role !== "admin") { router.push("/projects"); return; }
    fetch("/api/admin/stats").then(r => r.json()).then(d => { setData(d); setLoading(false); });
  }, [status, session]);

  if (status === "loading" || loading || !data) return (
    <div style={{ minHeight: "100vh", background: "#050505", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#71717a" }}>Loading...</div>
    </div>
  );

  const { users, projects, submissions, runs } = data;
  const completedRuns = runs.filter((r: any) => r.status === "COMPLETED");
  const totalMatches = completedRuns.reduce((a: number, r: any) => a + (r._count?.matches || 0), 0);
  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "users", label: "Users (" + users.length + ")" },
    { id: "projects", label: "Projects (" + projects.length + ")" },
    { id: "runs", label: "MOSS Runs (" + runs.length + ")" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#050505", color: "#d4d4d4", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ borderBottom: "1px solid #1a1a1a", padding: "14px 24px", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 28, height: 28, borderRadius: 6, background: "linear-gradient(135deg,#ef4444,#f97316)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700 }}>C</div>
        <span style={{ fontWeight: 700, fontSize: 15, color: "#f5f5f5", cursor: "pointer" }} onClick={() => router.push("/projects")}>CodeScan</span>
        <span style={{ color: "#3f3f46" }}>/</span>
        <span style={{ fontSize: 13, color: "#ef4444" }}>Admin Panel</span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 99, background: "#1a0a0a", border: "1px solid #ef444444", color: "#fca5a5" }}>admin</span>
          <button onClick={() => router.push("/projects")} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 6, border: "1px solid #2a2a2a", background: "transparent", color: "#71717a", cursor: "pointer" }}>Back to App</button>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
          {[
            { label: "Total Users", value: users.length, color: "#60a5fa" },
            { label: "Projects", value: projects.length, color: "#a78bfa" },
            { label: "Submissions", value: submissions.length, color: "#f97316" },
            { label: "Matches Found", value: totalMatches, color: "#ef4444" },
          ].map(s => (
            <div key={s.label} style={{ background: "#0f0f0f", border: "1px solid #1e1e1e", borderRadius: 12, padding: "20px 24px" }}>
              <div style={{ fontSize: 11, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: "1px solid #1a1a1a" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ fontSize: 13, padding: "10px 18px", borderRadius: "8px 8px 0 0", border: "1px solid " + (tab === t.id ? "#1e1e1e" : "transparent"), borderBottom: tab === t.id ? "1px solid #050505" : "transparent", background: tab === t.id ? "#0f0f0f" : "transparent", color: tab === t.id ? "#f5f5f5" : "#71717a", cursor: "pointer", marginBottom: -1 }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div style={{ background: "#0f0f0f", border: "1px solid #1e1e1e", borderRadius: 12, padding: "20px 24px" }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#f5f5f5", marginBottom: 16 }}>Users</div>
              {users.map((u: any) => (
                <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #1a1a1a" }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: u.role === "admin" ? "linear-gradient(135deg,#ef4444,#f97316)" : "linear-gradient(135deg,#7c3aed,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>{u.name?.[0]?.toUpperCase() || "?"}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: "#f5f5f5", fontWeight: 600 }}>{u.name}</div>
                    <div style={{ fontSize: 11, color: "#52525b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</div>
                  </div>
                  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 99, background: u.role === "admin" ? "#1a0a0a" : "#0a0f1a", color: u.role === "admin" ? "#fca5a5" : "#93c5fd" }}>{u.role}</span>
                </div>
              ))}
            </div>

            <div style={{ background: "#0f0f0f", border: "1px solid #1e1e1e", borderRadius: 12, padding: "20px 24px" }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#f5f5f5", marginBottom: 16 }}>Recent MOSS Runs</div>
              {runs.slice(0, 8).map((r: any) => (
                <div key={r.id} onClick={() => router.push("/projects/" + r.projectId + "/report")}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #1a1a1a", cursor: "pointer" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: "#d4d4d4", fontWeight: 600 }}>{r.project?.name || "Unknown"}</div>
                    <div style={{ fontSize: 11, color: "#52525b" }}>{new Date(r.createdAt).toLocaleString()}</div>
                  </div>
                  <div style={{ fontSize: 11, color: "#71717a" }}>{r._count?.matches || 0} matches</div>
                  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 99, background: r.status === "COMPLETED" ? "#052e16" : r.status === "FAILED" ? "#1a0a0a" : "#1a1a2e", color: r.status === "COMPLETED" ? "#86efac" : r.status === "FAILED" ? "#fca5a5" : "#818cf8" }}>{r.status}</span>
                </div>
              ))}
            </div>

            <div style={{ background: "#0f0f0f", border: "1px solid #1e1e1e", borderRadius: 12, padding: "20px 24px", gridColumn: "1 / -1" }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#f5f5f5", marginBottom: 16 }}>All Projects</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                {projects.map((p: any) => (
                  <div key={p.id} onClick={() => router.push("/projects/" + p.id)}
                    style={{ background: "#171717", border: "1px solid #2a2a2a", borderRadius: 10, padding: "16px", cursor: "pointer" }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = "#ef444444")}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = "#2a2a2a")}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 6, background: "#0f0f0f", border: "1px solid #2a2a2a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace", fontSize: 10, color: "#71717a" }}>.{p.language}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#f5f5f5" }}>{p.name}</div>
                    </div>
                    <div style={{ display: "flex", gap: 16 }}>
                      <div style={{ fontSize: 11, color: "#52525b" }}>{p._count?.submissions || 0} submissions</div>
                      <div style={{ fontSize: 11, color: "#52525b" }}>{p._count?.mossRuns || 0} runs</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "users" && (
          <div style={{ background: "#0f0f0f", border: "1px solid #1e1e1e", borderRadius: 12, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1e1e1e" }}>
                  {["Name", "Email", "Role", "Joined"].map(h => (
                    <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: 11, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u: any) => (
                  <tr key={u.id} style={{ borderBottom: "1px solid #1a1a1a" }}>
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: u.role === "admin" ? "linear-gradient(135deg,#ef4444,#f97316)" : "linear-gradient(135deg,#7c3aed,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 12 }}>{u.name?.[0]?.toUpperCase() || "?"}</div>
                        <span style={{ fontSize: 13, color: "#f5f5f5" }}>{u.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: "14px 20px", fontSize: 13, color: "#71717a" }}>{u.email}</td>
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ fontSize: 11, padding: "2px 10px", borderRadius: 99, background: u.role === "admin" ? "#1a0a0a" : "#0a0f1a", color: u.role === "admin" ? "#fca5a5" : "#93c5fd" }}>{u.role}</span>
                    </td>
                    <td style={{ padding: "14px 20px", fontSize: 12, color: "#52525b" }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "projects" && (
          <div style={{ background: "#0f0f0f", border: "1px solid #1e1e1e", borderRadius: 12, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1e1e1e" }}>
                  {["Project Name", "Language", "Submissions", "MOSS Runs", "Created", ""].map(h => (
                    <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: 11, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projects.map((p: any) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid #1a1a1a" }}>
                    <td style={{ padding: "14px 20px", fontSize: 13, color: "#f5f5f5", fontWeight: 600 }}>{p.name}</td>
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ fontFamily: "monospace", fontSize: 12, padding: "2px 8px", borderRadius: 4, background: "#171717", border: "1px solid #2a2a2a", color: "#71717a" }}>.{p.language}</span>
                    </td>
                    <td style={{ padding: "14px 20px", fontSize: 13, color: "#d4d4d4" }}>{p._count?.submissions || 0}</td>
                    <td style={{ padding: "14px 20px", fontSize: 13, color: "#d4d4d4" }}>{p._count?.mossRuns || 0}</td>
                    <td style={{ padding: "14px 20px", fontSize: 12, color: "#52525b" }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: "14px 20px" }}>
                      <button onClick={() => router.push("/projects/" + p.id)} style={{ fontSize: 11, padding: "4px 12px", borderRadius: 6, border: "1px solid #2a2a2a", background: "transparent", color: "#71717a", cursor: "pointer" }}>Open</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "runs" && (
          <div style={{ background: "#0f0f0f", border: "1px solid #1e1e1e", borderRadius: 12, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1e1e1e" }}>
                  {["Project", "Language", "Status", "Matches", "Time", ""].map(h => (
                    <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: 11, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {runs.map((r: any) => (
                  <tr key={r.id} style={{ borderBottom: "1px solid #1a1a1a" }}>
                    <td style={{ padding: "14px 20px", fontSize: 13, color: "#f5f5f5", fontWeight: 600 }}>{r.project?.name || "Unknown"}</td>
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ fontFamily: "monospace", fontSize: 12, padding: "2px 8px", borderRadius: 4, background: "#171717", border: "1px solid #2a2a2a", color: "#71717a" }}>.{r.project?.language || "?"}</span>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ fontSize: 11, padding: "2px 10px", borderRadius: 99, background: r.status === "COMPLETED" ? "#052e16" : r.status === "FAILED" ? "#1a0a0a" : "#1a1a2e", color: r.status === "COMPLETED" ? "#86efac" : r.status === "FAILED" ? "#fca5a5" : "#818cf8" }}>{r.status}</span>
                    </td>
                    <td style={{ padding: "14px 20px", fontSize: 13, color: "#d4d4d4" }}>{r._count?.matches || 0}</td>
                    <td style={{ padding: "14px 20px", fontSize: 12, color: "#52525b" }}>{new Date(r.createdAt).toLocaleString()}</td>
                    <td style={{ padding: "14px 20px" }}>
                      {r.status === "COMPLETED" && (
                        <button onClick={() => router.push("/projects/" + r.projectId + "/report")} style={{ fontSize: 11, padding: "4px 12px", borderRadius: 6, border: "1px solid #ef444444", background: "transparent", color: "#fca5a5", cursor: "pointer" }}>Report</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}