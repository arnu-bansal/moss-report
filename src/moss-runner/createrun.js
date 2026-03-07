const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
prisma.mossRun.create({ data: { projectId: "cmmdjrskd000204l58fhn6vqq", status: "QUEUED" } }).then(function(r) {
  console.log("RUN ID:", r.id);
  prisma.$disconnect();
});