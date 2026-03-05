const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
prisma.submission.findMany({ include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } } }).then(s => {
  console.log(JSON.stringify(s.map(x => ({ userId: x.userId, projectId: x.projectId, latestVersion: x.versions[0]?.id })), null, 2));
  prisma.$disconnect();
});
