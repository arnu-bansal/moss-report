import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;

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