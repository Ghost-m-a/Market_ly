// lib/verify.ts
import nodemailer from "nodemailer";
import { createHash, randomBytes } from "node:crypto";

export function makeToken() {
   return randomBytes(32).toString("hex");
}

export function hashToken(token: string) {
   return createHash("sha256").update(token).digest("hex");
}

// Updated for Brevo SMTP
export async function sendEmail(to: string, subject: string, url: string) {
   const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false, // true for port 465, false for other ports. Use false for port 587.
      auth: {
         user: process.env.SMTP_USER,
         pass: process.env.SMTP_PASS,
      },
   });

   await transporter.sendMail({
      from: `"Market_ly" <${process.env.EMAIL_FROM}>`,
      to: to,
      subject: subject,
      html: `<p>Click this link to verify your email:</p><p><a href="${url}">${url}</a></p>`,
   });
}
