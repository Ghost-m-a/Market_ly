"use client";

import { useEffect } from "react";
import styles from "./modal.module.css";

const X = () => (
   <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
   >
      <path d="M18 6 6 18M6 6l12 12" />
   </svg>
);

export default function Modal({
   open,
   onClose,
   title,
   children,
   footer,
}: {
   open: boolean;
   onClose: () => void;
   title: string;
   children: React.ReactNode;
   footer?: React.ReactNode;
}) {
   useEffect(() => {
      if (!open) return;
      const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
      return () => {
         document.removeEventListener("keydown", onKey);
         document.body.style.overflow = "";
      };
   }, [open, onClose]);

   if (!open) return null;

   return (
      <div className={styles.overlay} onMouseDown={onClose}>
         <div
            className={styles.modal}
            onMouseDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
         >
            <header className={styles.head}>
               <h2 className={styles.title}>{title}</h2>
               <button
                  className={styles.close}
                  onClick={onClose}
                  aria-label="Close"
               >
                  <X />
               </button>
            </header>
            <div className={styles.body}>{children}</div>
            {footer && <footer className={styles.foot}>{footer}</footer>}
         </div>
      </div>
   );
}
