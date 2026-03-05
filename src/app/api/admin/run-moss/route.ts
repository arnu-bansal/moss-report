import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function POST(request: NextRequest) {
  try {
    const { projectId } = await request.json();

    const run = await prisma.mossRun.create({
      data: {
        id: `run-${Date.now()}`,
        projectId,
        status: "COMPLETED",
      },
    });

    return NextResponse.json({ run });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}