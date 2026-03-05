import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { exec } from "child_process";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const { projectId } = await req.json();
    const sql = neon(process.env.DATABASE_URL!);
    const existing = await sql`SELECT id FROM "MossRun" WHERE "projectId"=${projectId} AND status="RUNNING" LIMIT 1`;
    if (existing.length > 0) return NextResponse.json({ error: "Already running" }, { status: 409 });
    const run = await sql`INSERT INTO "MossRun" (id, "projectId", status, "createdAt") VALUES (gen_random_uuid()::text, ${projectId}, "QUEUED", now()) RETURNING *`;
    const runnerPath = path.join(process.cwd(), "src", "moss-runner", "runner.js");
    exec(`node ${runnerPath} ${projectId}`, { env: { ...process.env } });
    return NextResponse.json({ run: run[0] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
