"use client";

import { Suspense } from "react";
import MessagesContent from "./MessagesContent";

export default function MessagesPage() {
   return (
      <Suspense
         fallback={
            <div
               style={{
                  padding: "4rem 2rem",
                  textAlign: "center",
                  color: "var(--color-text-muted)",
               }}
            >
               Loading messages…
            </div>
         }
      >
         <MessagesContent />
      </Suspense>
   );
}
