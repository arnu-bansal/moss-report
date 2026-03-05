import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";

let prisma: any;
async function getPrisma() {
  if (!prisma) {
    const { default: pkg } = await import("@prisma/client");
    const { PrismaClient } = pkg;
    prisma = new PrismaClient();
  }
  return prisma;
}

export async function POST(req: NextRequest) {
  try {
    const { projectId } = await req.json();
    const db = await getPrisma();

    const existing = await db.mossRun.findFirst({
      where: { projectId, status: "RUNNING" }
    });
    if (existing) return NextResponse.json({ error: "A MOSS run is already in progress" }, { status: 409 });

    const run = await db.mossRun.create({
      data: { projectId, status: "QUEUED" }
    });

    const runnerPath = path.join(process.cwd(), "src", "moss-runner", "runner.js");
    exec(`node ${runnerPath} ${projectId}`, { env: { ...process.env } }, (err) => {
      if (err) console.error("Runner error:", err);
    });

    return NextResponse.json({ run });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
