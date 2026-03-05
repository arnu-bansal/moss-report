const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function check() {
  const run = await prisma.mossRun.findFirst({
    where: { status: "COMPLETED" },
    orderBy: { createdAt: "desc" },
    include: { matches: { include: { segments: true } } }
  });
  console.log(JSON.stringify(run.matches.map(m => ({
    percentA: m.percentA,
    segments: m.segments
  })), null, 2));
  await prisma.$disconnect();
}
check();
