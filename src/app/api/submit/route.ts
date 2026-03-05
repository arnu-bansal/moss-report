import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { projectId, code, userId } = await req.json();
    if (!code || !projectId) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    const uid = userId || "anon-" + Math.random().toString(36).slice(2, 8);
    let submission = await prisma.submission.findFirst({ where: { projectId, userId: uid } });
    if (!submission) submission = await prisma.submission.create({ data: { projectId, userId: uid } });
    const lastVersion = await prisma.submissionVersion.findFirst({ where: { submissionId: submission.id }, orderBy: { versionNumber: "desc" } });
    const versionNumber = (lastVersion?.versionNumber || 0) + 1;
    const version = await prisma.submissionVersion.create({ data: { submissionId: submission.id, versionNumber, code, isFinal: true } });
    return NextResponse.json({ success: true, versionId: version.id, versionNumber });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
