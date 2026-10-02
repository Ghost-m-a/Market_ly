import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashResetToken, sendPasswordResetEmail } from "@/lib/password-reset";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GENERIC_MESSAGE =
   "If an account exists for that email, a password reset link has been sent.";

export async function POST(req: Request) {
   let email: unknown;
   try {
      ({ email } = (await req.json()) ?? {});
   } catch {
      return NextResponse.json(
         { message: "Enter a valid email." },
         { status: 400 },
      );
   }

   if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
      return NextResponse.json(
         { message: "Enter a valid email." },
         { status: 400 },
      );
   }
   if (
      !process.env.RESEND_API_KEY ||
      !process.env.EMAIL_FROM ||
      !process.env.NEXT_PUBLIC_APP_URL
   ) {
      return NextResponse.json(
         { message: "Password reset email is not configured on this server." },
         { status: 503 },
      );
   }

   try {
      const normalizedEmail = email.trim().toLowerCase();
      const user = await prisma.user.findUnique({
         where: { email: normalizedEmail },
         select: { id: true, email: true },
      });

      if (user) {
         const token = randomBytes(32).toString("hex");
         const tokenHash = hashResetToken(token);
         const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

         await prisma.$transaction([
            prisma.passwordResetToken.deleteMany({
               where: { userId: user.id },
            }),
            prisma.passwordResetToken.create({
               data: { userId: user.id, tokenHash, expiresAt },
            }),
         ]);

         const resetUrl = new URL(
            "/reset-password",
            process.env.NEXT_PUBLIC_APP_URL,
         );
         resetUrl.searchParams.set("token", token);
         try {
            await sendPasswordResetEmail(user.email, resetUrl.toString());
         } catch (error) {
            await prisma.passwordResetToken.deleteMany({
               where: { tokenHash },
            });
            if (
               error instanceof Error &&
               error.message === "EMAIL_NOT_CONFIGURED"
            ) {
               return NextResponse.json(
                  {
                     message:
                        "Password reset email is not configured on this server.",
                  },
                  { status: 503 },
               );
            }
            return NextResponse.json(
               {
                  message:
                     "Could not send a reset email. Please try again later.",
               },
               { status: 502 },
            );
         }
      }

      return NextResponse.json({ message: GENERIC_MESSAGE });
   } catch {
      return NextResponse.json(
         { message: "Could not process the password reset request." },
         { status: 500 },
      );
   }
}
