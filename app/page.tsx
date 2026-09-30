"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import styles from "./page.module.css";

export default function Home() {
   const { user, loading } = useAuth();

   if (loading) {
      return (
         <div className={styles.container}>
            <div className={styles.skeleton} />
         </div>
      );
   }

   if (user) {
      return (
         <div className={styles.container}>
            <section className={styles.welcome}>
               <div className={styles.avatar}>
                  {user.avatarUrl ? (
                     <img src={user.avatarUrl} alt={user.name} />
                  ) : (
                     user.name.charAt(0).toUpperCase()
                  )}
               </div>

               <h1 className={styles.title}>
                  Welcome back, {user.name.split(" ")[0]}
               </h1>
               <p className={styles.subtitle}>{user.email}</p>

               <div className={styles.actions}>
                  <Link href="/dashboard" className={styles.primaryBtn}>
                     Go to Dashboard
                  </Link>
                  <Link
                     href="/dashboard/settings"
                     className={styles.secondaryBtn}
                  >
                     Settings
                  </Link>
               </div>
            </section>
         </div>
      );
   }

   return (
      <div className={styles.container}>
         <section className={styles.hero}>
            <h1 className={styles.title}>Welcome to Whop</h1>
            <p className={styles.subtitle}>
               The platform for creators and businesses. Sign in to access your
               workspace, or create a new account to get started.
            </p>
            <p className={styles.hint}>
               Click <strong>Login</strong> in the top right to begin.
            </p>
         </section>
      </div>
   );
}
