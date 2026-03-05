import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const runs = await prisma.mossRun.findMany({ orderBy: { createdAt: "desc" }, take: 20 });
    return NextResponse.json({ runs });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
