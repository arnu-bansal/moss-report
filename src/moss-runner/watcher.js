const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
const { exec } = require("child_process");
const path = require("path");

process.env.DATABASE_URL = process.env.DATABASE_URL || "postgres://e090abc9d5a5606d19ed67103590bcfe7537f3aeee775158608124218dcf93e0:sk_MXWjEBecCd0XpgUaKo9d2@db.prisma.io:5432/postgres?sslmode=require";
const DB_URL = process.env.DATABASE_URL;

async function processQueue() {
  let prisma;
  try {
    const adapter = new PrismaPg({ connectionString: DB_URL });
    prisma = new PrismaClient({ adapter });

    const queued = await prisma.mossRun.findFirst({
      where: { status: "QUEUED" },
      orderBy: { createdAt: "asc" }
    });

    if (!queued) { await prisma.$disconnect(); return; }

    const updated = await prisma.mossRun.updateMany({
      where: { id: queued.id, status: "QUEUED" },
      data: { status: "RUNNING" }
    });

    if (updated.count === 0) { await prisma.$disconnect(); return; }

    console.log("[" + new Date().toLocaleTimeString() + "] Processing run:", queued.id, "project:", queued.projectId);
    await prisma.$disconnect();

    const runnerPath = path.join(__dirname, "runner-by-runid.js");
    exec("node " + runnerPath + " " + queued.projectId + " " + queued.id, {
      env: { ...process.env }
    }, (err, stdout) => {
      if (err) console.error("Runner error:", err.message);
      if (stdout) console.log(stdout);
    });

  } catch (e) {
    console.error("Watcher error:", e.message);
    try { await prisma?.$disconnect(); } catch {}
  }
}

async function clearStaleRuns() {
  try {
    const adapter = new PrismaPg({ connectionString: DB_URL });
    const prisma = new PrismaClient({ adapter });
    const r = await prisma.mossRun.updateMany({
      where: {
        status: { in: ["RUNNING", "QUEUED"] },
        createdAt: { lt: new Date(Date.now() - 10 * 60 * 1000) }
      },
      data: { status: "FAILED", errorText: "Timed out after 10 minutes" }
    });
    if (r.count > 0) console.log("Cleared", r.count, "stale runs");
    await prisma.$disconnect();
  } catch (e) {
    console.error("Stale clear error:", e.message);
  }
}

console.log("[" + new Date().toLocaleTimeString() + "] Moss watcher started.");
setInterval(processQueue, 5000);
setInterval(clearStaleRuns, 60000);
processQueue();