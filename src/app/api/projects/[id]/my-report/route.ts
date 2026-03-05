import { NextRequest, NextResponse } from "next/server";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

export const runtime = "nodejs";

function getDB() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await context.params;
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    const prisma = getDB();

    // Get the latest completed MOSS run
    const latestRun = await prisma.mossRun.findFirst({
      where: { projectId, status: "COMPLETED" },
      orderBy: { createdAt: "desc" },
      include: { matches: { include: { segments: true } } }
    });

    if (!latestRun) {
      await prisma.$disconnect();
      return NextResponse.json({ error: "No MOSS run found" }, { status: 404 });
    }

    // Find THIS user's submission and latest version
    const mySubmission = await prisma.submission.findFirst({
      where: { projectId, userId },
      include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } }
    });

    if (!mySubmission || !mySubmission.versions[0]) {
      await prisma.$disconnect();
      return NextResponse.json({ error: "You have not submitted code for this project" }, { status: 404 });
    }

    const myVersionId = mySubmission.versions[0].id;

    // Only return matches where MY version is side A (submissionVersionAId)
    const myMatches = latestRun.matches.filter(
      m => m.submissionVersionAId === myVersionId
    );

    await prisma.$disconnect();
    return NextResponse.json({
      ...latestRun,
      matches: myMatches,
      versions: [mySubmission.versions[0]],
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}