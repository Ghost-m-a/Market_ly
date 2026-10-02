import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { hashResetToken } from "@/lib/password-reset";
import styles from "../reset-password/reset-password.module.css";

export default async function VerifyEmailPage({
   searchParams,
}: {
   searchParams: Promise<{ token?: string | string[] }>;
}) {
   const params = await searchParams;
   const token = Array.isArray(params.token) ? params.token[0] : params.token;
   let verified = false;

   if (token && /^[a-f0-9]{64}$/i.test(token)) {
      const tokenHash = hashResetToken(token);
      try {
         await prisma.$transaction(async (tx) => {
            const verification = await tx.emailVerificationToken.findUnique({
               where: { tokenHash },
            });
            const now = new Date();
            if (!verification || verification.expiresAt <= now) return;

            const consumed = await tx.emailVerificationToken.deleteMany({
               where: { tokenHash, expiresAt: { gt: now } },
            });
            if (consumed.count !== 1) return;

            await tx.user.update({
               where: { id: verification.userId },
               data: { emailVerified: now },
            });
            verified = true;
         });
      } catch {
         verified = false;
      }
   }

   return (
      <main className={styles.page}>
         <section className={styles.panel}>
            <h1>{verified ? "Email verified" : "Verification link expired"}</h1>
            <p>
               {verified
                  ? "Your address is confirmed. You can now sign in."
                  : "This link is invalid or has expired. Create a new account or contact support."}
            </p>
            <Link className={styles.link} href="/">
               Return to sign in
            </Link>
         </section>
      </main>
   );
}
