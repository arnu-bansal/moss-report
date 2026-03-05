"use client";
import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const registered = params.get("registered");

  async function handleLogin() {
    setLoading(true); setError("");
    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.ok) { router.push("/projects"); }
    else { setError("Invalid email or password"); setLoading(false); }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#050505", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#0f0f0f", border: "1px solid #1e1e1e", borderRadius: 12, padding: "40px", width: 380 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: "linear-gradient(135deg,#ef4444,#f97316)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700 }}>C</div>
          <span style={{ fontWeight: 700, fontSize: 16, color: "#f5f5f5" }}>CodeScan</span>
        </div>
        {registered && <div style={{ fontSize: 12, color: "#86efac", background: "#052e16", border: "1px solid #16a34a44", borderRadius: 8, padding: "10px 12px", marginBottom: 16 }}>Account created! Sign in below.</div>}
        {[
          { label: "Email", value: email, set: setEmail, type: "email", placeholder: "you@university.edu" },
          { label: "Password", value: password, set: setPassword, type: "password", placeholder: "........" },
        ].map((f) => (
          <div key={f.label} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: "#71717a", marginBottom: 6 }}>{f.label}</div>
            <input type={f.type} value={f.value} onChange={(e) => f.set(e.target.value)} placeholder={f.placeholder}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              style={{ width: "100%", background: "#171717", border: "1px solid #2a2a2a", borderRadius: 8, padding: "10px 12px", color: "#f5f5f5", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
          </div>
        ))}
        <div style={{ textAlign: "right", marginBottom: 16 }}>
          <a href="/forgot-password" style={{ fontSize: 12, color: "#71717a", textDecoration: "none" }}>Forgot password?</a>
        </div>
        {error && <div style={{ fontSize: 12, color: "#ef4444", marginBottom: 12 }}>{error}</div>}
        <button onClick={handleLogin} disabled={loading}
          style={{ width: "100%", padding: "12px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#ef4444,#f97316)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", marginBottom: 16 }}>
          {loading ? "Signing in..." : "Sign In"}
        </button>
        <div style={{ fontSize: 12, color: "#52525b", textAlign: "center" }}>
          No account? <a href="/signup" style={{ color: "#f97316", textDecoration: "none" }}>Sign up</a>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}