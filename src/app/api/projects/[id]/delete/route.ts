import { NextRequest, NextResponse } from "next/server";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

export const runtime = "nodejs";

function getDB() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await context.params;
    const prisma = getDB();
    const matches = await prisma.mossMatch.findMany({ where: { mossRun: { projectId } }, select: { id: true } });
    const matchIds = matches.map(m => m.id);
    if (matchIds.length) await prisma.mossMatchSegment.deleteMany({ where: { mossMatchId: { in: matchIds } } });
    await prisma.mossMatch.deleteMany({ where: { mossRun: { projectId } } });
    await prisma.mossRun.deleteMany({ where: { projectId } });
    const subs = await prisma.submission.findMany({ where: { projectId }, select: { id: true } });
    const subIds = subs.map(s => s.id);
    if (subIds.length) await prisma.submissionVersion.deleteMany({ where: { submissionId: { in: subIds } } });
    await prisma.submission.deleteMany({ where: { projectId } });
    await prisma.projectMember.deleteMany({ where: { projectId } });
    await prisma.project.delete({ where: { id: projectId } });
    await prisma.$disconnect();
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}