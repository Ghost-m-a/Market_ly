// lib/campaign-types.ts
export type Platform = "tiktok" | "x" | "instagram" | "youtube" | "facebook";

export const PLATFORM_LABELS: Record<Platform, string> = {
   tiktok: "TikTok",
   x: "X",
   instagram: "Instagram",
   youtube: "YouTube",
   facebook: "Facebook",
};

export function formatMoney(cents: number): string {
   const dollars = cents / 100;
   if (dollars >= 1000)
      return `$${(dollars / 1000).toFixed(dollars % 1000 === 0 ? 0 : 1)}k`;
   return `$${dollars.toFixed(2)}`;
}

export function formatViews(n: number): string {
   if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
   if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
   return String(n);
}

export type CampaignSummary = {
   id: string;
   title: string;
   brandName: string;
   brandLogo: string | null;
   coverImage: string | null;
   status: "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED" | "ARCHIVED";
   budgetCents: number;
   spentCents: number;
   platforms: Platform[];
   rates: Record<Platform, number>;
   memberCount: number;
   submissionCount: number;
   totalViews: number;
   createdAt: string;
};

export type CampaignDetail = CampaignSummary & {
   description: string | null;
   requirements: string | null;
   referenceUrl: string | null;
   minPayoutCents: number;
   maxPayoutCents: number;
   isMember: boolean;
   isOwner: boolean;
   topClippers: {
      rank: number;
      name: string;
      image: string | null;
      earningsCents: number;
   }[];
   dailyViews: { date: string; views: number }[];
};
