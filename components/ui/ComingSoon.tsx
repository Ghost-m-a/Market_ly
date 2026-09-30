"use client";

import { PageHead } from "./Page";
import { IBox } from "./Icons";

export default function ComingSoon({
   title,
   subtitle,
}: {
   title: string;
   subtitle: string;
}) {
   return (
      <div>
         <PageHead title={title} subtitle={subtitle} />
         <div
            style={{
               background: "var(--color-surface)",
               border: "1px solid var(--color-border)",
               borderRadius: 12,
               padding: "3rem 1.5rem",
               textAlign: "center",
            }}
         >
            <div
               style={{
                  width: 56,
                  height: 56,
                  display: "grid",
                  placeItems: "center",
                  margin: "0 auto 1rem",
                  borderRadius: 12,
                  background: "var(--color-background)",
                  color: "var(--color-text-muted)",
               }}
            >
               <IBox size={24} />
            </div>
            <h3
               style={{
                  margin: "0 0 0.4rem",
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: "var(--color-text)",
               }}
            >
               {title} is coming soon
            </h3>
            <p
               style={{
                  margin: 0,
                  fontSize: "0.85rem",
                  color: "var(--color-text-secondary)",
               }}
            >
               We&apos;re building this. Check back soon.
            </p>
         </div>
      </div>
   );
}
