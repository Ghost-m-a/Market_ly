"use client";

import { useEffect, useState } from "react";
import { PageHead } from "@/components/ui/Page";
import {
   CampaignCard,
   CampaignCardSkeleton,
} from "@/components/campaigns/CampaignCard";
import CampaignDetailModal from "@/components/campaigns/CampaignDetailModal";
import type { CampaignSummary } from "@/lib/campaigns";

export default function DiscoverPage() {
   const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
   const [loading, setLoading] = useState(true);
   const [openId, setOpenId] = useState<string | null>(null);
   const [contributeId, setContributeId] = useState<string | null>(null);

   useEffect(() => {
      fetch("/api/campaigns?status=ACTIVE")
         .then((r) => r.json())
         .then((d) => setCampaigns(d.campaigns ?? []))
         .finally(() => setLoading(false));
   }, []);

   return (
      <div>
         <PageHead
            title="Discover Campaigns"
            subtitle="Browse active content reward campaigns and start earning."
         />

         {loading ? (
            <div
               style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: 16,
               }}
            >
               {Array.from({ length: 6 }).map((_, i) => (
                  <CampaignCardSkeleton key={i} />
               ))}
            </div>
         ) : campaigns.length === 0 ? (
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
                  No active campaigns yet
               </h3>
               <p
                  style={{
                     margin: 0,
                     fontSize: "0.85rem",
                     color: "var(--color-text-secondary)",
                  }}
               >
                  Be the first to launch one — go to your dashboard and create a
                  campaign.
               </p>
            </div>
         ) : (
            <div
               style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: 16,
               }}
            >
               {campaigns.map((c) => (
                  <CampaignCard
                     key={c.id}
                     campaign={c}
                     onClick={() => {
                        setContributeId(null);
                        setOpenId(c.id);
                     }}
                     onContribute={() => {
                        setContributeId(c.id);
                        setOpenId(c.id);
                     }}
                  />
               ))}
            </div>
         )}

         <CampaignDetailModal
            campaignId={openId}
            startWithContribution={!!openId && contributeId === openId}
            onClose={() => {
               setOpenId(null);
               setContributeId(null);
            }}
            onJoined={() => {
               // refresh list is optional
            }}
         />
      </div>
   );
}
