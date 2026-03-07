const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const projectId = process.argv[2];
const runId = process.argv[3];

if (!projectId || !runId) { console.error("Usage: node runner-by-runid.js <projectId> <runId>"); process.exit(1); }

process.env.DATABASE_URL = process.env.DATABASE_URL || "postgres://e090abc9d5a5606d19ed67103590bcfe7537f3aeee775158608124218dcf93e0:sk_MXWjEBecCd0XpgUaKo9d2@db.prisma.io:5432/postgres?sslmode=require";

function getDB() {
  const { PrismaPg } = require("@prisma/adapter-pg");
  const { PrismaClient } = require("@prisma/client");
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
    const filename = ver.id + "." + lang;
    const filepath = path.join(tmpDir, filename);
    fs.writeFileSync(filepath, ver.code);
    files.push(filepath);
    console.log("  Wrote:", filename);
  }

  if (files.length < 2) {
    console.log("Not enough submissions:", files.length);
    await prisma.mossRun.update({ where: { id: runId }, data: { status: "FAILED", errorText: "Not enough submissions" } });
    await prisma.$disconnect();
    return;
  }

  const mossScript = path.join(__dirname, "moss.pl");
  const args = [mossScript, "-l", lang, ...files];
  console.log("  Running MOSS with", files.length, "files...");

  await new Promise((resolve) => {
    let output = "";
    const proc = spawn("perl", args, { timeout: 300000 });

    proc.stdout.on("data", (data) => {
      output += data.toString();
      process.stdout.write(data);
    });

    proc.stderr.on("data", (data) => {
      process.stderr.write(data);
    });

    proc.on("close", async (code) => {
      console.log("\\nMOSS process exited with code:", code);
      console.log("Full output:", JSON.stringify(output));

      const urlMatch = output.match(/http:\/\/moss\.stanford\.edu\/results\/\S+/);
      if (!urlMatch) {
        console.log("No MOSS URL found in output");
        try { await prisma.mossRun.update({ where: { id: runId }, data: { status: "FAILED", errorText: "No URL returned: " + output.slice(0, 200) } }); } catch(e) { console.error(e.message); }
        await prisma.$disconnect();
        fs.rmSync(tmpDir, { recursive: true, force: true });
        resolve();
        return;
      }

      const mossUrl = urlMatch[0].trim();
      console.log("  MOSS URL:", mossUrl);

      // Fetch and parse results
      try {
        const http = require("http");
        const html = await new Promise((res, rej) => {
          http.get(mossUrl, (r) => {
            let d = "";
            r.on("data", c => d += c);
            r.on("end", () => res(d));
          }).on("error", rej);
        });

        const matchRegex = /href="(http:\/\/moss\.stanford\.edu\/results\/[^"]+)">([^<]+)<\/a>[^<]*<\/td>\s*<td[^>]*>(\d+)%<\/td>\s*<td[^>]*>(\d+)%/g;
        let m;
        let matchCount = 0;
        while ((m = matchRegex.exec(html)) !== null) {
          const matchUrl = m[1];
          const filesStr = m[2];
          const percentA = parseInt(m[3]);
          const percentB = parseInt(m[4]);

          const fileMatch = filesStr.match(/([^\s(]+)\s*\((\d+)%\)[^(]+\((\d+)%\)/);
          if (!fileMatch) continue;

          const fileA = path.basename(fileMatch[1]).replace("." + lang, "");
          const fileB = path.basename(filesStr.split(" ").find(s => s.includes(".")) || "").replace("." + lang, "");

          const versionA = fileA;
          const versionB = fileB;

          const existing = await prisma.mossMatch.findFirst({ where: { runId, submissionVersionAId: versionA, submissionVersionBId: versionB } });
          if (existing) continue;

          await prisma.mossMatch.create({
            data: { runId, submissionVersionAId: versionA, submissionVersionBId: versionB, percentA, percentB, linesMatched: 0, matchUrl }
          });
          matchCount++;
        }

        await prisma.mossRun.update({ where: { id: runId }, data: { status: "COMPLETED", mossUrl, matchCount } });
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

main().catch(async (e) => {
  console.error("Fatal error:", e.message);
  process.exit(1);
});