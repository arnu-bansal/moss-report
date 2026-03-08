const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
async function main() {
  const runs = await prisma.mossRun.findMany({
    where: { status: "COMPLETED" },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, projectId: true, triggeredBy: true, createdAt: true }
  });
  console.log(JSON.stringify(runs, null, 2));
  await prisma.$disconnect();
}
main().catch(e => console.error(e.message));
