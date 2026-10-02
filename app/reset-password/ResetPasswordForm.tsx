"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import styles from "./reset-password.module.css";

export default function ResetPasswordForm({ token }: { token: string }) {
   const [password, setPassword] = useState("");
   const [confirmation, setConfirmation] = useState("");
   const [error, setError] = useState("");
   const [complete, setComplete] = useState(false);
   const [saving, setSaving] = useState(false);

   const submit = async (event: FormEvent) => {
      event.preventDefault();
      setError("");
      if (!token) {
         setError("This reset link is invalid or expired.");
         return;
      }
      if (password.length < 8) {
         setError("Password must be at least 8 characters.");
         return;
      }
      if (password !== confirmation) {
         setError("Passwords do not match.");
         return;
      }

      setSaving(true);
      try {
         const response = await fetch("/api/auth/reset-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, password }),
         });
         const data = await response.json();
         if (!response.ok)
            throw new Error(data.message ?? "Could not reset password.");
         setComplete(true);
      } catch (err) {
         setError(
            err instanceof Error ? err.message : "Could not reset password.",
         );
      } finally {
         setSaving(false);
      }
   };

   return (
      <main className={styles.page}>
         <section className={styles.panel}>
            {complete ? (
               <>
                  <h1>Password updated</h1>
                  <p>Your password has been changed. You can now sign in.</p>
                  <Link className={styles.link} href="/">
                     Return to sign in
                  </Link>
               </>
            ) : (
               <form onSubmit={submit} noValidate>
                  <h1>Choose a new password</h1>
                  <p>Use at least 8 characters.</p>
                  {!token && (
                     <p className={styles.error} role="alert">
                        This reset link is invalid or expired.
                     </p>
                  )}
                  <label htmlFor="new-password">New password</label>
                  <input
                     id="new-password"
                     type="password"
                     autoComplete="new-password"
                     value={password}
                     onChange={(event) => setPassword(event.target.value)}
                     minLength={8}
                     required
                  />
                  <label htmlFor="confirm-password">Confirm password</label>
                  <input
                     id="confirm-password"
                     type="password"
                     autoComplete="new-password"
                     value={confirmation}
                     onChange={(event) => setConfirmation(event.target.value)}
                     minLength={8}
                     required
                  />
                  {error && (
                     <p className={styles.error} role="alert">
                        {error}
                     </p>
                  )}
                  <button type="submit" disabled={saving || !token}>
                     {saving ? "Updating…" : "Update password"}
                  </button>
                  <Link className={styles.backLink} href="/">
                     Back to Market_ly
                  </Link>
               </form>
            )}
         </section>
      </main>
   );
}
