import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { makeToken, hashToken, sendEmail } from "@/lib/verify";

export async function POST(req: Request) {
   const { name, email, password } = await req.json();

   if (!name || !email || !password || password.length < 8) {
      return NextResponse.json({ message: "Invalid input." }, { status: 400 });
   }

   const normalized = email.trim().toLowerCase();

   const existing = await prisma.user.findUnique({
      where: { email: normalized },
   });

   // If user exists and is already verified, do nothing (generic message)
   if (existing?.emailVerified) {
      return NextResponse.json({ message: "Check your email." });
   }

   // Otherwise create or update the user
   const user = existing
      ? await prisma.user.update({
           where: { id: existing.id },
           data: { name, passwordHash: hashPassword(password) },
        })
      : await prisma.user.create({
           data: {
              name,
              email: normalized,
              passwordHash: hashPassword(password),
           },
        });

   // One active token per user
   const token = makeToken();
   await prisma.emailVerificationToken.deleteMany({
      where: { userId: user.id },
   });
   await prisma.emailVerificationToken.create({
      data: {
         userId: user.id,
         tokenHash: hashToken(token),
         expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1h
      },
   });

   const url = `${process.env.NEXT_PUBLIC_APP_URL}/verify?token=${token}`;

   try {
      await sendEmail(user.email, "Verify your email", url);
   } catch {
      return NextResponse.json(
         { message: "Could not send verification email. Please try again." },
         { status: 502 },
      );
   }

   return NextResponse.json({
      message: "Check your email to verify your account.",
   });
}
