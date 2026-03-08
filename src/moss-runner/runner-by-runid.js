const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const http = require("http");

const projectId = process.argv[2];
const runId = process.argv[3];
if (!projectId || !runId) { console.error("Usage: node runner-by-runid.js <projectId> <runId>"); process.exit(1); }

process.env.DATABASE_URL = process.env.DATABASE_URL || "postgres://e090abc9d5a5606d19ed67103590bcfe7537f3aeee775158608124218dcf93e0:sk_MXWjEBecCd0XpgUaKo9d2@db.prisma.io:5432/postgres?sslmode=require";

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) return fetchUrl(res.headers.location).then(resolve).catch(reject);
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => resolve(data));
    }).on("error", reject);
  });
}

function parseSegmentsFromTop(html) {
  const segments = [];
  const regex = /TARGET="(\d+)">(\d+)-(\d+)<\/A>/g;
  let m;
  while ((m = regex.exec(html)) !== null) {
    segments.push({ side: m[1] === "0" ? "A" : "B", startLine: parseInt(m[2]), endLine: parseInt(m[3]) });
  }
  return segments;
}

function getDB() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

async function main() {
  const prisma = getDB();
  console.log("[" + new Date().toLocaleTimeString() + "] Starting MOSS for project:", projectId, "run:", runId);

  const submissions = await prisma.submission.findMany({
    where: { projectId },
    include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } }
  });

  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { language: true } });
  const lang = project?.language || "c";

  const tmpDir = path.join(__dirname, "tmp", runId);
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  const files = [];
  for (const sub of submissions) {
    const ver = sub.versions[0];
    if (!ver || !ver.code) continue;
    const filepath = path.join(tmpDir, ver.id + "." + lang);
    fs.writeFileSync(filepath, ver.code);
    files.push(filepath);
    console.log("  Wrote:", ver.id + "." + lang);
  }

  if (files.length < 2) {
    await prisma.mossRun.update({ where: { id: runId }, data: { status: "FAILED", errorText: "Not enough submissions: " + files.length } });
    await prisma.$disconnect();
    fs.rmSync(tmpDir, { recursive: true, force: true });
    return;
  }

  const mossScript = path.join(__dirname, "moss.pl");
  console.log("  Running MOSS with", files.length, "files...");

  await new Promise((resolve) => {
    let output = "";
    const proc = spawn("perl", [mossScript, "-l", lang, ...files]);
    proc.stdout.on("data", (data) => { output += data.toString(); process.stdout.write(data); });
    proc.stderr.on("data", (data) => { process.stderr.write(data); });

    proc.on("close", async (code) => {
      console.log("\nMOSS exited:", code);
      const urlMatch = output.match(/http:\/\/moss\.stanford\.edu\/results\/[^\s]+/);
      if (!urlMatch) {
        await prisma.mossRun.update({ where: { id: runId }, data: { status: "FAILED", errorText: "No URL: " + output.slice(0, 300) } });
        await prisma.$disconnect();
        fs.rmSync(tmpDir, { recursive: true, force: true });
        resolve();
        return;
      }

      let mossUrl = urlMatch[0].trim();
      if (!mossUrl.endsWith("/")) mossUrl += "/";
      console.log("  MOSS URL:", mossUrl);

      try {
        const html = await fetchUrl(mossUrl);
        const matchRegex = /href="(http:\/\/moss\.stanford\.edu\/results\/[^"]+match\d+\.html)">[^<]*?([^\\/]+)\s*\((\d+)%\)<\/A>\s*<TD><A[^>]+>[^<]*?([^\\/]+)\s*\((\d+)%\)/gi;
        let m;
        let matchCount = 0;

        while ((m = matchRegex.exec(html)) !== null) {
          const matchUrl = m[1];
          const fileA = m[2].trim().replace("." + lang, "");
          const fileB = m[4].trim().replace("." + lang, "");
          const percentA = parseInt(m[3]);
          const percentB = parseInt(m[5]);
          await prisma.mossMatch.deleteMany({ where: { mossRunId: runId, submissionVersionAId: fileA, submissionVersionBId: fileB } }); console.log("  Match:", fileA, percentA + "%", "<->", fileB, percentB + "%");

          try {
            const mossMatch = await prisma.mossMatch.create({
              data: { submissionVersionAId: fileA, submissionVersionBId: fileB, percentA, percentB, mossMatchUrl: matchUrl, mossRunId: runId }
            });

            try {
              const topUrl = matchUrl.replace(".html", "-top.html");
              console.log("    Fetching segments:", topUrl);
              const topHtml = await fetchUrl(topUrl);
              const segments = parseSegmentsFromTop(topHtml);
              console.log("    Segments:", segments.length);
              for (const seg of segments) {
                try {
                  await prisma.mossMatchSegment.create({
                    data: { mossMatchId: mossMatch.id, side: seg.side, startLine: seg.startLine, endLine: seg.endLine }
                  });
                } catch(e) { console.error("    Segment error:", e.message); }
              }
            } catch(e) { console.error("    Segment fetch error:", e.message); }

            matchCount++;
          } catch(e) { console.error("  Match error:", e.message); }
        }

        await prisma.mossRun.update({ where: { id: runId }, data: { status: "COMPLETED" } });
        console.log("Done! Saved", matchCount, "matches.");
      } catch(e) {
        console.error("Parse error:", e.message);
        await prisma.mossRun.update({ where: { id: runId }, data: { status: "FAILED", errorText: e.message } });
      }

      await prisma.$disconnect();
      fs.rmSync(tmpDir, { recursive: true, force: true });
      resolve();
    });

    proc.on("error", async (err) => {
      console.error("Spawn error:", err.message);
      await prisma.mossRun.update({ where: { id: runId }, data: { status: "FAILED", errorText: err.message } });
      await prisma.$disconnect();
      resolve();
    });
  });
}

main().catch(e => { console.error("Fatal:", e.message); process.exit(1); });
