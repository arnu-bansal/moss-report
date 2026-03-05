import { NextRequest, NextResponse } from "next/server";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

export const runtime = "nodejs";

function getDB() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

export async function GET(req: NextRequest) {
  try {
    const prisma = getDB();
    const submissions = await prisma.submission.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        project: { select: { name: true, language: true } },
        versions: { orderBy: { versionNumber: "desc" }, take: 1 },
      },
    });
    await prisma.$disconnect();
    return NextResponse.json({ submissions });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}