"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import styles from "./messages.module.css";

type Conversation = {
   /* ... */
};
type Message = {
   /* ... */
};

function timeAgo(iso: string): string {
   const value = new Date(iso);
   if (Number.isNaN(value.getTime())) return "just now";

   const seconds = Math.floor((Date.now() - value.getTime()) / 1000);
   if (seconds < 60) return "just now";
   if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
   if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
   if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

   return value.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
   });
}

export default function MessagesContent() {
   // ... the full component
}
