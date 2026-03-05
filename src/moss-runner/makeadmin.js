const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
async function fix() {
  const r = await prisma.user.updateMany({
    where: { email: "arnavbansal2007@gmail.com" },
    data: { role: "admin" }
  });
  console.log("Updated:", r.count, "users to admin");
  await prisma.$disconnect();
}
fix();
