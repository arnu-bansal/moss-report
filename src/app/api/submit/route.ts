import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function POST(req: NextRequest) {
  try {
    const { projectId, code, userId } = await req.json();
    if (!code || !projectId) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    const sql = neon(process.env.DATABASE_URL!);
    const uid = userId || "anon-" + Math.random().toString(36).slice(2, 8);
    const existing = await sql`SELECT id FROM "Submission" WHERE "projectId"=${projectId} AND "userId"=${uid} LIMIT 1`;
    let submissionId: string;
    if (existing.length > 0) {
      submissionId = existing[0].id;
    } else {
      const newSub = await sql`INSERT INTO "Submission" (id, "userId", "projectId", "createdAt") VALUES (gen_random_uuid()::text, ${uid}, ${projectId}, now()) RETURNING id`;
      submissionId = newSub[0].id;
    }
    const lastVer = await sql`SELECT "versionNumber" FROM "SubmissionVersion" WHERE "submissionId"=${submissionId} ORDER BY "versionNumber" DESC LIMIT 1`;
    const versionNumber = (lastVer[0]?.versionNumber || 0) + 1;
    const newVer = await sql`INSERT INTO "SubmissionVersion" (id, "submissionId", "versionNumber", code, "isFinal", "createdAt") VALUES (gen_random_uuid()::text, ${submissionId}, ${versionNumber}, ${code}, true, now()) RETURNING id`;
    return NextResponse.json({ success: true, versionId: newVer[0].id, versionNumber });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
