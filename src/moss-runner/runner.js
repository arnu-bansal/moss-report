const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const http = require("http");

const DB_URL = process.env.DATABASE_URL;

async function runMoss(projectId) {
  console.log("Starting MOSS run for project:", projectId);

  const { PrismaClient } = require("@prisma/client");
  const { PrismaPg } = require("@prisma/adapter-pg");
  const adapter = new PrismaPg({ connectionString: DB_URL });
  const prisma = new PrismaClient({ adapter });

  const submissions = await prisma.submission.findMany({
    where: { projectId },
    include: {
      versions: {
        orderBy: { versionNumber: "desc" },
        take: 1,
      },
    },
  });

  if (submissions.length < 2) {
    console.log("Need at least 2 submissions to run MOSS.");
    await prisma.$disconnect();
    return;
  }

  const tmpDir = path.join(__dirname, "tmp");
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

  for (const sub of submissions) {
    const version = sub.versions[0];
    if (!version) continue;
    const filePath = path.join(tmpDir, `${sub.userId}.java`);
    fs.writeFileSync(filePath, version.code);
    console.log("Wrote file:", filePath);
  }

  const mossScript = path.join(__dirname, "moss.pl");
  const files = submissions
    .map((s) => path.join(tmpDir, `${s.userId}.java`))
    .join(" ");

  const cmd = `perl ${mossScript} -l java ${files}`;
  console.log("Running:", cmd);

  exec(cmd, async (err, stdout, stderr) => {
    if (err) {
      console.error("MOSS error:", err);
      await prisma.$disconnect();
      return;
    }

    const urlMatch = stdout.match(/http:\/\/moss\.stanford\.edu\/results\/\S+/);
    if (!urlMatch) {
      console.error("No MOSS URL found:", stdout);
      await prisma.$disconnect();
      return;
    }

    const mossUrl = urlMatch[0].trim();
    console.log("MOSS URL:", mossUrl);

    const run = await prisma.mossRun.create({
      data: {
        id: `run-${Date.now()}`,
        projectId,
        status: "COMPLETED",
      },
    });

    await parseMossResults(mossUrl, run.id, submissions, prisma);
    await prisma.$disconnect();
    console.log("Done!");
  });
}

async function parseMossResults(mossUrl, runId, submissions, prisma) {
  if (!mossUrl.endsWith("/")) mossUrl += "/";

  return new Promise((resolve) => {
    function fetchUrl(url) {
      http.get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          console.log("Redirecting to:", res.headers.location);
          fetchUrl(res.headers.location);
          return;
        }

        let html = "";
        res.on("data", (chunk) => { html += chunk; });
        res.on("end", async () => {
          try {
            const rows = html.split("<TR>").slice(2);
            let count = 0;

            for (const row of rows) {
              if (!row.includes("HREF")) continue;

              const hrefMatch = row.match(/HREF="([^"]+)"/);
              const percents = [...row.matchAll(/\((\d+)%\)/g)].map(m => parseInt(m[1]));
              const files = [...row.matchAll(/tmp[/\\]([^.]+)\.java/g)].map(m => m[1]);
              const linesMatch = row.match(/ALIGN=right>(\d+)/);

              if (!hrefMatch || percents.length < 2 || files.length < 2 || !linesMatch) continue;

              const matchUrl = hrefMatch[1];
              const userA = files[0];
              const userB = files[1];
              const percentA = percents[0];
              const percentB = percents[1];

              console.log(`Found match: ${userA}(${percentA}%) vs ${userB}(${percentB}%)`);

              const subA = submissions.find((s) => s.userId === userA);
              const subB = submissions.find((s) => s.userId === userB);
              if (!subA || !subB) { console.log("No sub found for", userA, userB); continue; }

              const verA = subA.versions[0];
              const verB = subB.versions[0];
              if (!verA || !verB) continue;

              const savedMatch = await prisma.mossMatch.create({
                data: {
                  id: `match-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                  mossRunId: runId,
                  submissionVersionAId: verA.id,
                  submissionVersionBId: verB.id,
                  percentA,
                  percentB,
                  mossMatchUrl: matchUrl,
                },
              });

              // Parse exact line segments from match detail page
              await parseMatchSegments(matchUrl, savedMatch.id, prisma);

              console.log(`Saved match: ${userA}(${percentA}%) vs ${userB}(${percentB}%)`);
              count++;
            }

            console.log(`Parsing complete! Saved ${count} matches.`);
            resolve();
          } catch (err) {
            console.error("Parse error:", err);
            resolve();
          }
        });
      }).on("error", (e) => { console.error("HTTP error:", e); resolve(); });
    }

    fetchUrl(mossUrl);
  });
}

async function parseMatchSegments(matchUrl, mossMatchId, prisma) {
  return new Promise((resolve) => {
    const detailUrl = matchUrl.replace(".html", "-0.html");

    function fetchDetail(url) {
      http.get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          fetchDetail(res.headers.location);
          return;
        }
        let html = "";
        res.on("data", (chunk) => { html += chunk; });
        res.on("end", async () => {
          try {
            const blockRegex = /<A NAME="(\d+)"><\/A><FONT[^>]+>([\s\S]*?)<\/FONT>/gi;
            let match;
            let count = 0;
            while ((match = blockRegex.exec(html)) !== null) {
              const startLine = parseInt(match[1]) + 1;
              const lines = match[2].split("\n").length;
              const endLine = startLine + lines - 1;

              await prisma.mossMatchSegment.create({
                data: {
                  id: `seg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                  mossMatchId,
                  side: "A",
                  startLine,
                  endLine,
                },
              });
              count++;
            }
            console.log(`Saved ${count} segments for match ${mossMatchId}`);
            resolve();
          } catch (err) {
            console.error("Segment parse error:", err);
            resolve();
          }
        });
      }).on("error", (e) => { console.error("Detail fetch error:", e); resolve(); });
    }

    fetchDetail(detailUrl);
  });
}

const projectId = process.argv[2] || "project-1";
runMoss(projectId);