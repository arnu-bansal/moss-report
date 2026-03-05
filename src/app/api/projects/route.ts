import { NextRequest, NextResponse } from "next/server";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";

export const runtime = "nodejs";

function getDB() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

export async function GET(req: NextRequest) {
  try {
    const prisma = getDB();
    const projects = await prisma.project.findMany({ orderBy: { createdAt: "desc" } });
    await prisma.$disconnect();
    return NextResponse.json({ projects });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, language, userId } = await req.json();
    if (!name || !language || !userId) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    const prisma = getDB();
    const project = await prisma.project.create({ data: { name, language, createdBy: userId } });
    await prisma.projectMember.create({ data: { projectId: project.id, userId } });
    await prisma.$disconnect();
    return NextResponse.json({ project });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
