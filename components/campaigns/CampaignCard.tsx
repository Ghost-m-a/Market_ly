"use client";

import Link from "next/link";
import type { Platform } from "@/lib/campaigns";
import {
   formatMoney,
   formatViews,
   type CampaignSummary,
} from "@/lib/campaign-types";
import styles from "./CampaignCard.module.css";
import { JSX } from "react";

function PlatformIcon({ platform }: { platform: Platform }) {
   const paths: Record<Platform, JSX.Element> = {
      tiktok: (
         <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1Z" />
      ),
      x: (
         <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231ZM17.083 19.77h1.833L7.084 4.126H5.117Z" />
      ),
      instagram: (
         <>
            <rect x="2" y="2" width="20" height="20" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
         </>
      ),
      youtube: (
         <>
            <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-1.92 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33Z" />
            <path
               d="m9.75 15.02 5.75-3.27-5.75-3.27Z"
               fill="var(--color-surface)"
            />
         </>
      ),
      facebook: (
         <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      ),
   };

   return (
      <svg
         width="14"
         height="14"
         viewBox="0 0 24 24"
         fill="currentColor"
         stroke="currentColor"
         strokeWidth={platform === "instagram" ? 1.6 : 0}
         strokeLinecap="round"
         strokeLinejoin="round"
      >
         {paths[platform]}
      </svg>
   );
}

export function CampaignCard({
   campaign,
   onClick,
   onContribute,
}: {
   campaign: CampaignSummary;
   onClick?: () => void;
   onContribute?: () => void;
}) {
   const pct =
      campaign.budgetCents > 0
         ? Math.min(100, (campaign.spentCents / campaign.budgetCents) * 100)
         : 0;
   const primaryRate = Math.max(...Object.values(campaign.rates));

   return (
      <article
         className={styles.card}
         onClick={onClick}
         role={onClick ? "button" : undefined}
      >
         <div className={styles.cover}>
            {campaign.coverImage ? (
               <img src={campaign.coverImage} alt="" />
            ) : (
               <div className={styles.coverPlaceholder} />
            )}
         </div>

         <div className={styles.body}>
            <div className={styles.brandRow}>
               <div className={styles.brandLogo}>
                  {campaign.brandLogo ? (
                     <img src={campaign.brandLogo} alt="" />
                  ) : (
                     campaign.brandName.charAt(0).toUpperCase()
                  )}
               </div>
               <span className={styles.brandName}>{campaign.brandName}</span>
               <span className={styles.brandTime}>· today</span>

               <div className={styles.platforms}>
                  {campaign.platforms.slice(0, 4).map((p) => (
                     <span key={p} className={styles.platformIcon}>
                        <PlatformIcon platform={p} />
                     </span>
                  ))}
               </div>
            </div>

            <h3 className={styles.title}>{campaign.title}</h3>

            <div className={styles.meta}>
               <div className={styles.metaLeft}>
                  <span className={styles.money}>
                     {formatMoney(campaign.spentCents)}{" "}
                     <span className={styles.moneyDivider}>/</span>{" "}
                     {formatMoney(campaign.budgetCents)}
                  </span>
               </div>

               <div className={styles.metaRight}>
                  <span className={styles.contributors}>
                     <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                     >
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                     </svg>
                     {campaign.memberCount}
                  </span>
                  <span className={styles.rate}>
                     {formatMoney(primaryRate)}/1k
                  </span>
               </div>
            </div>

            {campaign.budgetCents > 0 && (
               <div className={styles.progress}>
                  <div
                     className={styles.progressBar}
                     style={{ width: `${pct}%` }}
                  />
               </div>
            )}

            {onContribute && campaign.status === "ACTIVE" && (
               <button
                  type="button"
                  className={styles.contributeBtn}
                  onClick={(event) => {
                     event.stopPropagation();
                     onContribute();
                  }}
               >
                  Contribute
               </button>
            )}
         </div>
      </article>
   );
}

export function CampaignCardSkeleton() {
   return (
      <article className={`${styles.card} ${styles.skeleton}`}>
         <div className={styles.cover} />
         <div className={styles.body}>
            <div
               style={{
                  height: 20,
                  width: "60%",
                  background: "var(--color-border)",
                  borderRadius: 4,
               }}
            />
            <div
               style={{
                  height: 18,
                  width: "80%",
                  background: "var(--color-border)",
                  borderRadius: 4,
                  marginTop: 12,
               }}
            />
            <div
               style={{
                  height: 14,
                  width: "100%",
                  background: "var(--color-border)",
                  borderRadius: 4,
                  marginTop: 20,
               }}
            />
         </div>
      </article>
   );
}
