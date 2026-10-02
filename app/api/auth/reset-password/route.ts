import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { hashResetToken } from "@/lib/password-reset";

export async function POST(req: Request) {
   let token: unknown;
   let password: unknown;
   try {
      ({ token, password } = (await req.json()) ?? {});
   } catch {
      return NextResponse.json(
         { message: "Invalid reset request." },
         { status: 400 },
      );
   }

   if (typeof token !== "string" || !/^[a-f0-9]{64}$/i.test(token)) {
      return NextResponse.json(
         { message: "This reset link is invalid or expired." },
         { status: 400 },
      );
   }
   if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
         { message: "Password must be at least 8 characters." },
         { status: 400 },
      );
   }

   const tokenHash = hashResetToken(token);
   try {
      await prisma.$transaction(async (tx) => {
         const resetToken = await tx.passwordResetToken.findUnique({
            where: { tokenHash },
         });
         const now = new Date();
         if (!resetToken || resetToken.expiresAt <= now) {
            throw new Error("INVALID_RESET_TOKEN");
         }

         const consumed = await tx.passwordResetToken.deleteMany({
            where: { tokenHash, expiresAt: { gt: now } },
         });
         if (consumed.count !== 1) throw new Error("INVALID_RESET_TOKEN");

         await tx.user.update({
            where: { id: resetToken.userId },
            data: { passwordHash: hashPassword(password) },
         });
         await tx.passwordResetToken.deleteMany({
            where: { userId: resetToken.userId },
         });
      });
      return NextResponse.json({ message: "Your password has been updated." });
   } catch (error) {
      if (error instanceof Error && error.message === "INVALID_RESET_TOKEN") {
         return NextResponse.json(
            { message: "This reset link is invalid or expired." },
            { status: 400 },
         );
      }
      return NextResponse.json(
         { message: "Could not reset your password. Please try again." },
         { status: 500 },
      );
   }
}
