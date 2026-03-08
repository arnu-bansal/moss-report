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
    const adminView = req.nextUrl.searchParams.get("adminView") === "true";
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    const prisma = getDB();

    const latestRun = await prisma.mossRun.findFirst({
      where: { projectId, status: "COMPLETED" },
      orderBy: { createdAt: "desc" },
      include: { matches: { include: { segments: true }, orderBy: { createdAt: "desc" } } }
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

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });
    const isAdmin = currentUser?.role === "admin";

    const allSubmissions = await prisma.submission.findMany({
      where: { projectId },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        versions: { orderBy: { versionNumber: "desc" }, take: 1 }
      }
    });

    const versionToUser: Record<string, { name: string; email: string; role: string }> = {};
    for (const sub of allSubmissions) {
      if (sub.versions[0]) {
        versionToUser[sub.versions[0].id] = {
          name: sub.user.name,
          email: sub.user.email,
          role: sub.user.role,
        };
      }
    }

    const REVEAL_THRESHOLD = 35;

    const myMatches = [];
    for (const match of latestRun.matches) {
      const iAmA = match.submissionVersionAId === myVersionId;
      const iAmB = match.submissionVersionBId === myVersionId;
      if (!adminView && !iAmA && !iAmB) continue;

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
      const isAiMatch = otherUser?.role === "ai";
      const isHighMatch = normalized.percentA >= REVEAL_THRESHOLD;

      // Always reveal AI model names, admin sees all, students see above threshold
      normalized.revealedUser = (isAdmin || isHighMatch || isAiMatch) && otherUser
        ? { name: otherUser.name, email: otherUser.email, role: otherUser.role }
        : null;
      normalized.isHighMatch = isHighMatch;
      normalized.isAiMatch = isAiMatch;
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
