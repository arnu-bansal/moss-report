"use client";
import { useState, useEffect, useRef } from "react";

const COLORS = [
  { bg: "rgba(239,68,68,0.18)", border: "#ef4444", text: "#fca5a5" },
  { bg: "rgba(249,115,22,0.18)", border: "#f97316", text: "#fdba74" },
  { bg: "rgba(234,179,8,0.18)", border: "#eab308", text: "#fde047" },
  { bg: "rgba(168,85,247,0.18)", border: "#a855f7", text: "#d8b4fe" },
];

export default function SimilarityReport() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<string | null>(null);
  const [scrollTo, setScrollTo] = useState<number | null>(null);
  const [activeSegment, setActiveSegment] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [done, setDone] = useState<Record<number, boolean>>({});
  const lineRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    fetch("/api/projects/project-1/my-report")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setError("Failed to load report"); setLoading(false); });
  }, []);

  useEffect(() => {
    if (scrollTo && lineRefs.current[scrollTo]) {
      lineRefs.current[scrollTo]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [scrollTo]);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#050505", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#71717a" }}>Loading report...</div>
    </div>
  );

  if (error || !data || data.error) return (
    <div style={{ minHeight: "100vh", background: "#050505", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#ef4444" }}>No MOSS report found yet. Submit code and ask admin to run MOSS.</div>
    </div>
  );

  const matches = data.matches || [];
  const versions = data.versions || [];

  // Use actual submitted code — pick first version available
  const myCode = versions.length > 0 ? versions[0].code.split("\n") : ["// No code found"];
  const TOTAL = myCode.length;

  // Build overlap map from real segments
  const overlapMap = new Array(TOTAL + 1).fill(0);
  const perLine: string[][] = new Array(TOTAL + 1).fill(null).map(() => []);
  matches.forEach((m: any) => {
    m.segments?.forEach((s: any) => {
      if (s.side === "A") {
        for (let l = s.startLine; l <= s.endLine; l++) {
          if (l <= TOTAL) { overlapMap[l]++; perLine[l].push(m.id); }
        }
      }
    });
  });

  const totalMatched = (() => {
    const all = matches.flatMap((m: any) =>
      (m.segments || []).filter((s: any) => s.side === "A").map((s: any) => ({ start: s.startLine, end: s.endLine }))
    ).sort((a: any, b: any) => a.start - b.start);
    const merged: { start: number; end: number }[] = [];
    for (const r of all) {
      if (merged.length && r.start <= merged[merged.length - 1].end + 1) merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, r.end);
      else merged.push({ ...r });
    }
    return merged.reduce((a: number, r: any) => a + (r.end - r.start + 1), 0);
  })();

  const tips = [
    { icon: "??", title: "Rename variables meaningfully", desc: "Replace generic names with descriptive ones." },
    { icon: "??", title: "Restructure helper functions", desc: "Break methods into smaller, purpose-named helpers." },
    { icon: "??", title: "Change loop style", desc: "Swap indexed for-loops for enhanced for-loops." },
    { icon: "??", title: "Add your own comments", desc: "Explain WHY each step exists in your own words." },
    { icon: "??", title: "Alter decomposition", desc: "Reorganize class layout and method groupings." },
    { icon: "???", title: "Handle edge cases differently", desc: "Add input validation that shows deep understanding." },
    { icon: "??", title: "Re-derive the algorithm", desc: "Close all references and rewrite from scratch." },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#050505", color: "#d4d4d4", fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid #1a1a1a", padding: "14px 24px", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 28, height: 28, borderRadius: 6, background: "linear-gradient(135deg,#ef4444,#f97316)", display: "flex", alignItems: "center", justifyContent: "center" }}>?</div>
        <span style={{ fontWeight: 700, fontSize: 15, color: "#f5f5f5" }}>CodeScan</span>
        <span style={{ color: "#3f3f46" }}>/</span>
        <span style={{ fontSize: 13, color: "#71717a" }}>My Similarity Report</span>
        <span style={{ marginLeft: "auto", fontSize: 11, color: "#52525b" }}>
          Run: {new Date(data.createdAt).toLocaleString()}
        </span>
        <a href="/" style={{ fontSize: 12, padding: "5px 12px", borderRadius: 6, border: "1px solid #2a2a2a", color: "#71717a", textDecoration: "none" }}>? Back</a>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 20px", display: "grid", gridTemplateColumns: "340px 1fr", gap: 20 }}>
        {/* LEFT */}
        <div>
          {/* Summary */}
          <div style={{ background: "#0f0f0f", border: "1px solid #1e1e1e", borderRadius: 12, padding: "20px 24px", marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#f5f5f5", marginBottom: 16 }}>Summary</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {matches.map((m: any, i: number) => (
                <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 6, background: "#171717", border: `1px solid ${COLORS[i % 4].border}33`, borderRadius: 8, padding: "6px 12px" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS[i % 4].border }} />
                  <span style={{ fontFamily: "monospace", fontSize: 12, color: "#a3a3a3" }}>#{m.submissionVersionBId.slice(0, 8)}</span>
                  <span style={{ fontSize: 12, color: COLORS[i % 4].text, fontWeight: 700 }}>{m.percentA}%</span>
                </div>
              ))}
            </div>
            <div style={{ background: "#171717", borderRadius: 8, padding: "14px 16px" }}>
              <div style={{ fontSize: 11, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Total Matched Lines</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#ef4444" }}>{totalMatched}<span style={{ fontSize: 14, color: "#52525b", fontWeight: 400, marginLeft: 6 }}>/ {TOTAL}</span></div>
              <div style={{ marginTop: 6, background: "#262626", borderRadius: 4, height: 4 }}>
                <div style={{ width: `${Math.min((totalMatched / TOTAL) * 100, 100)}%`, height: "100%", background: "linear-gradient(90deg,#ef4444,#f97316)" }} />
              </div>
            </div>
          </div>

          {/* Filter */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
            <button onClick={() => setFilter(null)} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 99, cursor: "pointer", background: !filter ? "#1a1a1a" : "transparent", border: `1px solid ${!filter ? "#555" : "#2a2a2a"}`, color: !filter ? "#f5f5f5" : "#52525b" }}>All</button>
            {matches.map((m: any, i: number) => (
              <button key={m.id} onClick={() => setFilter(filter === m.id ? null : m.id)} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 99, cursor: "pointer", background: filter === m.id ? COLORS[i % 4].bg : "transparent", border: `1px solid ${filter === m.id ? COLORS[i % 4].border : "#2a2a2a"}`, color: filter === m.id ? COLORS[i % 4].text : "#52525b" }}>#{m.submissionVersionBId.slice(0, 6)}</button>
            ))}
          </div>

          {/* Match cards */}
          <div style={{ marginBottom: 20 }}>
            {matches.map((m: any, i: number) => (
              <div key={m.id} style={{ background: "#0f0f0f", border: `1px solid ${COLORS[i % 4].border}44`, borderRadius: 10, marginBottom: 10, overflow: "hidden" }}>
                <div onClick={() => setExpanded(expanded === m.id ? null : m.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", cursor: "pointer" }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: COLORS[i % 4].border }} />
                  <span style={{ fontFamily: "monospace", fontSize: 13, color: "#d4d4d4" }}>User #{m.submissionVersionBId.slice(0, 8)}</span>
                  <div style={{ marginLeft: "auto", display: "flex", gap: 16 }}>
                    <div style={{ textAlign: "right" }}><div style={{ fontSize: 10, color: "#52525b" }}>My code</div><div style={{ fontSize: 15, fontWeight: 700, color: COLORS[i % 4].text }}>{m.percentA}%</div></div>
                    <span style={{ color: "#52525b", fontSize: 18 }}>{expanded === m.id ? "?" : "›"}</span>
                  </div>
                </div>
                {expanded === m.id && (
                  <div style={{ padding: "0 18px 14px", borderTop: "1px solid #1e1e1e" }}>
                    {(m.segments || []).filter((s: any) => s.side === "A").map((seg: any) => (
                      <div key={seg.id} onClick={() => { setActiveSegment(seg.id); setScrollTo(seg.startLine); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 6, marginTop: 8, background: activeSegment === seg.id ? COLORS[i % 4].bg : "#171717", border: `1px solid ${activeSegment === seg.id ? COLORS[i % 4].border : "#262626"}`, cursor: "pointer" }}>
                        <span style={{ fontFamily: "monospace", fontSize: 12, color: "#a3a3a3" }}>L{seg.startLine}–L{seg.endLine}</span>
                        <span style={{ fontSize: 11, color: "#52525b" }}>{seg.endLine - seg.startLine + 1} lines</span>
                        <button onClick={(e) => { e.stopPropagation(); setScrollTo(seg.startLine); }} style={{ marginLeft: "auto", fontSize: 11, color: COLORS[i % 4].text, background: "transparent", border: `1px solid ${COLORS[i % 4].border}55`, borderRadius: 4, padding: "3px 8px", cursor: "pointer" }}>Jump ?</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Guidance */}
          <div style={{ background: "#0a0f0a", border: "1px solid #14532d33", borderRadius: 12, padding: "20px 24px" }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#86efac", marginBottom: 12 }}>?? How to Improve Originality</div>
            {tips.map((t, i) => (
              <div key={i} onClick={() => setDone((d) => ({ ...d, [i]: !d[i] }))} style={{ display: "flex", gap: 10, padding: "10px 12px", borderRadius: 8, marginBottom: 8, background: done[i] ? "#052e16" : "#0f1a0f", border: `1px solid ${done[i] ? "#16a34a55" : "#1a2e1a"}`, cursor: "pointer" }}>
                <span>{t.icon}</span>
                <div>
                  <div style={{ fontSize: 13, color: "#86efac", fontWeight: 600 }}>{t.title} {done[i] && "?"}</div>
                  <div style={{ fontSize: 11, color: "#4a7c59" }}>{t.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — Code viewer */}
        <div style={{ background: "#0f0f0f", border: "1px solid #1e1e1e", borderRadius: 12, padding: "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: "#f5f5f5" }}>My Submission</span>
            <span style={{ marginLeft: "auto", fontSize: 11, color: "#3f3f46", background: "#1a1a1a", padding: "2px 8px", borderRadius: 4 }}>read-only</span>
          </div>

          {/* Heatmap bar */}
          <div style={{ marginBottom: 12, background: "#080808", borderRadius: 4, height: 8, display: "flex", overflow: "hidden" }}>
            {myCode.map((_: any, i: number) => {
              const l = i + 1;
              const count = overlapMap[l];
              return <div key={l} style={{ flex: 1, background: count > 0 ? `rgba(239,68,68,${Math.min(count * 0.4 + 0.2, 1)})` : "transparent" }} />;
            })}
          </div>

          <div style={{ fontFamily: "monospace", fontSize: 12, lineHeight: "1.7", background: "#080808", border: "1px solid #1e1e1e", borderRadius: 10, overflow: "auto", maxHeight: 600 }}>
            {myCode.map((line: string, i: number) => {
              const lineNum = i + 1;
              const matchIds = perLine[lineNum] || [];
              const visible = filter ? matchIds.includes(filter) : matchIds.length > 0;
              const idx = matches.findIndex((m: any) => matchIds.includes(m.id));
              const c = visible && idx >= 0 ? COLORS[idx % 4] : null;
              return (
                <div key={lineNum} ref={(el) => { lineRefs.current[lineNum] = el; }} style={{ display: "flex", background: c ? c.bg : "transparent", borderLeft: c ? `2px solid ${c.border}` : "2px solid transparent" }}>
                  <span style={{ minWidth: 42, padding: "0 10px", color: "#3f3f46", textAlign: "right", userSelect: "none", borderRight: "1px solid #1a1a1a", flexShrink: 0 }}>{lineNum}</span>
                  <pre style={{ margin: 0, padding: "0 12px", color: "#d4d4d4", whiteSpace: "pre", flex: 1 }}>{line || " "}</pre>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
