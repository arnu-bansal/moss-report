import { NextRequest, NextResponse } from "next/server";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

export const runtime = "nodejs";

function getDB() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

export async function GET(req: NextRequest) {
  try {
    const prisma = getDB();
    const [users, projects, submissions, runs] = await Promise.all([
      prisma.user.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, name: true, email: true, role: true, createdAt: true } }),
      prisma.project.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { submissions: true, mossRuns: true } } } }),
      prisma.submission.findMany({ orderBy: { createdAt: "desc" }, include: { user: { select: { name: true, email: true } }, versions: { orderBy: { versionNumber: "desc" }, take: 1 } } }),
      prisma.mossRun.findMany({ orderBy: { createdAt: "desc" }, take: 50, include: { _count: { select: { matches: true } }, project: { select: { name: true, language: true } } } }),
    ]);
    await prisma.$disconnect();
    return NextResponse.json({ users, projects, submissions, runs });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}