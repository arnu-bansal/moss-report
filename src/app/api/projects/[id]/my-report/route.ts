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

    // Get current user's role
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });
    const isAdmin = currentUser?.role === "admin";

    // Get all submissions to resolve user names
    const allSubmissions = await prisma.submission.findMany({
      where: { projectId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        versions: { orderBy: { versionNumber: "desc" }, take: 1 }
      }
    });

    const versionToUser: Record<string, { name: string; email: string }> = {};
    for (const sub of allSubmissions) {
      if (sub.versions[0]) {
        versionToUser[sub.versions[0].id] = { name: sub.user.name, email: sub.user.email };
      }
    }

    const REVEAL_THRESHOLD = 35; // reveal name if match >= 35% for students

    const myMatches = [];
    for (const match of latestRun.matches) {
      const iAmA = match.submissionVersionAId === myVersionId;
      const iAmB = match.submissionVersionBId === myVersionId;
      if (!iAmA && !iAmB) continue;

      let normalized: any;
      if (iAmA) {
        normalized = { ...match };
      } else {
        normalized = {
          ...match,
          submissionVersionAId: match.submissionVersionBId,
          submissionVersionBId: match.submissionVersionAId,
          percentA: match.percentB,
          percentB: match.percentA,
          segments: match.segments.map((s: any) => ({ ...s, side: s.side === "A" ? "B" : "A" })),
        };
      }

      const otherVersionId = normalized.submissionVersionBId;
      const otherUser = versionToUser[otherVersionId];
      const isHighMatch = normalized.percentA >= REVEAL_THRESHOLD;

      // Admin always sees names, students see names only above threshold
      normalized.revealedUser = (isAdmin || isHighMatch) && otherUser
        ? { name: otherUser.name, email: otherUser.email }
        : null;
      normalized.isHighMatch = isHighMatch;
      normalized.isAdmin = isAdmin;

      myMatches.push(normalized);
    }

    await prisma.$disconnect();
    return NextResponse.json({
      ...latestRun,
      matches: myMatches,
      versions: [mySubmission.versions[0]],
      isAdmin,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}