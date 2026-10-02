"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
   formatMoney,
   formatViews,
   PLATFORM_LABELS,
   type CampaignDetail,
   type Platform,
} from "@/lib/campaigns";
import styles from "./CampaignDetailModal.module.css";

export default function CampaignDetailModal({
   campaignId,
   onClose,
   onJoined,
   startWithContribution = false,
   onEdit,
   onDeleted,
}: {
   campaignId: string | null;
   onClose: () => void;
   onJoined?: () => void;
   startWithContribution?: boolean;
   onEdit?: (campaign: CampaignDetail) => void;
   onDeleted?: (campaignId: string) => void;
}) {
   const { user } = useAuth();
   const [data, setData] = useState<CampaignDetail | null>(null);
   const [loading, setLoading] = useState(false);
   const [joining, setJoining] = useState(false);
   const [deleting, setDeleting] = useState(false);
   const [actionError, setActionError] = useState("");
   const [showContribution, setShowContribution] = useState(false);
   const [contributionAmount, setContributionAmount] = useState("1.00");
   const [contributionError, setContributionError] = useState("");
   const [contributing, setContributing] = useState(false);

   useEffect(() => {
      if (!campaignId) return;
      setLoading(true);
      setData(null);
      setShowContribution(startWithContribution);
      fetch(`/api/campaigns/${campaignId}`)
         .then((r) => r.json())
         .then((d) => {
            const campaign = d.campaign ?? null;
            setData(campaign);
            if (campaign) {
               setContributionAmount(
                  Math.max(1, Number(campaign.minimumContribution)).toFixed(2),
               );
            }
         })
         .finally(() => setLoading(false));
   }, [campaignId, startWithContribution]);

   useEffect(() => {
      if (!campaignId) return;
      const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
      return () => {
         document.removeEventListener("keydown", onKey);
         document.body.style.overflow = "";
      };
   }, [campaignId, onClose]);

   if (!campaignId) return null;

   const join = async () => {
      if (!user) return;
      setJoining(true);
      try {
         await fetch(`/api/campaigns/${campaignId}/join`, { method: "POST" });
         setData((d) =>
            d ? { ...d, isMember: true, memberCount: d.memberCount + 1 } : d,
         );
         onJoined?.();
      } finally {
         setJoining(false);
      }
   };

   const removeCampaign = async () => {
      if (!campaignId || !window.confirm("Remove this campaign permanently?"))
         return;
      setDeleting(true);
      setActionError("");
      try {
         const response = await fetch(`/api/campaigns/${campaignId}`, {
            method: "DELETE",
         });
         const result = await response.json();
         if (!response.ok)
            throw new Error(result.message ?? "Could not remove campaign.");
         onDeleted?.(campaignId);
      } catch (error) {
         setActionError(
            error instanceof Error
               ? error.message
               : "Could not remove campaign.",
         );
      } finally {
         setDeleting(false);
      }
   };

   const contribute = async () => {
      if (!campaignId) return;
      if (!user) {
         setContributionError("Sign in to contribute to a campaign.");
         return;
      }

      setContributing(true);
      setContributionError("");
      try {
         const response = await fetch(
            `/api/campaigns/${campaignId}/contributions`,
            {
               method: "POST",
               headers: { "Content-Type": "application/json" },
               body: JSON.stringify({ amount: contributionAmount }),
            },
         );
         const result = await response.json();
         if (!response.ok)
            throw new Error(result.message ?? "Could not start checkout.");
         window.location.assign(result.checkoutUrl);
      } catch (error) {
         setContributionError(
            error instanceof Error
               ? error.message
               : "Could not start checkout.",
         );
      } finally {
         setContributing(false);
      }
   };

   const maxViews = Math.max(
      1,
      ...(data?.dailyViews.map((d) => d.views) ?? [1]),
   );

   return (
      <div className={styles.overlay} onMouseDown={onClose}>
         <div className={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
            <button
               className={styles.close}
               onClick={onClose}
               aria-label="Close"
            >
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
            </button>

            {loading || !data ? (
               <div className={styles.loading}>Loading…</div>
            ) : (
               <div className={styles.inner}>
                  {/* ============ Hero ============ */}
                  <div className={styles.hero}>
                     {data.coverImage && (
                        <img
                           src={data.coverImage}
                           alt=""
                           className={styles.heroImg}
                        />
                     )}
                     <div className={styles.heroOverlay} />
                     <div className={styles.heroContent}>
                        <div className={styles.heroBrand}>
                           <div className={styles.heroBrandLogo}>
                              {data.brandLogo ? (
                                 <img src={data.brandLogo} alt="" />
                              ) : (
                                 data.brandName[0]
                              )}
                           </div>
                           <span>{data.brandName}</span>
                        </div>
                        <h1 className={styles.heroTitle}>{data.title}</h1>
                     </div>
                  </div>

                  {/* ============ Status bar ============ */}
                  <div className={styles.statusBar}>
                     <div className={styles.statusLeft}>
                        <span className={styles.accepting}>
                           <span className={styles.dot} />
                           Accepting clips
                        </span>
                        <div className={styles.platformIcons}>
                           {data.platforms.map((p) => (
                              <span key={p} className={styles.platformBadge}>
                                 {PLATFORM_LABELS[p]}
                              </span>
                           ))}
                        </div>
                        <span className={styles.members}>
                           <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                           >
                              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                              <circle cx="9" cy="7" r="4" />
                           </svg>
                           {data.memberCount}
                        </span>
                        <span className={styles.members}>
                           <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                           >
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                              <polyline points="22 4 12 14.01 9 11.01" />
                           </svg>
                           {data.submissionCount}
                        </span>
                     </div>

                     <div className={styles.statusRight}>
                        {data.isOwner ? (
                           <div className={styles.ownerActions}>
                              <span className={styles.ownerBadge}>
                                 Your campaign
                              </span>
                              {onEdit && (
                                 <button
                                    className={styles.joinBtn}
                                    onClick={() => onEdit(data)}
                                 >
                                    Edit
                                 </button>
                              )}
                              {onDeleted && (
                                 <button
                                    className={styles.deleteBtn}
                                    onClick={removeCampaign}
                                    disabled={deleting}
                                 >
                                    {deleting ? "Removing…" : "Remove"}
                                 </button>
                              )}
                           </div>
                        ) : (
                           <div className={styles.creatorActions}>
                              {data.isMember ? (
                                 <span className={styles.joinedBadge}>
                                    Joined
                                 </span>
                              ) : (
                                 <button
                                    className={styles.joinBtn}
                                    onClick={join}
                                    disabled={joining}
                                 >
                                    {joining ? "Joining…" : "Join Campaign"}
                                 </button>
                              )}
                              <button
                                 className={styles.contributeAction}
                                 onClick={() =>
                                    setShowContribution((visible) => !visible)
                                 }
                              >
                                 Contribute
                              </button>
                           </div>
                        )}
                     </div>
                  </div>
                  {actionError && (
                     <p className={styles.actionError} role="alert">
                        {actionError}
                     </p>
                  )}

                  {showContribution && !data.isOwner && (
                     <section className={styles.contributionBox}>
                        <label htmlFor="contribution-amount">
                           Contribution amount (USD)
                        </label>
                        <div className={styles.contributionControls}>
                           <input
                              id="contribution-amount"
                              type="number"
                              min={Math.max(1, data.minimumContribution)}
                              step="0.01"
                              value={contributionAmount}
                              onChange={(event) =>
                                 setContributionAmount(event.target.value)
                              }
                           />
                           <button
                              className={styles.joinBtn}
                              onClick={contribute}
                              disabled={contributing}
                           >
                              {contributing
                                 ? "Opening checkout…"
                                 : "Continue to checkout"}
                           </button>
                        </div>
                        <p>
                           Minimum $
                           {Math.max(1, data.minimumContribution).toFixed(2)}
                           {data.contributionTotal > 0 &&
                              ` · $${data.contributionTotal.toFixed(2)} contributed so far`}
                        </p>
                        {contributionError && (
                           <p className={styles.contributionError} role="alert">
                              {contributionError}
                           </p>
                        )}
                     </section>
                  )}

                  {/* ============ Rates grid ============ */}
                  <section className={styles.section}>
                     <div className={styles.ratesGrid}>
                        {data.platforms.map((p: Platform) => (
                           <div key={p} className={styles.rateCard}>
                              <div className={styles.rateCardTitle}>
                                 {PLATFORM_LABELS[p]}
                              </div>
                              <div className={styles.rateRow}>
                                 <span className={styles.rateLabel}>
                                    Per 1k views
                                 </span>
                                 <span className={styles.rateValue}>
                                    {formatMoney(data.rates[p])}
                                 </span>
                              </div>
                              <div className={styles.rateRow}>
                                 <span className={styles.rateLabel}>
                                    Min payout
                                 </span>
                                 <span className={styles.rateValue}>
                                    {formatMoney(data.minPayoutCents)}
                                 </span>
                              </div>
                              <div className={styles.rateRow}>
                                 <span className={styles.rateLabel}>
                                    Max payout
                                 </span>
                                 <span className={styles.rateValue}>
                                    {formatMoney(data.maxPayoutCents)}
                                 </span>
                              </div>
                           </div>
                        ))}
                     </div>
                  </section>

                  {/* ============ Budget + Reference ============ */}
                  <section className={styles.twoCol}>
                     <div className={styles.panel}>
                        <div className={styles.panelTitle}>
                           <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                           >
                              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                           </svg>
                           Budget
                        </div>
                        <div className={styles.budgetAmounts}>
                           <span className={styles.budgetSpent}>
                              {formatMoney(data.spentCents)}
                           </span>
                           <span className={styles.budgetRemaining}>
                              {formatMoney(
                                 Math.max(
                                    0,
                                    data.budgetCents - data.spentCents,
                                 ),
                              )}{" "}
                              remaining
                           </span>
                        </div>
                        <div className={styles.budgetBar}>
                           <div
                              className={styles.budgetFill}
                              style={{
                                 width: `${Math.min(100, (data.spentCents / Math.max(1, data.budgetCents)) * 100)}%`,
                              }}
                           />
                        </div>
                        <p className={styles.budgetHint}>
                           {formatMoney(
                              Math.max(0, data.budgetCents - data.spentCents),
                           )}{" "}
                           still up for grabs
                        </p>
                     </div>

                     <div className={styles.panel}>
                        <div className={styles.panelTitle}>
                           <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                           >
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                              <path d="M14 2v6h6" />
                           </svg>
                           Reference materials
                        </div>
                        {data.referenceUrl ? (
                           <a
                              className={styles.refLink}
                              href={data.referenceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                           >
                              {data.referenceUrl}
                           </a>
                        ) : (
                           <p className={styles.emptyText}>
                              No references provided.
                           </p>
                        )}
                     </div>
                  </section>

                  {/* ============ Requirements ============ */}
                  <section className={styles.panel}>
                     <div className={styles.panelTitle}>
                        <svg
                           width="14"
                           height="14"
                           viewBox="0 0 24 24"
                           fill="none"
                           stroke="currentColor"
                           strokeWidth="2"
                        >
                           <path d="M9 12l2 2 4-4" />
                           <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c1.51 0 2.93.37 4.19 1.03" />
                        </svg>
                        Content requirements
                     </div>
                     <p className={styles.requirements}>
                        {data.requirements || "No specific requirements."}
                     </p>
                  </section>

                  {/* ============ Top clippers ============ */}
                  <section className={styles.section}>
                     <div className={styles.sectionHead}>
                        <h2 className={styles.sectionTitle}>Top clippers</h2>
                        <span className={styles.sectionSub}>
                           Clippers in this campaign earn{" "}
                           {formatMoney(
                              data.topClippers.length
                                 ? data.topClippers.reduce(
                                      (s, c) => s + c.earningsCents,
                                      0,
                                   ) / data.topClippers.length
                                 : 0,
                           )}{" "}
                           on average.
                        </span>
                     </div>

                     {data.topClippers.length === 0 ? (
                        <p
                           className={styles.emptyText}
                           style={{ padding: "1rem 0" }}
                        >
                           No submissions yet. Be the first!
                        </p>
                     ) : (
                        <div className={styles.clipperGrid}>
                           {data.topClippers.map((c) => (
                              <div key={c.rank} className={styles.clipperCard}>
                                 <div className={styles.clipperRank}>
                                    Rank {c.rank} / {data.memberCount}
                                 </div>
                                 <div
                                    className={styles.clipperTrophy}
                                    data-rank={c.rank}
                                 >
                                    <svg
                                       width="46"
                                       height="46"
                                       viewBox="0 0 24 24"
                                       fill="none"
                                       stroke="currentColor"
                                       strokeWidth="1.5"
                                    >
                                       <path d="M6 9H4a2 2 0 0 1 0-4h2M18 9h2a2 2 0 0 0 0-4h-2" />
                                       <path d="M6 4h12v5a6 6 0 0 1-12 0Z" />
                                       <path d="M9 21h6M12 15v6" />
                                    </svg>
                                 </div>
                                 <div className={styles.clipperRow}>
                                    <div className={styles.clipperAvatar}>
                                       {c.image ? (
                                          <img src={c.image} alt="" />
                                       ) : (
                                          c.name[0]
                                       )}
                                    </div>
                                    <span className={styles.clipperName}>
                                       {c.name}
                                    </span>
                                    <span className={styles.clipperEarnings}>
                                       {formatMoney(c.earningsCents)}
                                    </span>
                                 </div>
                              </div>
                           ))}
                        </div>
                     )}
                  </section>

                  {/* ============ Views chart ============ */}
                  <section className={styles.section}>
                     <div className={styles.viewsHeader}>
                        <div>
                           <div className={styles.viewsBig}>
                              {formatViews(data.totalViews)}{" "}
                              <span className={styles.viewsSmall}>views</span>
                           </div>
                           <p className={styles.viewsSub}>
                              Views across every approved clip, running total by
                              day.
                           </p>
                        </div>
                        <div className={styles.viewsTabs}>
                           <button className={styles.viewsTabActive}>
                              Views
                           </button>
                           <button className={styles.viewsTab}>
                              Submissions
                           </button>
                        </div>
                     </div>
                     <div className={styles.chart}>
                        <svg
                           viewBox="0 0 800 180"
                           preserveAspectRatio="none"
                           className={styles.chartSvg}
                        >
                           <defs>
                              <linearGradient
                                 id="viewsGrad"
                                 x1="0"
                                 x2="0"
                                 y1="0"
                                 y2="1"
                              >
                                 <stop
                                    offset="0%"
                                    stopColor="#f97316"
                                    stopOpacity="0.35"
                                 />
                                 <stop
                                    offset="100%"
                                    stopColor="#f97316"
                                    stopOpacity="0"
                                 />
                              </linearGradient>
                           </defs>
                           {(() => {
                              const pts = data.dailyViews.map((d, i) => {
                                 const x =
                                    (i /
                                       Math.max(
                                          1,
                                          data.dailyViews.length - 1,
                                       )) *
                                    800;
                                 const y = 180 - (d.views / maxViews) * 150;
                                 return [x, y] as const;
                              });
                              if (pts.length === 0) return null;
                              const line = pts
                                 .map(
                                    (p, i) =>
                                       `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`,
                                 )
                                 .join(" ");
                              const area = `${line} L800,180 L0,180 Z`;
                              return (
                                 <>
                                    <path d={area} fill="url(#viewsGrad)" />
                                    <path
                                       d={line}
                                       fill="none"
                                       stroke="#f97316"
                                       strokeWidth="2"
                                    />
                                    <circle
                                       cx={pts[pts.length - 1][0]}
                                       cy={pts[pts.length - 1][1]}
                                       r="5"
                                       fill="#f97316"
                                    />
                                 </>
                              );
                           })()}
                        </svg>
                     </div>
                  </section>
               </div>
            )}
         </div>
      </div>
   );
}
