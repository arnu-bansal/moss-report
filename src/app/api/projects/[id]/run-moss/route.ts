import { NextRequest, NextResponse } from "next/server";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

export const runtime = "nodejs";

function getDB() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await context.params;
    const { userId } = await req.json();
    const prisma = getDB();

    // Auto-clear runs stuck for more than 10 minutes
    await prisma.mossRun.updateMany({
      where: {
        projectId,
        status: { in: ["RUNNING", "QUEUED"] },
        createdAt: { lt: new Date(Date.now() - 10 * 60 * 1000) }
      },
      data: { status: "FAILED", errorText: "Timed out" }
    });

    // Cooldown: if a run completed in the last 2 minutes, return it instead of creating new one
    const recentCompleted = await prisma.mossRun.findFirst({
      where: {
        projectId,
        status: "COMPLETED",
        createdAt: { gt: new Date(Date.now() - 2 * 60 * 1000) }
      },
      orderBy: { createdAt: "desc" }
    });
    if (recentCompleted) {
      await prisma.$disconnect();
      return NextResponse.json({ run: recentCompleted, message: "Using recent run from " + Math.floor((Date.now() - new Date(recentCompleted.createdAt).getTime()) / 1000) + "s ago" });
    }

    // Check if already queued or running
    const inProgress = await prisma.mossRun.findFirst({
      where: { projectId, status: { in: ["QUEUED", "RUNNING"] } }
    });
    if (inProgress) {
      await prisma.$disconnect();
      return NextResponse.json({ run: inProgress, message: "Run already in progress" });
    }

    const run = await prisma.mossRun.create({
      data: { projectId, status: "QUEUED", triggeredBy: userId || "unknown" }
    });

    await prisma.$disconnect();
    return NextResponse.json({ run, message: "MOSS run queued." });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}