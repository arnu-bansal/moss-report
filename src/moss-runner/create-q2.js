const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
async function main() {
  // Find admin user
  const admin = await prisma.user.findFirst({ where: { role: "admin" } });
  console.log("Admin:", admin.email);
  const newProject = await prisma.project.create({
    data: {
      name: "DSAS26 ASS2 Q2",
      description: "DSA Assignment 2 Q2",
      language: "c",
      createdById: admin.id,
    }
  });
  console.log("New project ID:", newProject.id);
  await prisma.$disconnect();
}
main().catch(e => { console.error(e.message); process.exit(1); });