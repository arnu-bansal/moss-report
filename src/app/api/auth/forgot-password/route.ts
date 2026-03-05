import { NextRequest, NextResponse } from "next/server";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

export const runtime = "nodejs";

function getDB() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });
    const prisma = getDB();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) { await prisma.$disconnect(); return NextResponse.json({ success: true }); }
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);
    await prisma.passwordResetToken.create({ data: { userId: user.id, token, expiresAt } });
    await prisma.$disconnect();
    // In production, send email here. For now just return token in dev.
    console.log(`Reset link: ${process.env.NEXTAUTH_URL}/reset-password?token=${token}`);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
