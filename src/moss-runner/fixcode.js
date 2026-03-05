const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function fix() {
  const versions = await prisma.submissionVersion.findMany();
  for (const v of versions) {
    // Replace multiple spaces that look like newlines with actual newlines
    const fixed = v.code
      .replace(/\s{4,}/g, "\n")  // 4+ spaces -> newline
      .replace(/\}\s+\{/g, "}\n{")
      .replace(/;\s+/g, ";\n");
    await prisma.submissionVersion.update({
      where: { id: v.id },
      data: { code: fixed }
    });
    console.log("Fixed version:", v.id);
  }
  await prisma.$disconnect();
  console.log("Done!");
}

fix();
