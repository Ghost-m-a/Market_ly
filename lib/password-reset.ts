import { createHash } from "node:crypto";

export function hashResetToken(token: string): string {
   return createHash("sha256").update(token).digest("hex");
}

export async function sendPasswordResetEmail(
   email: string,
   resetUrl: string,
): Promise<void> {
   const apiKey = process.env.RESEND_API_KEY;
   const from = process.env.EMAIL_FROM;
   if (!apiKey || !from) throw new Error("EMAIL_NOT_CONFIGURED");

   const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
         Authorization: `Bearer ${apiKey}`,
         "Content-Type": "application/json",
      },
      body: JSON.stringify({
         from,
         to: [email],
         subject: "Reset your Market_ly password",
         html: `<p>We received a request to reset your password.</p><p><a href="${resetUrl}">Choose a new password</a></p><p>This link expires in one hour. If you did not request this, you can ignore this email.</p>`,
      }),
   });

   if (!response.ok) throw new Error("EMAIL_SEND_FAILED");
}

export async function sendEmailVerificationEmail(
   email: string,
   verificationUrl: string,
): Promise<void> {
   const apiKey = process.env.RESEND_API_KEY;
   const from = process.env.EMAIL_FROM;
   if (!apiKey || !from) throw new Error("EMAIL_NOT_CONFIGURED");

   const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
         Authorization: `Bearer ${apiKey}`,
         "Content-Type": "application/json",
      },
      body: JSON.stringify({
         from,
         to: [email],
         subject: "Verify your Market_ly email",
         html: `<p>Confirm your email address to finish creating your account.</p><p><a href="${verificationUrl}">Verify email</a></p><p>This link expires in 24 hours.</p>`,
      }),
   });

   if (!response.ok) throw new Error("EMAIL_SEND_FAILED");
}
