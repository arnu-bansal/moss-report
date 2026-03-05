import { NextRequest, NextResponse } from "next/server";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { exec } from "child_process";
import path from "path";

export const runtime = "nodejs";

function getDB() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await context.params;
    const { userId } = await req.json();
    const prisma = getDB();

    const existing = await prisma.mossRun.findFirst({ where: { projectId, status: { in: ["RUNNING", "QUEUED"] } } });
    if (existing) { await prisma.$disconnect(); return NextResponse.json({ error: "A run is already in progress" }, { status: 409 }); }

    const run = await prisma.mossRun.create({ data: { projectId, status: "QUEUED", triggeredBy: userId || "unknown" } });
    await prisma.$disconnect();

    // Try to run locally if on server with access
    const runnerPath = path.join(process.cwd(), "src", "moss-runner", "runner.js");
    exec(`node ${runnerPath} ${projectId}`, { env: { ...process.env } }, (err) => {
      if (err) console.error("Runner error:", err.message);
    });

    return NextResponse.json({ run, message: "MOSS run queued. If running locally, results appear in ~30 seconds." });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
