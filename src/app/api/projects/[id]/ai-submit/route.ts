import { NextRequest, NextResponse } from "next/server";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

export const runtime = "nodejs";

function getDB() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await context.params;
    const { code, aiModel, adminUserId } = await req.json();
    if (!code || !aiModel) return NextResponse.json({ error: "code and aiModel required" }, { status: 400 });

    const prisma = getDB();

    // Check admin
    const user = await prisma.user.findUnique({ where: { id: adminUserId }, select: { role: true } });
    if (user?.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });

    // Find or create a special "AI" user for this model
    const aiEmail = "ai-" + aiModel.toLowerCase().replace(/\s+/g, "-") + "@codescan.ai";
    let aiUser = await prisma.user.findUnique({ where: { email: aiEmail } });
    if (!aiUser) {
      aiUser = await prisma.user.create({
        data: {
          id: "ai-" + aiModel.toLowerCase().replace(/\s+/g, "-"),
          email: aiEmail,
          name: aiModel,
          password: "ai-no-login",
          role: "ai",
        }
      });
    }

    // Find or create submission for this AI user in this project
    let submission = await prisma.submission.findFirst({
      where: { projectId, userId: aiUser.id },
      include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } }
    });

    const versionNumber = submission ? (submission.versions[0]?.versionNumber || 0) + 1 : 1;
    const ext = { java: ".java", c: ".c", cpp: ".cpp", python: ".py", javascript: ".js", typescript: ".ts", txt: ".txt" };
    const project = await prisma.project.findUnique({ where: { id: projectId }, select: { language: true } });
    const filename = aiModel.replace(/\s+/g, "-") + (ext[project?.language as keyof typeof ext] || ".txt");

    if (!submission) {
      submission = await prisma.submission.create({
        data: { projectId, userId: aiUser.id },
        include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } }
      });
    }

    await prisma.submissionVersion.create({
      data: {
        submissionId: submission.id,
        versionNumber,
        code,
        filename,
      }
    });

    await prisma.$disconnect();
    return NextResponse.json({ success: true, aiUser: { name: aiModel, email: aiEmail } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await context.params;
    const prisma = getDB();

    const aiSubmissions = await prisma.submission.findMany({
      where: {
        projectId,
        user: { role: "ai" }
      },
      include: {
        user: { select: { name: true, email: true } },
        versions: { orderBy: { versionNumber: "desc" }, take: 1 }
      }
    });

    await prisma.$disconnect();
    return NextResponse.json({ aiSubmissions });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}