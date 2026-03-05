import { NextResponse } from "next/server";

let prisma: any;
async function getPrisma() {
  if (!prisma) {
    const { default: pkg } = await import("@prisma/client");
    const { PrismaClient } = pkg;
    prisma = new PrismaClient();
  }
  return prisma;
}

export async function GET() {
  try {
    const db = await getPrisma();
    const runs = await db.mossRun.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return NextResponse.json({ runs });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
