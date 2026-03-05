"use client";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

const LANGUAGES = ["java", "c", "cpp", "python", "javascript", "typescript", "txt"];

export default function ProjectsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [language, setLanguage] = useState("java");
  const [loading, setLoading] = useState(true);
  const isAdmin = (session?.user as any)?.role === "admin";

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status]);

  useEffect(() => {
    fetch("/api/projects").then(r => r.json()).then(d => { setProjects(d.projects || []); setLoading(false); });
  }, []);

  async function createProject() {
    if (!name.trim()) return;
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, language, userId: (session?.user as any)?.id }),
    });
    const d = await res.json();
    if (d.project) { setProjects(p => [d.project, ...p]); setCreating(false); setName(""); setLanguage("java"); }
  }

  if (status === "loading" || loading) return (
    <div style={{ minHeight: "100vh", background: "#050505", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#71717a" }}>Loading...</div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#050505", color: "#d4d4d4", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ borderBottom: "1px solid #1a1a1a", padding: "14px 24px", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 28, height: 28, borderRadius: 6, background: "linear-gradient(135deg,#ef4444,#f97316)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700 }}>C</div>
        <span style={{ fontWeight: 700, fontSize: 15, color: "#f5f5f5" }}>CodeScan</span>
        <span style={{ color: "#3f3f46" }}>/</span>
        <span style={{ fontSize: 13, color: "#71717a" }}>Projects</span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          {isAdmin && (
            <button onClick={() => router.push("/admin")}
              style={{ fontSize: 12, padding: "5px 12px", borderRadius: 6, border: "1px solid #ef444444", background: "#1a0a0a", color: "#fca5a5", cursor: "pointer" }}>
              Admin Panel
            </button>
          )}
          <span style={{ fontSize: 12, color: "#71717a" }}>{session?.user?.name}</span>
          <button onClick={() => signOut({ callbackUrl: "/login" })}
            style={{ fontSize: 12, padding: "5px 12px", borderRadius: 6, border: "1px solid #2a2a2a", background: "transparent", color: "#71717a", cursor: "pointer" }}>Sign out</button>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#f5f5f5" }}>My Projects</div>
            <div style={{ fontSize: 13, color: "#71717a", marginTop: 4 }}>Create a project, submit code, and run similarity checks.</div>
          </div>
          <button onClick={() => setCreating(true)}
            style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#ef4444,#f97316)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>+ New Project</button>
        </div>

        {creating && (
          <div style={{ background: "#0f0f0f", border: "1px solid #1e1e1e", borderRadius: 12, padding: "24px", marginBottom: 24 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#f5f5f5", marginBottom: 16 }}>New Project</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 12, color: "#71717a", marginBottom: 6 }}>Project Name</div>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. CS101 Assignment 3"
                  style={{ width: "100%", background: "#171717", border: "1px solid #2a2a2a", borderRadius: 8, padding: "10px 12px", color: "#f5f5f5", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#71717a", marginBottom: 6 }}>Language</div>
                <select value={language} onChange={e => setLanguage(e.target.value)}
                  style={{ width: "100%", background: "#171717", border: "1px solid #2a2a2a", borderRadius: 8, padding: "10px 12px", color: "#f5f5f5", fontSize: 13, outline: "none" }}>
                  {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={createProject}
                style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#ef4444,#f97316)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Create</button>
              <button onClick={() => setCreating(false)}
                style={{ padding: "9px 20px", borderRadius: 8, border: "1px solid #2a2a2a", background: "transparent", color: "#71717a", fontSize: 13, cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        )}

        {projects.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#52525b" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>[ ]</div>
            <div>No projects yet. Create one to get started!</div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {projects.map((p: any) => (
              <div key={p.id} onClick={() => router.push("/projects/" + p.id)}
                style={{ background: "#0f0f0f", border: "1px solid #1e1e1e", borderRadius: 12, padding: "20px 24px", cursor: "pointer", display: "flex", alignItems: "center", gap: 16 }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "#ef444444")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "#1e1e1e")}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: "#171717", border: "1px solid #2a2a2a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace", fontSize: 11, color: "#71717a" }}>.{p.language}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#f5f5f5" }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: "#52525b", marginTop: 2 }}>Created {new Date(p.createdAt).toLocaleDateString()}</div>
                </div>
                <div style={{ marginLeft: "auto", fontSize: 12, color: "#52525b" }}>→</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}