import { NextRequest, NextResponse } from "next/server";
import { execSync } from "child_process";
import fs from "fs";
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
    const { projectId, code, userId } = await req.json();
    if (!code || !projectId) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const db = await getPrisma();
    const uid = userId || "anonymous-" + Math.random().toString(36).slice(2, 8);

    let submission = await db.submission.findFirst({ where: { projectId, userId: uid } });
    if (!submission) {
      submission = await db.submission.create({
        data: { projectId, userId: uid }
      });
    }

    const lastVersion = await db.submissionVersion.findFirst({
      where: { submissionId: submission.id },
      orderBy: { versionNumber: "desc" }
    });

    const versionNumber = (lastVersion?.versionNumber || 0) + 1;
    const version = await db.submissionVersion.create({
      data: { submissionId: submission.id, versionNumber, code, isFinal: true }
    });

    return NextResponse.json({ success: true, versionId: version.id, versionNumber });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
