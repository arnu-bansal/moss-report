import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function POST(request: NextRequest) {
  try {
    const { code, projectId, userId } = await request.json();

    if (!code || !projectId || !userId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Get or create submission
    let submission = await prisma.submission.findFirst({
      where: { userId, projectId },
      include: { versions: true },
    });

    if (!submission) {
      submission = await prisma.submission.create({
        data: {
          id: `sub-${Date.now()}`,
          userId,
          projectId,
        },
        include: { versions: true },
      });
    }

    // Get next version number
    const versionNumber = (submission.versions?.length || 0) + 1;

    // Create new version
    const version = await prisma.submissionVersion.create({
      data: {
        id: `ver-${Date.now()}`,
        submissionId: submission.id,
        versionNumber,
        code,
        isFinal: true,
      },
    });

    // Update latestVersionId
    await prisma.submission.update({
      where: { id: submission.id },
      data: { latestVersionId: version.id },
    });

    return NextResponse.json({ version });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}