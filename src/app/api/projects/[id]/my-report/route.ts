import { NextRequest, NextResponse } from "next/server";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

export const runtime = "nodejs";

function getDB() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await context.params;
    const prisma = getDB();

    const latestRun = await prisma.mossRun.findFirst({
      where: { projectId, status: "COMPLETED" },
      orderBy: { createdAt: "desc" },
      include: { matches: { include: { segments: true } } }
    });

    if (!latestRun) return NextResponse.json({ error: "No MOSS run found" }, { status: 404 });

    const versionIds = [...new Set(latestRun.matches.map((m: any) => m.submissionVersionAId))];
    const versions = await prisma.submissionVersion.findMany({ where: { id: { in: versionIds } } });

    await prisma.$disconnect();
    return NextResponse.json({ ...latestRun, versions });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
