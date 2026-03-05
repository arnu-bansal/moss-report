const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const http = require("http");

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
  console.log("Running MOSS for project:", projectId, "runId:", runId);
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
      console.log("Need at least 2 submissions.");
      await prisma.mossRun.update({ where: { id: runId }, data: { status: "FAILED", errorText: "Need at least 2 submissions" } });
      await prisma.$disconnect();
      return;
    }

    // Get project language
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    const lang = project?.language || "java";
    const ext = { java: ".java", c: ".c", cpp: ".cpp", python: ".py", javascript: ".js", typescript: ".ts", txt: ".txt" }[lang] || ".java";
    const mossLang = { java: "java", c: "c", cpp: "cc", python: "python", javascript: "javascript", typescript: "javascript", txt: "ascii" }[lang] || "java";

    const tmpDir = path.join(__dirname, "tmp");
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

    for (const sub of submissions) {
      const version = sub.versions[0];
      if (!version) continue;
      const filePath = path.join(tmpDir, sub.userId + ext);
      fs.writeFileSync(filePath, version.code);
      console.log("Wrote:", filePath);
    }

    const mossScript = path.join(__dirname, "moss.pl");
    const files = submissions.filter(s => s.versions[0]).map(s => path.join(tmpDir, s.userId + ext)).join(" ");
    const cmd = "perl " + mossScript + " -l " + mossLang + " " + files;
    console.log("Running:", cmd);

    exec(cmd, async (err, stdout) => {
      if (err) {
        console.error("MOSS error:", err);
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
      console.log("MOSS URL:", mossUrl);

      // Parse results
      const indexHtml = await fetchHtml(mossUrl.endsWith("/") ? mossUrl : mossUrl + "/");
      const rows = indexHtml.split("<TR>").slice(2);
      let count = 0;

      for (const row of rows) {
        if (!row.includes("HREF")) continue;
        const hrefMatch = row.match(/HREF="([^"]+)"/);
        const percents = [...row.matchAll(/\((\d+)%\)/g)].map(m => parseInt(m[1]));
        const files2 = [...row.matchAll(/tmp[/\\]([^.]+)\.[a-z]+/g)].map(m => m[1]);
        if (!hrefMatch || percents.length < 2 || files2.length < 2) continue;

        const matchUrl = hrefMatch[1];
        const userA = files2[0], userB = files2[1];
        const percentA = percents[0], percentB = percents[1];
        console.log("Match:", userA, percentA + "%", "vs", userB, percentB + "%");

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
            if (merged.length && seg.startLine <= merged[merged.length-1].endLine + 1)
              merged[merged.length-1].endLine = Math.max(merged[merged.length-1].endLine, seg.endLine);
            else merged.push({...seg});
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
      }

      await prisma.mossRun.update({ where: { id: runId }, data: { status: "COMPLETED" } });
      console.log("Done! Saved", count, "matches.");
      await prisma.$disconnect();
    });
  } catch (e) {
    console.error("Error:", e);
    await prisma.mossRun.update({ where: { id: runId }, data: { status: "FAILED", errorText: e.message } }).catch(() => {});
    await prisma.$disconnect();
  }
}

const projectId = process.argv[2];
const runId = process.argv[3];
if (!projectId || !runId) { console.error("Usage: node runner-by-runid.js <projectId> <runId>"); process.exit(1); }
runMoss(projectId, runId);