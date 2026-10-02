// lib/campaigns-server.ts
// ⚠️ Server-only. Imported by API routes only. Never by client components.

import { prisma } from "./prisma";
import type { CampaignSummary, Platform } from "./campaigns";

export function toSummary(c: any): CampaignSummary {
   const totalViews =
      c.submissions?.reduce(
         (s: number, x: { views: number }) => s + x.views,
         0,
      ) ?? 0;

   return {
      id: c.id,
      title: c.title,
      brandName: c.brandName,
      brandLogo: c.brandLogo,
      coverImage: c.coverImage,
      status: c.status,
      budgetCents: c.budgetCents,
      spentCents: c.spentCents,
      targetViews: c.targetViews,
      campaignCostCredits: c.campaignCostCredits,
      platforms: c.platforms as Platform[],
      rates: {
         tiktok: c.rateTiktokCents,
         x: c.rateXCents,
         instagram: c.rateInstagramCents,
         youtube: c.rateYoutubeCents,
         facebook: c.rateFacebookCents,
      },
      memberCount: c._count?.members ?? 0,
      submissionCount: c._count?.submissions ?? 0,
      totalViews,
      createdAt: c.createdAt.toISOString(),
   };
}

export async function listCampaigns(opts?: {
   creatorId?: string;
   status?: string;
}) {
   const where: any = {};
   if (opts?.creatorId) where.creatorId = opts.creatorId;
   if (opts?.status) where.status = opts.status;

   const campaigns = await prisma.campaign.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
         _count: { select: { members: true, submissions: true } },
         submissions: { select: { views: true } },
      },
   });

   return campaigns.map(toSummary);
}
