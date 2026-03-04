"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleLogin() {
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (res?.ok) {
      router.push("/");
    } else {
      setError("Invalid email or password");
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#050505", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#0f0f0f", border: "1px solid #1e1e1e", borderRadius: 12, padding: "40px", width: 360 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: "linear-gradient(135deg,#ef4444,#f97316)", display: "flex", alignItems: "center", justifyContent: "center" }}>⚡</div>
          <span style={{ fontWeight: 700, fontSize: 16, color: "#f5f5f5" }}>CodeScan Login</span>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: "#71717a", marginBottom: 6 }}>Email</div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", background: "#171717", border: "1px solid #2a2a2a", borderRadius: 8, padding: "10px 12px", color: "#f5f5f5", fontSize: 14, outline: "none" }}
            placeholder="student@university.edu"
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: "#71717a", marginBottom: 6 }}>Password</div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", background: "#171717", border: "1px solid #2a2a2a", borderRadius: 8, padding: "10px 12px", color: "#f5f5f5", fontSize: 14, outline: "none" }}
            placeholder="••••••••"
          />
        </div>

        {error && <div style={{ fontSize: 12, color: "#ef4444", marginBottom: 16 }}>{error}</div>}

        <button
          onClick={handleLogin}
          style={{ width: "100%", padding: "12px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#ef4444,#f97316)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
        >
          Sign In
        </button>
      </div>
    </div> 
  );
}