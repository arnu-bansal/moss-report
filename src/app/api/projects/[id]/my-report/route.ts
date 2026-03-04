import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client/edge";

const prisma = new PrismaClient();

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
          include: {
            segments: true,
          },
        },
      },
    });

    if (!latestRun) {
      return NextResponse.json({ error: "No MOSS run found" }, { status: 404 });
    }

    return NextResponse.json(latestRun);
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}