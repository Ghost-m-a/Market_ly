import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import {
   hashResetToken,
   sendEmailVerificationEmail,
} from "@/lib/password-reset";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
   try {
      const { name, email, password } = (await req.json()) ?? {};

      if (
         typeof name !== "string" ||
         name.trim().length < 2 ||
         typeof email !== "string" ||
         !EMAIL_RE.test(email.trim()) ||
         typeof password !== "string"
      ) {
         return NextResponse.json(
            { message: "Enter a name, valid email, and password." },
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
         !process.env.RESEND_API_KEY ||
         !process.env.EMAIL_FROM ||
         !process.env.NEXT_PUBLIC_APP_URL
      ) {
         return NextResponse.json(
            { message: "Email verification is not configured on this server." },
            { status: 503 },
         );
      }

      const normalized = email.trim().toLowerCase();

      const existing = await prisma.user.findFirst({
         where: { email: { equals: normalized, mode: "insensitive" } },
      });
      if (existing) {
         return NextResponse.json(
            { message: "An account with that email already exists." },
            { status: 409 },
         );
      }

      const token = randomBytes(32).toString("hex");
      const tokenHash = hashResetToken(token);
      const user = await prisma.user.create({
         data: {
            name: name.trim(),
            email: normalized,
            passwordHash: hashPassword(password),
            emailVerificationTokens: {
               create: {
                  tokenHash,
                  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
               },
            },
         },
      });

      const verificationUrl = new URL(
         "/verify-email",
         process.env.NEXT_PUBLIC_APP_URL,
      );
      verificationUrl.searchParams.set("token", token);
      try {
         await sendEmailVerificationEmail(
            user.email,
            verificationUrl.toString(),
         );
      } catch {
         await prisma.user.delete({ where: { id: user.id } });
         return NextResponse.json(
            { message: "Could not send verification email. Please try again." },
            { status: 502 },
         );
      }

      return NextResponse.json(
         {
            message:
               "Account created. Check your email to verify your address.",
         },
         { status: 201 },
      );
   } catch (err) {
      if (
         typeof err === "object" &&
         err !== null &&
         "code" in err &&
         err.code === "P2002"
      ) {
         return NextResponse.json(
            { message: "An account with that email already exists." },
            { status: 409 },
         );
      }
      console.error("[register] error:", err);
      return NextResponse.json(
         { message: "Could not create account." },
         { status: 500 },
      );
   }
}
