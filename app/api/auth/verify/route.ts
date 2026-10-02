import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/verify";

export async function GET(req: Request) {
   const token = new URL(req.url).searchParams.get("token");
   if (!token)
      return NextResponse.json({ message: "Missing token." }, { status: 400 });

   const record = await prisma.emailVerificationToken.findUnique({
      where: { tokenHash: hashToken(token) },
   });

   if (!record)
      return NextResponse.json({ message: "Invalid link." }, { status: 400 });
   if (record.expiresAt < new Date()) {
      return NextResponse.json({ message: "Link expired." }, { status: 400 });
   }

   await prisma.user.update({
      where: { id: record.userId },
      data: { emailVerified: new Date() },
   });
   await prisma.emailVerificationToken.deleteMany({
      where: { userId: record.userId },
   });

   return NextResponse.json({ message: "Email verified." });
}
