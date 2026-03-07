const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
async function main() {
  const oldProjectId = "cmmdjrskd000204l58fhn6vqq";
  
  // Create new project
  const oldProject = await prisma.project.findUnique({ where: { id: oldProjectId } });
  const newProject = await prisma.project.create({
    data: {
      name: oldProject.name + " (new)",
      description: oldProject.description,
      language: oldProject.language,
      createdById: oldProject.createdById,
    }
  });
  console.log("New project ID:", newProject.id);

  // Copy latest version of each submission
  const subs = await prisma.submission.findMany({
    where: { projectId: oldProjectId },
    include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } }
  });

  for (const sub of subs) {
    if (!sub.versions[0]) continue;
    const newSub = await prisma.submission.create({
      data: { projectId: newProject.id, userId: sub.userId }
    });
    await prisma.submissionVersion.create({
      data: {
        submissionId: newSub.id,
        versionNumber: 1,
        code: sub.versions[0].code,
        filename: sub.versions[0].filename,
      }
    });
    console.log("Copied submission for user:", sub.userId);
  }

  console.log("Done! New project:", newProject.id);
  await prisma.$disconnect();
}
main().catch(e => { console.error(e.message); process.exit(1); });