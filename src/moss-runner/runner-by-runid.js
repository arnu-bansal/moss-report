const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const http = require("http");

process.env.DATABASE_URL = process.env.DATABASE_URL || "postgres://e090abc9d5a5606d19ed67103590bcfe7537f3aeee775158608124218dcf93e0:sk_MXWjEBecCd0XpgUaKo9d2@db.prisma.io:5432/postgres?sslmode=require";
const DB_URL = process.env.DATABASE_URL;

async function fetchHtml(url) {
  return new Promise((resolve) => {
    function get(u) {
      http.get(u, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) { get(res.headers.location); return; }
        let html = "";
        res.on("data", c => html += c);
        res.on("end", () => resolve(html));
      }).on("error", () => resolve(""));
    }
    get(url);
  });
}

async function runMoss(projectId, runId) {
  console.log("[" + new Date().toLocaleTimeString() + "] Starting MOSS for project:", projectId, "run:", runId);
  const { PrismaClient } = require("@prisma/client");
  const { PrismaPg } = require("@prisma/adapter-pg");
  const adapter = new PrismaPg({ connectionString: DB_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    const submissions = await prisma.submission.findMany({
      where: { projectId },
      include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
    });

    if (submissions.length < 2) {
      await prisma.mossRun.update({ where: { id: runId }, data: { status: "FAILED", errorText: "Need at least 2 submissions" } });
      await prisma.$disconnect();
      return;
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    const lang = project?.language || "java";
    const extMap = { java: ".java", c: ".c", cpp: ".cpp", python: ".py", javascript: ".js", typescript: ".ts", txt: ".txt" };
    const langMap = { java: "java", c: "c", cpp: "cc", python: "python", javascript: "javascript", typescript: "javascript", txt: "ascii" };
    const ext = extMap[lang] || ".java";
    const mossLang = langMap[lang] || "java";

    // Per-run temp folder to avoid collisions between concurrent runs
    const tmpDir = path.join(__dirname, "tmp", runId);
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    for (const sub of submissions) {
      const version = sub.versions[0];
      if (!version) continue;
      const filePath = path.join(tmpDir, sub.userId + ext);
      fs.writeFileSync(filePath, version.code);
      console.log("  Wrote:", sub.userId + ext);
    }

    const mossScript = path.join(__dirname, "moss.pl");
    const files = submissions.filter(s => s.versions[0]).map(s => path.join(tmpDir, s.userId + ext)).join(" ");
    const cmd = "perl " + mossScript + " -l " + mossLang + " " + files;
    console.log("  Running MOSS...");

    exec(cmd, async (err, stdout) => {
      // Clean up temp folder after MOSS runs
      try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}

      if (err) {
        console.error("  MOSS error:", err.message);
        await prisma.mossRun.update({ where: { id: runId }, data: { status: "FAILED", errorText: err.message } });
        await prisma.$disconnect();
        return;
      }

      const urlMatch = stdout.match(/http:\/\/moss\.stanford\.edu\/results\/\S+/);
      if (!urlMatch) {
        await prisma.mossRun.update({ where: { id: runId }, data: { status: "FAILED", errorText: "No MOSS URL returned" } });
        await prisma.$disconnect();
        return;
      }

      const mossUrl = urlMatch[0].trim();
      console.log("  MOSS URL:", mossUrl);

      const indexHtml = await fetchHtml(mossUrl.endsWith("/") ? mossUrl : mossUrl + "/");
      const rows = indexHtml.split("<TR>").slice(2);
      let count = 0;

      for (const row of rows) {
        if (!row.includes("HREF")) continue;
        const hrefMatch = row.match(/HREF="([^"]+)"/);
        const percents = [...row.matchAll(/\((\d+)%\)/g)].map(m => parseInt(m[1]));
        const files2 = [...row.matchAll(/tmp[/\\][^/\\]+[/\\]([^.]+)\.[a-z]+/g)].map(m => m[1]);
        if (!hrefMatch || percents.length < 2 || files2.length < 2) continue;

        const matchUrl = hrefMatch[1];
        const userA = files2[0], userB = files2[1];
        const percentA = percents[0], percentB = percents[1];
        console.log("  Match:", userA, percentA + "% vs", userB, percentB + "%");

        const subA = submissions.find(s => s.userId === userA);
        const subB = submissions.find(s => s.userId === userB);
        if (!subA || !subB) continue;
        const verA = subA.versions[0], verB = subB.versions[0];
        if (!verA || !verB) continue;

        const savedMatch = await prisma.mossMatch.create({
          data: {
            id: "match-" + Date.now() + "-" + Math.random().toString(36).slice(2),
            mossRunId: runId,
            submissionVersionAId: verA.id,
            submissionVersionBId: verB.id,
            percentA, percentB, mossMatchUrl: matchUrl,
          },
        });

        for (const [suffix, side] of [["-0.html", "A"], ["-1.html", "B"]]) {
          const detailHtml = await fetchHtml(matchUrl.replace(".html", suffix));
          if (!detailHtml) continue;
          const preMatch = detailHtml.match(/<PRE>([\s\S]*?)<\/PRE>/i);
          if (!preMatch) continue;
          const preContent = preMatch[1];
          const segments = [];
          const fontRegex = /<FONT[^>]+COLOR[^>]+>([\s\S]*?)<\/FONT>/gi;
          let fm;
          while ((fm = fontRegex.exec(preContent)) !== null) {
            const before = preContent.slice(0, fm.index);
            const startLine = (before.match(/\n/g) || []).length + 1;
            const blockLines = (fm[1].match(/\n/g) || []).length;
            segments.push({ startLine, endLine: startLine + blockLines - 1 });
          }
          segments.sort((a, b) => a.startLine - b.startLine);
          const merged = [];
          for (const seg of segments) {
            if (merged.length && seg.startLine <= merged[merged.length - 1].endLine + 1)
              merged[merged.length - 1].endLine = Math.max(merged[merged.length - 1].endLine, seg.endLine);
            else merged.push({ ...seg });
          }
          for (const seg of merged) {
            await prisma.mossMatchSegment.create({
              data: {
                id: "seg-" + Date.now() + "-" + Math.random().toString(36).slice(2),
                mossMatchId: savedMatch.id, side,
                startLine: seg.startLine, endLine: seg.endLine,
              },
            });
          }
        }
        count++;
        // Small delay between fetching match detail pages to avoid hammering MOSS
        await new Promise(r => setTimeout(r, 500));
      }

      await prisma.mossRun.update({ where: { id: runId }, data: { status: "COMPLETED" } });
      console.log("[" + new Date().toLocaleTimeString() + "] Done! Saved", count, "matches for run", runId);
      await prisma.$disconnect();
    });

  } catch (e) {
    console.error("Fatal error:", e.message);
    try {
      await prisma.mossRun.update({ where: { id: runId }, data: { status: "FAILED", errorText: e.message } });
      await prisma.$disconnect();
    } catch {}
  }
}

const projectId = process.argv[2];
const runId = process.argv[3];
if (!projectId || !runId) { console.error("Usage: node runner-by-runid.js <projectId> <runId>"); process.exit(1); }
runMoss(projectId, runId);