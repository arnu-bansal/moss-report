import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export async function GET() {
  try {
    const runs = await prisma.mossRun.findMany({
      orderBy: { createdAt: "desc" },
      include: { matches: true },
    });
    return NextResponse.json({ runs });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}