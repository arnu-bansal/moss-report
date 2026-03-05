import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await context.params;

    const latestRun = await prisma.mossRun.findFirst({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      include: {
        matches: {
          include: { segments: true }
        }
      }
    });

    if (!latestRun) return NextResponse.json({ error: "No MOSS run found" }, { status: 404 });

    // Get all unique submissionVersionIds from matches (side A)
    const versionIds = [...new Set(latestRun.matches.map((m: any) => m.submissionVersionAId))];

    // Get the actual code for each version
    const versions = await prisma.submissionVersion.findMany({
      where: { id: { in: versionIds } }
    });

    return NextResponse.json({ ...latestRun, versions });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
