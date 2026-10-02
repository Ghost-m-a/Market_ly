"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { PageHead, PrimaryBtn } from "@/components/ui/Page";
import { IPlus } from "@/components/ui/Icons";
import {
   CampaignCard,
   CampaignCardSkeleton,
} from "@/components/campaigns/CampaignCard";
import CampaignDetailModal from "@/components/campaigns/CampaignDetailModal";
import CreateCampaignModal from "@/components/campaigns/CreateCampaignModal";
import type { CampaignDetail, CampaignSummary } from "@/lib/campaigns";
import styles from "./dashboard.module.css";

export default function DashboardPage() {
   const { user, loading: authLoading } = useAuth();
   const [created, setCreated] = useState<CampaignSummary[]>([]);
   const [contributed, setContributed] = useState<CampaignSummary[]>([]);
   const [loading, setLoading] = useState(true);
   const [createOpen, setCreateOpen] = useState(false);
   const [openId, setOpenId] = useState<string | null>(null);
   const [editing, setEditing] = useState<CampaignDetail | null>(null);

   const load = () => {
      if (!user) return;
      setLoading(true);
      fetch("/api/me/campaigns")
         .then((r) => r.json())
         .then((d) => {
            setCreated(d.created ?? []);
            setContributed(d.contributed ?? []);
         })
         .finally(() => setLoading(false));
   };

   useEffect(load, [user]);

   if (authLoading) return null;
   if (!user) return null;

   return (
      <div>
         <PageHead
            title={`Welcome back, ${user.name.split(" ")[0]}`}
            subtitle="Here's what's happening with your campaigns."
            actions={
               <PrimaryBtn onClick={() => setCreateOpen(true)}>
                  <IPlus size={14} /> New campaign
               </PrimaryBtn>
            }
         />

         {/* Campaigns you created */}
         <section className={styles.section}>
            <div className={styles.sectionHead}>
               <h2 className={styles.sectionTitle}>Your campaigns</h2>
               <span className={styles.sectionCount}>{created.length}</span>
            </div>

            {loading ? (
               <div className={styles.grid}>
                  {Array.from({ length: 3 }).map((_, i) => (
                     <CampaignCardSkeleton key={i} />
                  ))}
               </div>
            ) : created.length === 0 ? (
               <div className={styles.empty}>
                  <h3>You haven&apos;t created any campaigns yet</h3>
                  <p>
                     Launch your first campaign to start rewarding creators for
                     their clips.
                  </p>
                  <PrimaryBtn onClick={() => setCreateOpen(true)}>
                     <IPlus size={14} /> Create your first campaign
                  </PrimaryBtn>
               </div>
            ) : (
               <div className={styles.grid}>
                  {created.map((c) => (
                     <CampaignCard
                        key={c.id}
                        campaign={c}
                        onClick={() => setOpenId(c.id)}
                     />
                  ))}
               </div>
            )}
         </section>

         {/* Campaigns you joined */}
         <section className={styles.section}>
            <div className={styles.sectionHead}>
               <h2 className={styles.sectionTitle}>Contributed campaigns</h2>
               <span className={styles.sectionCount}>{contributed.length}</span>
            </div>

            {loading ? (
               <div className={styles.grid}>
                  {Array.from({ length: 3 }).map((_, i) => (
                     <CampaignCardSkeleton key={i} />
                  ))}
               </div>
            ) : contributed.length === 0 ? (
               <div className={styles.empty}>
                  <h3>You haven&apos;t joined any campaigns yet</h3>
                  <p>
                     Browse active campaigns and start earning from your clips.
                  </p>
                  <Link href="/dashboard/discover" className={styles.linkBtn}>
                     Explore campaigns
                  </Link>
               </div>
            ) : (
               <div className={styles.grid}>
                  {contributed.map((c) => (
                     <CampaignCard
                        key={c.id}
                        campaign={c}
                        onClick={() => setOpenId(c.id)}
                     />
                  ))}
               </div>
            )}
         </section>

         <CreateCampaignModal
            open={createOpen || !!editing}
            campaign={editing}
            onClose={() => {
               setCreateOpen(false);
               setEditing(null);
            }}
            onCreated={(c) => {
               setCreated((prev) => [c, ...prev]);
               setCreateOpen(false);
            }}
            onUpdated={(campaign) => {
               setCreated((current) =>
                  current.map((item) =>
                     item.id === campaign.id ? campaign : item,
                  ),
               );
               setEditing(null);
               load();
            }}
         />

         <CampaignDetailModal
            campaignId={openId}
            onClose={() => setOpenId(null)}
            onJoined={load}
            onEdit={(campaign) => {
               setOpenId(null);
               setEditing(campaign);
            }}
            onDeleted={(campaignId) => {
               setCreated((current) =>
                  current.filter((item) => item.id !== campaignId),
               );
               setOpenId(null);
            }}
         />
      </div>
   );
}
