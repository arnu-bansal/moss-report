const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
async function main() {
  const run = await prisma.mossRun.findFirst({
    where: { projectId: "cmmglri82000004l28qidx7f1", status: "COMPLETED" },
    orderBy: { createdAt: "desc" },
    include: { matches: { include: { segments: true } } }
  });
  console.log("Run:", run.id, "Matches:", run.matches.length);
  for (const m of run.matches) {
    console.log("  Match:", m.submissionVersionAId, m.percentA + "%", "<->", m.submissionVersionBId, m.percentB + "%");
    console.log("  Segments:", m.segments.length);
    m.segments.slice(0,3).forEach(s => console.log("    ", s.side, s.startLine, "-", s.endLine));
  }
  await prisma.$disconnect();
}
main().catch(e => console.error(e.message));
