import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    const runs = await prisma.mossRun.findMany({ orderBy: { createdAt: "desc" }, take: 20 });
    await prisma.$disconnect();
    return NextResponse.json({ runs });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
