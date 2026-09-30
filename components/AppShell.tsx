"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "./Sidebar";
import styles from "./styles/AppShell.module.css";

export default function AppShell({ children }: { children: React.ReactNode }) {
   const { user, loading } = useAuth();
   const pathname = usePathname();

   const [mounted, setMounted] = useState(false);
   const [collapsed, setCollapsed] = useState(false);
   const [mobileOpen, setMobileOpen] = useState(false);

   useEffect(() => {
      setMounted(true);
      if (localStorage.getItem("sidebar-collapsed") === "true")
         setCollapsed(true);
   }, []);

   useEffect(() => {
      if (mounted) localStorage.setItem("sidebar-collapsed", String(collapsed));
   }, [collapsed, mounted]);

   useEffect(() => setMobileOpen(false), [pathname]);

   useEffect(() => {
      if (!mobileOpen) return;
      const onKey = (e: KeyboardEvent) =>
         e.key === "Escape" && setMobileOpen(false);
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
      return () => {
         document.removeEventListener("keydown", onKey);
         document.body.style.overflow = "";
      };
   }, [mobileOpen]);

   if (!mounted || loading || !user) {
      return <div className={styles.fullWidth}>{children}</div>;
   }

   return (
      <div
         className={`${styles.shell} ${collapsed ? styles.shellCollapsed : ""}`}
      >
         <button
            className={styles.mobileMenuBtn}
            onClick={() => setMobileOpen(true)}
            aria-label="Open sidebar"
         >
            <svg
               width="20"
               height="20"
               viewBox="0 0 24 24"
               fill="none"
               stroke="currentColor"
               strokeWidth="2"
               strokeLinecap="round"
            >
               <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
         </button>

         <Sidebar
            collapsed={collapsed}
            mobileOpen={mobileOpen}
            onToggleCollapse={() => setCollapsed((c) => !c)}
            onCloseMobile={() => setMobileOpen(false)}
         />

         <main className={styles.main}>{children}</main>
      </div>
   );
}
