"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./styles/SearchModal.module.css";

const CATEGORIES = [
   "Customers",
   "Memberships",
   "Reviews",
   "Resolution cases",
   "Affiliates",
   "Companies",
];

const IconSearch = () => (
   <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
   >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
   </svg>
);

const IconSearchLarge = () => (
   <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
   >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
   </svg>
);

type Props = { open: boolean; onClose: () => void };

export default function SearchModal({ open, onClose }: Props) {
   const [query, setQuery] = useState("");
   const [active, setActive] = useState<string | null>(null);
   const inputRef = useRef<HTMLInputElement>(null);

   useEffect(() => {
      if (open) {
         setQuery("");
         setActive(null);
         setTimeout(() => inputRef.current?.focus(), 40);
      }
   }, [open]);

   useEffect(() => {
      if (!open) return;
      const onKey = (e: KeyboardEvent) => {
         if (e.key === "Escape") onClose();
      };
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
         <div className={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
            <div className={styles.searchRow}>
               <span className={styles.searchIcon}>
                  <IconSearch />
               </span>
               <input
                  ref={inputRef}
                  className={styles.input}
                  placeholder="Search Whop"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
               />
               <span className={styles.shortcut}>Esc</span>
            </div>

            <div className={styles.chips}>
               {CATEGORIES.map((c) => (
                  <button
                     key={c}
                     className={`${styles.chip} ${active === c ? styles.chipActive : ""}`}
                     onClick={() => setActive((a) => (a === c ? null : c))}
                  >
                     {c}
                  </button>
               ))}
            </div>

            <div className={styles.empty}>
               <div className={styles.emptyIcon}>
                  <IconSearchLarge />
               </div>
               <h3 className={styles.emptyTitle}>Search Whop</h3>
               <p className={styles.emptyText}>
                  {query
                     ? `Searching for "${query}"…`
                     : "Start typing to search"}
               </p>
            </div>
         </div>
      </div>
   );
}
