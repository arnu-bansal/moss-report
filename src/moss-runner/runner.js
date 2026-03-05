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
    include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
  });

  if (submissions.length < 2) {
    console.log("Need at least 2 submissions.");
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
  const files = submissions.filter(s => s.versions[0]).map(s => path.join(tmpDir, `${s.userId}.java`)).join(" ");
  const cmd = `perl ${mossScript} -l java ${files}`;
  console.log("Running:", cmd);

  exec(cmd, async (err, stdout) => {
    if (err) { console.error("MOSS error:", err); await prisma.$disconnect(); return; }
    const urlMatch = stdout.match(/http:\/\/moss\.stanford\.edu\/results\/\S+/);
    if (!urlMatch) { console.error("No MOSS URL:", stdout); await prisma.$disconnect(); return; }
    const mossUrl = urlMatch[0].trim();
    console.log("MOSS URL:", mossUrl);

    const run = await prisma.mossRun.create({
      data: { id: `run-${Date.now()}`, projectId, status: "COMPLETED" },
    });

    await parseMossResults(mossUrl, run.id, submissions, prisma);
    await prisma.$disconnect();
    console.log("Done!");
  });
}

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

async function parseMossResults(mossUrl, runId, submissions, prisma) {
  if (!mossUrl.endsWith("/")) mossUrl += "/";
  const html = await fetchHtml(mossUrl);
  const rows = html.split("<TR>").slice(2);
  let count = 0;

  for (const row of rows) {
    if (!row.includes("HREF")) continue;
    const hrefMatch = row.match(/HREF="([^"]+)"/);
    const percents = [...row.matchAll(/\((\d+)%\)/g)].map(m => parseInt(m[1]));
    const files = [...row.matchAll(/tmp[/\\]([^.]+)\.java/g)].map(m => m[1]);
    if (!hrefMatch || percents.length < 2 || files.length < 2) continue;

    const matchUrl = hrefMatch[1];
    const userA = files[0], userB = files[1];
    const percentA = percents[0], percentB = percents[1];
    console.log(`Found match: ${userA}(${percentA}%) vs ${userB}(${percentB}%)`);

    const subA = submissions.find(s => s.userId === userA);
    const subB = submissions.find(s => s.userId === userB);
    if (!subA || !subB) continue;
    const verA = subA.versions[0], verB = subB.versions[0];
    if (!verA || !verB) continue;

    const savedMatch = await prisma.mossMatch.create({
      data: {
        id: `match-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        mossRunId: runId,
        submissionVersionAId: verA.id,
        submissionVersionBId: verB.id,
        percentA, percentB,
        mossMatchUrl: matchUrl,
      },
    });

    // Parse segments for side A (-0.html) and side B (-1.html)
    for (const [suffix, side] of [["-0.html", "A"], ["-1.html", "B"]]) {
      const detailUrl = matchUrl.replace(".html", suffix);
      const detailHtml = await fetchHtml(detailUrl);
      if (!detailHtml) continue;

      // Extract the PRE block content
      const preMatch = detailHtml.match(/<PRE>([\s\S]*?)<\/PRE>/i);
      if (!preMatch) continue;
      const preContent = preMatch[1];

      // Split into lines BEFORE the first highlight to count offset
      const segments = [];
      // Find each highlighted block: <A NAME="N">...</A><FONT ...>content</FONT>
      const highlightRegex = /<A NAME="\d+"[^>]*><\/A><FONT[^>]+>([\s\S]*?)<\/FONT>/gi;
      
      // Count lines before each highlight to get real line numbers
      let lastIndex = 0;
      let linesBefore = 0;
      let fm;
      
      // First count lines in the header (before PRE content starts with code)
      // The PRE block starts with a newline then the code
      const preLines = preContent.split("\n");
      
      // Re-parse: find FONT blocks and count real line numbers
      const fontBlocks = [];
      const fontRegex2 = /<FONT[^>]+COLOR[^>]+>([\s\S]*?)<\/FONT>/gi;
      let fm2;
      while ((fm2 = fontRegex2.exec(preContent)) !== null) {
        fontBlocks.push({ content: fm2[1], index: fm2.index });
      }

      for (const block of fontBlocks) {
        // Count newlines in preContent before this block
        const before = preContent.slice(0, block.index);
        const startLine = (before.match(/\n/g) || []).length + 1;
        // Count newlines inside the block
        const blockLines = (block.content.match(/\n/g) || []).length;
        const endLine = startLine + blockLines - 1;
        segments.push({ startLine, endLine });
        console.log(`  Side ${side}: lines ${startLine}-${endLine}`);
      }

      // Merge overlapping
      segments.sort((a, b) => a.startLine - b.startLine);
      const merged = [];
      for (const seg of segments) {
        if (merged.length && seg.startLine <= merged[merged.length-1].endLine + 1) {
          merged[merged.length-1].endLine = Math.max(merged[merged.length-1].endLine, seg.endLine);
        } else merged.push({...seg});
      }

      for (const seg of merged) {
        await prisma.mossMatchSegment.create({
          data: {
            id: `seg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            mossMatchId: savedMatch.id,
            side,
            startLine: seg.startLine,
            endLine: seg.endLine,
          },
        });
      }
      console.log(`  Saved ${merged.length} segments side ${side}`);
    }

    console.log(`Saved match: ${userA}(${percentA}%) vs ${userB}(${percentB}%)`);
    count++;
  }
  console.log(`Done! Saved ${count} matches.`);
}

const projectId = process.argv[2] || "project-1";
runMoss(projectId);
