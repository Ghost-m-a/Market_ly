import { createHash, randomBytes } from "node:crypto";
import nodemailer from "nodemailer";

export function makeToken(): string {
   return randomBytes(32).toString("hex");
}

export function hashToken(token: string): string {
   return createHash("sha256").update(token).digest("hex");
}

export async function sendEmail(
   to: string,
   subject: string,
   url: string,
): Promise<void> {
   const host = process.env.SMTP_HOST;
   const port = process.env.SMTP_PORT;
   const user = process.env.SMTP_USER;
   const pass = process.env.SMTP_PASS;
   const from = process.env.EMAIL_FROM;

   if (!host || !port || !user || !pass || !from) {
      throw new Error("EMAIL_NOT_CONFIGURED");
   }

   const transporter = nodemailer.createTransport({
      host,
      port: Number(port),
      secure: false, // true for port 465; false for 587 (STARTTLS)
      auth: { user, pass },
   });

   await transporter.sendMail({
      from: `"Market_ly" <${from}>`,
      to,
      subject,
      html: `
         <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px">
            <h2 style="margin:0 0 12px">${subject}</h2>
            <p style="color:#555;line-height:1.5">Click the button below to continue. This link expires in 1 hour.</p>
            <p style="margin:24px 0">
               <a href="${url}" style="background:#111;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;display:inline-block">
                  Continue
               </a>
            </p>
            <p style="color:#888;font-size:13px;word-break:break-all">Or paste this link: ${url}</p>
            <p style="color:#888;font-size:13px">If you didn't request this, you can ignore this email.</p>
         </div>
      `,
   });
}
