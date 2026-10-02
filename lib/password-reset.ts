import { createHash, randomBytes } from "node:crypto";
import { sendEmail } from "./verify";

export function generateResetToken(): string {
   return randomBytes(32).toString("hex");
}

export function hashResetToken(token: string): string {
   return createHash("sha256").update(token).digest("hex");
}

export async function sendPasswordResetEmail(
   to: string,
   url: string,
): Promise<void> {
   await sendEmail(to, "Reset your Market_ly password", url);
}
