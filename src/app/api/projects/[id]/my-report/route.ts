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

    const latestRun = await prisma.mossRun.findFirst({
      where: { projectId, status: "COMPLETED" },
      orderBy: { createdAt: "desc" },
      include: { matches: { include: { segments: true } } }
    });

    if (!latestRun) {
      await prisma.$disconnect();
      return NextResponse.json({ error: "No MOSS run found" }, { status: 404 });
    }

    const mySubmission = await prisma.submission.findFirst({
      where: { projectId, userId },
      include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } }
    });

    if (!mySubmission || !mySubmission.versions[0]) {
      await prisma.$disconnect();
      return NextResponse.json({ error: "You have not submitted code for this project" }, { status: 404 });
    }

    const myVersionId = mySubmission.versions[0].id;

    // Normalize all matches so MY code is always side A
    const myMatches = [];
    for (const match of latestRun.matches) {
      const iAmA = match.submissionVersionAId === myVersionId;
      const iAmB = match.submissionVersionBId === myVersionId;
      if (!iAmA && !iAmB) continue;

      if (iAmA) {
        // Already correct orientation
        myMatches.push(match);
      } else {
        // I am side B — flip it so I become side A
        const flipped = {
          ...match,
          submissionVersionAId: match.submissionVersionBId,
          submissionVersionBId: match.submissionVersionAId,
          percentA: match.percentB,
          percentB: match.percentA,
          segments: match.segments.map(s => ({
            ...s,
            side: s.side === "A" ? "B" : "A", // flip segment sides too
          })),
        };
        myMatches.push(flipped);
      }
    }

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