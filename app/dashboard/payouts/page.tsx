"use client";

import { PageHead } from "@/components/ui/Page";

export default function PayoutsPage() {
   return (
      <div>
         <PageHead
            title="Payouts"
            subtitle="Track your earnings and withdrawal history."
         />
         <div
            style={{
               padding: "4rem 1.5rem",
               textAlign: "center",
               background: "var(--color-surface)",
               border: "1px solid var(--color-border)",
               borderRadius: 12,
            }}
         >
            <h3
               style={{
                  margin: "0 0 0.5rem",
                  fontSize: "1rem",
                  fontWeight: 600,
               }}
            >
               No payouts yet
            </h3>
            <p
               style={{
                  margin: 0,
                  fontSize: "0.85rem",
                  color: "var(--color-text-secondary)",
               }}
            >
               Once you approve clips and the campaign reaches its payout
               threshold, earnings will appear here.
            </p>
         </div>
      </div>
   );
}
