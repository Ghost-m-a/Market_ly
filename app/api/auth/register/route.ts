import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { makeToken, hashToken, sendEmail } from "@/lib/verify";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
   let body: { name?: string; email?: string; password?: string };
   try {
      body = await req.json();
   } catch {
      return NextResponse.json(
         { message: "Invalid request." },
         { status: 400 },
      );
   }

   const name = String(body.name ?? "").trim();
   const email = String(body.email ?? "")
      .trim()
      .toLowerCase();
   const password = String(body.password ?? "");

   if (name.length < 2) {
      return NextResponse.json(
         { message: "Enter your name." },
         { status: 400 },
      );
   }
   if (!EMAIL_RE.test(email)) {
      return NextResponse.json(
         { message: "Enter a valid email." },
         { status: 400 },
      );
   }
   if (password.length < 8) {
      return NextResponse.json(
         { message: "Password must be at least 8 characters." },
         { status: 400 },
      );
   }

   if (
      !process.env.SMTP_HOST ||
      !process.env.SMTP_USER ||
      !process.env.SMTP_PASS ||
      !process.env.EMAIL_FROM ||
      !process.env.NEXT_PUBLIC_APP_URL
   ) {
      return NextResponse.json(
         { message: "Email verification is not configured on this server." },
         { status: 503 },
      );
   }

   const GENERIC =
      "If this email can be registered, a verification link has been sent.";

   const existing = await prisma.user.findUnique({ where: { email } });

   // Already verified — do nothing, return generic.
   if (existing?.emailVerified) {
      return NextResponse.json({ message: GENERIC });
   }

   // Create or update the user.
   const user = existing
      ? await prisma.user.update({
           where: { id: existing.id },
           data: { name, passwordHash: hashPassword(password) },
        })
      : await prisma.user.create({
           data: { name, email, passwordHash: hashPassword(password) },
        });

   const token = makeToken();
   const tokenHash = hashToken(token);

   await prisma.$transaction([
      prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } }),
      prisma.emailVerificationToken.create({
         data: {
            userId: user.id,
            tokenHash,
            expiresAt: new Date(Date.now() + 60 * 60 * 1000),
         },
      }),
   ]);

   const url = `${process.env.NEXT_PUBLIC_APP_URL}/verify?token=${token}`;

   try {
      await sendEmail(user.email, "Verify your Market_ly email", url);
   } catch (err) {
      console.error("[REGISTER SEND ERROR]", err);
      return NextResponse.json(
         { message: "Could not send verification email. Please try again." },
         { status: 502 },
      );
   }

   return NextResponse.json({ message: GENERIC });
}
