const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function clean() {
  await prisma.mossMatchSegment.deleteMany({});
  await prisma.mossMatch.deleteMany({});
  await prisma.mossRun.deleteMany({});
  await prisma.submissionVersion.deleteMany({});
  await prisma.submission.deleteMany({});
  console.log("Cleaned all data.");
  await prisma.$disconnect();
}
clean();
