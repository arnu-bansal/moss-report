const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
const { exec } = require("child_process");
const path = require("path");

const DB_URL = process.env.DATABASE_URL;

async function getDB() {
  const adapter = new PrismaPg({ connectionString: DB_URL });
  return new PrismaClient({ adapter });
}

async function processQueue() {
  const prisma = await getDB();
  const queued = await prisma.mossRun.findFirst({
    where: { status: "QUEUED" },
    orderBy: { createdAt: "asc" }
  });

  if (!queued) {
    await prisma.$disconnect();
    return;
  }

  console.log("Processing run:", queued.id, "for project:", queued.projectId);
  await prisma.mossRun.update({ where: { id: queued.id }, data: { status: "RUNNING" } });
  await prisma.$disconnect();

  const runnerPath = path.join(__dirname, "runner-by-runid.js");
  exec("node " + runnerPath + " " + queued.projectId + " " + queued.id, { env: { ...process.env } }, (err) => {
    if (err) console.error("Runner error:", err.message);
  });
}

console.log("Watcher started. Polling every 5 seconds...");
setInterval(processQueue, 5000);
processQueue();