"use client";
import { useState, useEffect, useRef, useCallback } from "react";

const MOCK_MY_CODE = `import java.util.Scanner;
import java.util.ArrayList;

public class BubbleSort {
    static int[] arr;
    static int n;

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        n = sc.nextInt();
        arr = new int[n];
        for (int i = 0; i < n; i++) {
            arr[i] = sc.nextInt();
        }
        bubbleSort();
        for (int i = 0; i < n; i++) {
            System.out.print(arr[i] + " ");
        }
    }

    static void bubbleSort() {
        for (int i = 0; i < n - 1; i++) {
            for (int j = 0; j < n - i - 1; j++) {
                if (arr[j] > arr[j + 1]) {
                    int temp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = temp;
                }
            }
        }
    }

    static void printArray() {
        ArrayList<Integer> list = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            list.add(arr[i]);
        }
        System.out.println(list);
    }

    static boolean isSorted() {
        for (int i = 0; i < n - 1; i++) {
            if (arr[i] > arr[i + 1]) return false;
        }
        return true;
    }
}`.split("\n");

const MOCK_MATCHES = [
  { id: "m1", counterpartHash: "a3f8b2c1", percentMe: 72, percentThem: 68, segments: [{ id: "s1", startLine: 7, endLine: 16, confidence: "HIGH" }, { id: "s2", startLine: 22, endLine: 30, confidence: "HIGH" }] },
  { id: "m2", counterpartHash: "d9e1f047", percentMe: 55, percentThem: 61, segments: [{ id: "s3", startLine: 22, endLine: 30, confidence: "HIGH" }, { id: "s4", startLine: 32, endLine: 36, confidence: "LOW" }] },
  { id: "m3", counterpartHash: "7c2a5b90", percentMe: 41, percentThem: 38, segments: [{ id: "s5", startLine: 7, endLine: 12, confidence: "MED" }] },
  { id: "m4", counterpartHash: "e5d3c812", percentMe: 29, percentThem: 33, segments: [{ id: "s6", startLine: 22, endLine: 25, confidence: "LOW" }] },
];

const COLORS = [
  { bg: "rgba(239,68,68,0.18)", border: "#ef4444", text: "#fca5a5" },
  { bg: "rgba(249,115,22,0.18)", border: "#f97316", text: "#fdba74" },
  { bg: "rgba(234,179,8,0.18)", border: "#eab308", text: "#fde047" },
  { bg: "rgba(168,85,247,0.18)", border: "#a855f7", text: "#d8b4fe" },
];

const TOTAL = MOCK_MY_CODE.length;

function buildMap(matches: typeof MOCK_MATCHES) {
  const map = new Array(TOTAL + 1).fill(0);
  const perLine: string[][] = new Array(TOTAL + 1).fill(null).map(() => []);
  matches.forEach((m) => m.segments.forEach((s) => {
    for (let l = s.startLine; l <= s.endLine; l++) { map[l]++; perLine[l].push(m.id); }
  }));
  return { map, perLine };
}

export default function SimilarityReport() {
  const [filter, setFilter] = useState<string | null>(null);
  const [scrollTo, setScrollTo] = useState<number | null>(null);
  const [activeSegment, setActiveSegment] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [done, setDone] = useState<Record<number, boolean>>({});
  const lineRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const { map, perLine } = buildMap(MOCK_MATCHES);

  useEffect(() => {
    if (scrollTo && lineRefs.current[scrollTo]) {
      lineRefs.current[scrollTo]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [scrollTo]);

  const totalMatched = (() => {
    const all = MOCK_MATCHES.flatMap(m => m.segments).map(s => ({ start: s.startLine, end: s.endLine })).sort((a, b) => a.start - b.start);
    const merged: { start: number; end: number }[] = [];
    for (const r of all) {
      if (merged.length && r.start <= merged[merged.length - 1].end + 1) merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, r.end);
      else merged.push({ ...r });
    }
    return merged.reduce((a, r) => a + (r.end - r.start + 1), 0);
  })();

  const tips = [
    { icon: "✏️", title: "Rename variables meaningfully", desc: "Replace arr, n, i with descriptive names like sortedValues, arraySize, outerIndex." },
    { icon: "🔄", title: "Restructure helper functions", desc: "Break monolithic methods into smaller, purpose-named helpers." },
    { icon: "🔁", title: "Change loop style", desc: "Swap indexed for-loops for enhanced for-loops or streams." },
    { icon: "💬", title: "Add your own comments", desc: "Explain WHY each step exists in your own words." },
    { icon: "🧱", title: "Alter decomposition", desc: "Reorganize class layout, method groupings, call order." },
    { icon: "🛡️", title: "Handle edge cases differently", desc: "Add input validation or null checks that show deep understanding." },
    { icon: "📐", title: "Re-derive the algorithm", desc: "Close all references and rewrite from scratch using only your understanding." },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#050505", color: "#d4d4d4", fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid #1a1a1a", padding: "14px 24px", display: "flex", alignItems: "center", gap: 14, background: "#050505" }}>
        <div style={{ width: 28, height: 28, borderRadius: 6, background: "linear-gradient(135deg,#ef4444,#f97316)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>⚡</div>
        <span style={{ fontWeight: 700, fontSize: 15, color: "#f5f5f5" }}>CodeScan</span>
        <span style={{ color: "#3f3f46" }}>/</span>
        <span style={{ fontSize: 13, color: "#71717a" }}>CS101 — Assignment 3 — My Similarity Report</span>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 20px", display: "grid", gridTemplateColumns: "340px 1fr", gap: 20 }}>
        {/* LEFT */}
        <div>
          {/* Summary */}
          <div style={{ background: "#0f0f0f", border: "1px solid #1e1e1e", borderRadius: 12, padding: "20px 24px", marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#f5f5f5", marginBottom: 4 }}>Similarity Report</div>
            <div style={{ fontSize: 11, color: "#52525b", marginBottom: 16 }}>MOSS run: {new Date("2025-07-14T09:32:00Z").toLocaleString()}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {MOCK_MATCHES.map((m, i) => (
                <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 6, background: "#171717", border: `1px solid ${COLORS[i].border}33`, borderRadius: 8, padding: "6px 12px" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS[i].border, display: "inline-block" }} />
                  <span style={{ fontFamily: "monospace", fontSize: 12, color: "#a3a3a3" }}>#{m.counterpartHash.slice(0, 6)}</span>
                  <span style={{ fontSize: 12, color: COLORS[i].text, fontWeight: 700 }}>{m.percentMe}%</span>
                </div>
              ))}
            </div>
            <div style={{ background: "#171717", borderRadius: 8, padding: "14px 16px" }}>
              <div style={{ fontSize: 11, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Total Matched Lines</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#ef4444" }}>{totalMatched}<span style={{ fontSize: 14, color: "#52525b", fontWeight: 400, marginLeft: 6 }}>/ {TOTAL}</span></div>
              <div style={{ marginTop: 6, background: "#262626", borderRadius: 4, height: 4 }}>
                <div style={{ width: `${(totalMatched / TOTAL) * 100}%`, height: "100%", background: "linear-gradient(90deg,#ef4444,#f97316)" }} />
              </div>
            </div>
          </div>

          {/* Filter */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
            <button onClick={() => setFilter(null)} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 99, cursor: "pointer", background: !filter ? "#1a1a1a" : "transparent", border: `1px solid ${!filter ? "#555" : "#2a2a2a"}`, color: !filter ? "#f5f5f5" : "#52525b" }}>All</button>
            {MOCK_MATCHES.map((m, i) => (
              <button key={m.id} onClick={() => setFilter(filter === m.id ? null : m.id)} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 99, cursor: "pointer", background: filter === m.id ? COLORS[i].bg : "transparent", border: `1px solid ${filter === m.id ? COLORS[i].border : "#2a2a2a"}`, color: filter === m.id ? COLORS[i].text : "#52525b" }}>#{m.counterpartHash.slice(0, 6)}</button>
            ))}
          </div>

          {/* Counterpart cards */}
          <div style={{ marginBottom: 20 }}>
            {MOCK_MATCHES.map((m, i) => (
              <div key={m.id} style={{ background: "#0f0f0f", border: `1px solid ${COLORS[i].border}44`, borderRadius: 10, marginBottom: 10, overflow: "hidden" }}>
                <div onClick={() => setExpanded(expanded === m.id ? null : m.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", cursor: "pointer" }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: COLORS[i].border }} />
                  <span style={{ fontFamily: "monospace", fontSize: 13, color: "#d4d4d4" }}>User #{m.counterpartHash}</span>
                  <div style={{ marginLeft: "auto", display: "flex", gap: 16 }}>
                    <div style={{ textAlign: "right" }}><div style={{ fontSize: 10, color: "#52525b" }}>My code</div><div style={{ fontSize: 15, fontWeight: 700, color: COLORS[i].text }}>{m.percentMe}%</div></div>
                    <span style={{ color: "#52525b", fontSize: 18 }}>{expanded === m.id ? "∨" : "›"}</span>
                  </div>
                </div>
                {expanded === m.id && (
                  <div style={{ padding: "0 18px 14px", borderTop: "1px solid #1e1e1e" }}>
                    {m.segments.map((seg) => (
                      <div key={seg.id} onClick={() => { setActiveSegment(seg.id); setScrollTo(seg.startLine); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 6, marginTop: 8, background: activeSegment === seg.id ? COLORS[i].bg : "#171717", border: `1px solid ${activeSegment === seg.id ? COLORS[i].border : "#262626"}`, cursor: "pointer" }}>
                        <span style={{ fontFamily: "monospace", fontSize: 12, color: "#a3a3a3" }}>L{seg.startLine}–L{seg.endLine}</span>
                        <span style={{ fontSize: 11, color: "#52525b" }}>{seg.endLine - seg.startLine + 1} lines</span>
                        <span style={{ marginLeft: "auto", fontSize: 10, padding: "2px 8px", borderRadius: 99, background: seg.confidence === "HIGH" ? "#450a0a" : seg.confidence === "MED" ? "#431407" : "#1c1917", color: seg.confidence === "HIGH" ? "#fca5a5" : seg.confidence === "MED" ? "#fdba74" : "#d6d3d1" }}>{seg.confidence}</span>
                        <button onClick={(e) => { e.stopPropagation(); setScrollTo(seg.startLine); }} style={{ fontSize: 11, color: COLORS[i].text, background: "transparent", border: `1px solid ${COLORS[i].border}55`, borderRadius: 4, padding: "3px 8px", cursor: "pointer" }}>Jump ↓</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Guidance */}
          <div style={{ background: "#0a0f0a", border: "1px solid #14532d33", borderRadius: 12, padding: "20px 24px" }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#86efac", marginBottom: 12 }}>🎯 How to Improve Originality</div>
            {tips.map((t, i) => (
              <div key={i} onClick={() => setDone((d) => ({ ...d, [i]: !d[i] }))} style={{ display: "flex", gap: 10, padding: "10px 12px", borderRadius: 8, marginBottom: 8, background: done[i] ? "#052e16" : "#0f1a0f", border: `1px solid ${done[i] ? "#16a34a55" : "#1a2e1a"}`, cursor: "pointer" }}>
                <span>{t.icon}</span>
                <div>
                  <div style={{ fontSize: 13, color: "#86efac", fontWeight: 600 }}>{t.title} {done[i] && "✓"}</div>
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
            <span style={{ fontSize: 11, color: "#52525b", fontFamily: "monospace" }}>BubbleSort.java</span>
            <span style={{ marginLeft: "auto", fontSize: 11, color: "#3f3f46", background: "#1a1a1a", padding: "2px 8px", borderRadius: 4 }}>read-only</span>
          </div>
          <div style={{ fontFamily: "monospace", fontSize: 12, lineHeight: "1.7", background: "#080808", border: "1px solid #1e1e1e", borderRadius: 10, overflow: "auto", maxHeight: 600 }}>
            {MOCK_MY_CODE.map((line, i) => {
              const lineNum = i + 1;
              const matchIds = perLine[lineNum] || [];
              const visible = filter ? matchIds.includes(filter) : matchIds.length > 0;
              const idx = MOCK_MATCHES.findIndex(m => matchIds.includes(m.id));
              const c = idx >= 0 ? COLORS[idx] : null;
              return (
                <div key={lineNum} ref={(el) => { lineRefs.current[lineNum] = el; }} style={{ display: "flex", background: visible && c ? c.bg : "transparent", borderLeft: visible && c ? `2px solid ${c.border}` : "2px solid transparent" }}>
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