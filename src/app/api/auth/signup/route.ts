import { NextRequest, NextResponse } from "next/server";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

function getDB() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();
    if (!email || !password || !name) return NextResponse.json({ error: "All fields required" }, { status: 400 });
    const prisma = getDB();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) { await prisma.$disconnect(); return NextResponse.json({ error: "Email already registered" }, { status: 400 }); }
    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({ data: { email, name, password: hashed, role: "student" } });
    await prisma.$disconnect();
    return NextResponse.json({ success: true, userId: user.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
