import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { exec } from "child_process";
import path from "path";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { projectId } = await req.json();
    const existing = await prisma.mossRun.findFirst({ where: { projectId, status: "RUNNING" } });
    if (existing) return NextResponse.json({ error: "Already running" }, { status: 409 });
    const run = await prisma.mossRun.create({ data: { projectId, status: "QUEUED" } });
    const runnerPath = path.join(process.cwd(), "src", "moss-runner", "runner.js");
    exec(`node ${runnerPath} ${projectId}`, { env: { ...process.env } });
    return NextResponse.json({ run });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
