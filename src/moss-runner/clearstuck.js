const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
async function fix() {
  const r = await prisma.mossRun.updateMany({ where: { status: { in: ["QUEUED","RUNNING"] } }, data: { status: "FAILED", errorText: "Cleared stuck run" } });
  console.log("Cleared:", r.count, "runs");
  await prisma.$disconnect();
}
fix();
