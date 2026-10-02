import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { toSummary } from "@/lib/campaigns-server"; // ← changed
export async function GET(
   _req: Request,
   { params }: { params: Promise<{ id: string }> },
) {
   const { id } = await params;
   const session = await auth();

   const c = await prisma.campaign.findUnique({
      where: { id },
      include: {
         _count: { select: { members: true, submissions: true } },
         submissions: {
            select: {
               views: true,
               earningsCents: true,
               userId: true,
               createdAt: true,
               user: { select: { id: true, name: true, image: true } },
            },
         },
         members: session?.user?.id
            ? { where: { userId: session.user.id }, select: { id: true } }
            : false,
      },
   });

   if (!c) return NextResponse.json({ message: "Not found" }, { status: 404 });

   const contributionAggregate = await prisma.campaignContributor.aggregate({
      where: { campaignId: id },
      _sum: { contributionCents: true },
   });

   // Aggregate top clippers from submissions
   const byUser = new Map<
      string,
      { name: string; image: string | null; earningsCents: number }
   >();
   for (const s of c.submissions) {
      const cur = byUser.get(s.userId) ?? {
         name: s.user.name,
         image: s.user.image,
         earningsCents: 0,
      };
      cur.earningsCents += s.earningsCents;
      byUser.set(s.userId, cur);
   }
   const topClippers = Array.from(byUser.values())
      .sort((a, b) => b.earningsCents - a.earningsCents)
      .slice(0, 3)
      .map((u, i) => ({ rank: i + 1, ...u }));

   // Daily views (last 30 days)
   const days = 30;
   const buckets: Record<string, number> = {};
   const now = new Date();
   for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      buckets[d.toISOString().slice(0, 10)] = 0;
   }
   for (const s of c.submissions) {
      const key = s.createdAt.toISOString().slice(0, 10);
      if (key in buckets) buckets[key] += s.views;
   }
   const dailyViews = Object.entries(buckets).map(([date, views]) => ({
      date,
      views,
   }));

   const summary = toSummary(c);

   return NextResponse.json({
      campaign: {
         ...summary,
         description: c.description,
         requirements: c.requirements,
         referenceUrl: c.referenceUrl,
         minPayoutCents: c.minPayoutCents,
         maxPayoutCents: c.maxPayoutCents,
         minimumContribution: c.minimumContributionCents / 100,
         contributionTotal:
            (contributionAggregate._sum?.contributionCents ?? 0) / 100,
         isOwner:
            session?.user?.id === c.creatorId ||
            session?.user?.role === "ADMIN",
         isMember:
            Array.isArray((c as any).members) && (c as any).members.length > 0,
         topClippers,
         dailyViews,
      },
   });
}

export async function PATCH(
   req: Request,
   { params }: { params: Promise<{ id: string }> },
) {
   const { id } = await params;
   const session = await auth();
   if (!session?.user?.id)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

   const existing = await prisma.campaign.findUnique({
      where: { id },
      select: { creatorId: true },
   });
   if (!existing)
      return NextResponse.json({ message: "Not found" }, { status: 404 });
   if (
      existing.creatorId !== session.user.id &&
      session.user.role !== "ADMIN"
   ) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
   }

   const body = await req.json();
   const data: Prisma.CampaignUpdateInput = {};

   if (typeof body.title === "string") data.title = body.title.trim();
   if (typeof body.brandName === "string")
      data.brandName = body.brandName.trim();
   if ("brandLogo" in body)
      data.brandLogo =
         typeof body.brandLogo === "string"
            ? body.brandLogo.trim() || null
            : null;
   if ("coverImage" in body)
      data.coverImage =
         typeof body.coverImage === "string"
            ? body.coverImage.trim() || null
            : null;
   if ("description" in body)
      data.description =
         typeof body.description === "string"
            ? body.description.trim() || null
            : null;
   if ("requirements" in body)
      data.requirements =
         typeof body.requirements === "string"
            ? body.requirements.trim() || null
            : null;
   if ("referenceUrl" in body)
      data.referenceUrl =
         typeof body.referenceUrl === "string"
            ? body.referenceUrl.trim() || null
            : null;

   if (body.budgetCents !== undefined) {
      const budgetCents = Number(body.budgetCents);
      if (!Number.isInteger(budgetCents) || budgetCents <= 0) {
         return NextResponse.json(
            { message: "Budget must be greater than zero." },
            { status: 400 },
         );
      }
      data.budgetCents = budgetCents;
   }

   if (Array.isArray(body.platforms)) {
      const platforms = body.platforms.filter(
         (platform: unknown) => typeof platform === "string",
      );
      if (platforms.length === 0) {
         return NextResponse.json(
            { message: "Choose at least one platform." },
            { status: 400 },
         );
      }
      data.platforms = platforms;
   }

   if (body.rates && typeof body.rates === "object") {
      const rateFields = {
         tiktok: "rateTiktokCents",
         x: "rateXCents",
         instagram: "rateInstagramCents",
         youtube: "rateYoutubeCents",
         facebook: "rateFacebookCents",
      } as const;
      for (const [platform, field] of Object.entries(rateFields)) {
         if (body.rates[platform] !== undefined) {
            const rate = Number(body.rates[platform]);
            if (!Number.isInteger(rate) || rate < 0) {
               return NextResponse.json(
                  { message: "Rates must be zero or greater." },
                  { status: 400 },
               );
            }
            data[field] = rate;
         }
      }
   }

   if (body.minPayoutCents !== undefined)
      data.minPayoutCents = Math.max(
         0,
         Math.round(Number(body.minPayoutCents)),
      );
   if (body.maxPayoutCents !== undefined)
      data.maxPayoutCents = Math.max(
         0,
         Math.round(Number(body.maxPayoutCents)),
      );
   if (body.minimumContribution !== undefined) {
      const minimumContribution = Number(body.minimumContribution);
      if (!Number.isFinite(minimumContribution) || minimumContribution < 0) {
         return NextResponse.json(
            { message: "Minimum contribution must be zero or greater." },
            { status: 400 },
         );
      }
      const minimumContributionCents = Math.round(minimumContribution * 100);
      if (
         Math.abs(minimumContribution * 100 - minimumContributionCents) >
         0.000001
      ) {
         return NextResponse.json(
            {
               message:
                  "Minimum contribution must use at most two decimal places.",
            },
            { status: 400 },
         );
      }
      data.minimumContributionCents = minimumContributionCents;
   }
   if (typeof body.status === "string") {
      const statuses = [
         "DRAFT",
         "ACTIVE",
         "PAUSED",
         "COMPLETED",
         "ARCHIVED",
      ] as const;
      if (!statuses.includes(body.status)) {
         return NextResponse.json(
            { message: "Invalid campaign status." },
            { status: 400 },
         );
      }
      data.status = body.status;
   }

   const updated = await prisma.campaign.update({
      where: { id },
      data,
      include: {
         _count: { select: { members: true, submissions: true } },
         submissions: { select: { views: true } },
      },
   });

   return NextResponse.json({ campaign: toSummary(updated) });
}

export async function DELETE(
   _req: Request,
   { params }: { params: Promise<{ id: string }> },
) {
   const { id } = await params;
   const session = await auth();
   if (!session?.user?.id)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

   const existing = await prisma.campaign.findUnique({
      where: { id },
      select: {
         creatorId: true,
         title: true,
         campaignCostCredits: true,
         _count: { select: { transactions: true, contributors: true } },
      },
   });
   if (!existing)
      return NextResponse.json({ message: "Not found" }, { status: 404 });
   if (
      existing.creatorId !== session.user.id &&
      session.user.role !== "ADMIN"
   ) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
   }

   if (existing._count.transactions > 0 || existing._count.contributors > 0) {
      await prisma.campaign.update({
         where: { id },
         data: { status: "ARCHIVED" },
      });
      return NextResponse.json({ ok: true, archived: true });
   }

   await prisma.$transaction(async (tx) => {
      await tx.campaign.delete({ where: { id } });
      if (existing.campaignCostCredits > 0) {
         await tx.user.update({
            where: { id: existing.creatorId },
            data: {
               creditsBalance: { increment: existing.campaignCostCredits },
            },
         });
         await tx.creditLedger.create({
            data: {
               userId: existing.creatorId,
               amount: existing.campaignCostCredits,
               description: `Refund for removed campaign: ${existing.title}`,
            },
         });
      }
   });
   return NextResponse.json({
      ok: true,
      archived: false,
      refundedCredits: existing.campaignCostCredits,
   });
}
