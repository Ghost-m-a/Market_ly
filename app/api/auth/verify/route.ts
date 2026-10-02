import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/verify";

export async function GET(req: Request) {
   const token = new URL(req.url).searchParams.get("token");
   if (!token) {
      return NextResponse.json({ message: "Missing token." }, { status: 400 });
   }

   const record = await prisma.emailVerificationToken.findUnique({
      where: { tokenHash: hashToken(token) },
      select: { id: true, userId: true, expiresAt: true },
   });

   if (!record) {
      return NextResponse.json(
         { message: "Invalid or used link." },
         { status: 400 },
      );
   }

   if (record.expiresAt < new Date()) {
      await prisma.emailVerificationToken.delete({ where: { id: record.id } });
      return NextResponse.json(
         { message: "This link has expired." },
         { status: 400 },
      );
   }

   await prisma.$transaction([
      prisma.user.update({
         where: { id: record.userId },
         data: { emailVerified: new Date() },
      }),
      prisma.emailVerificationToken.deleteMany({
         where: { userId: record.userId },
      }),
   ]);

   return NextResponse.json({
      message: "Email verified. You can now sign in.",
   });
}
