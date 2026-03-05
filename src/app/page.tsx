"use client";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status]);

  if (status === "loading") return (
    <div style={{ minHeight: "100vh", background: "#050505", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#71717a" }}>Loading...</div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#050505", color: "#d4d4d4", fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid #1a1a1a", padding: "14px 24px", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 28, height: 28, borderRadius: 6, background: "linear-gradient(135deg,#ef4444,#f97316)", display: "flex", alignItems: "center", justifyContent: "center" }}>⚡</div>
        <span style={{ fontWeight: 700, fontSize: 15, color: "#f5f5f5" }}>CodeScan</span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 12, color: "#71717a" }}>{session?.user?.email}</span>
          <button onClick={() => signOut({ callbackUrl: "/login" })} style={{ fontSize: 12, padding: "5px 12px", borderRadius: 6, border: "1px solid #2a2a2a", background: "transparent", color: "#71717a", cursor: "pointer" }}>Sign out</button>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 20px" }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#f5f5f5", marginBottom: 8 }}>Welcome, {session?.user?.name}</div>
        <div style={{ fontSize: 13, color: "#71717a", marginBottom: 32 }}>CS101 — Assignment 3</div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          {[
            { icon: "📤", title: "Submit Code", desc: "Upload your assignment submission", href: "/submit", color: "#f97316" },
            { icon: "📊", title: "My Report", desc: "View your similarity report", href: "/report", color: "#ef4444" },
            { icon: "⚙️", title: "Admin Panel", desc: "Run MOSS and manage submissions", href: "/admin", color: "#818cf8" },
          ].map((card) => (
            <div
              key={card.href}
              onClick={() => router.push(card.href)}
              style={{ background: "#0f0f0f", border: "1px solid #1e1e1e", borderRadius: 12, padding: "24px", cursor: "pointer", transition: "border-color 0.15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = card.color + "66")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#1e1e1e")}
            >
              <div style={{ fontSize: 28, marginBottom: 12 }}>{card.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#f5f5f5", marginBottom: 6 }}>{card.title}</div>
              <div style={{ fontSize: 12, color: "#52525b" }}>{card.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}