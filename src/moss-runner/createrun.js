const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
prisma.mossRun.create({ data: { projectId: "cmmglri82000004l28qidx7f1", status: "QUEUED" } }).then(function(r) {
  console.log("RUN ID:", r.id);
  prisma.$disconnect();
});