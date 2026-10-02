import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { listCampaigns, toSummary } from "@/lib/campaigns-server"; // ← changed

export async function GET(req: Request) {
   const url = new URL(req.url);
   const creatorId = url.searchParams.get("creatorId") ?? undefined;
   const status = url.searchParams.get("status") ?? undefined;

   const campaigns = await listCampaigns({ creatorId, status });
   return NextResponse.json({ campaigns });
}

export async function POST(req: Request) {
   const session = await auth();
   if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
   }

   try {
      const body = await req.json();
      const {
         title,
         brandName,
         brandLogo,
         coverImage,
         description,
         budgetCents,
         targetViews,
         minimumContribution,
         rates,
         platforms,
         minPayoutCents,
         maxPayoutCents,
         requirements,
         referenceUrl,
      } = body ?? {};

      if (!title || !brandName || !budgetCents || !platforms?.length) {
         return NextResponse.json(
            {
               message:
                  "title, brandName, budgetCents, and platforms are required.",
            },
            { status: 400 },
         );
      }

      const targetViewCount = Number(targetViews);
      if (
         !Number.isSafeInteger(targetViewCount) ||
         targetViewCount < 1 ||
         targetViewCount > 1_000_000_000
      ) {
         return NextResponse.json(
            { message: "Target views must be between 1 and 1,000,000,000." },
            { status: 400 },
         );
      }

      const minimumContributionAmount = Number(minimumContribution ?? 0);
      if (
         !Number.isFinite(minimumContributionAmount) ||
         minimumContributionAmount < 0
      ) {
         return NextResponse.json(
            { message: "Minimum contribution must be zero or greater." },
            { status: 400 },
         );
      }

      const c = await prisma.$transaction(async (tx) => {
         const pricing = await tx.creditPricing.findUnique({
            where: { id: "default" },
         });
         if (!pricing || pricing.creditsPerThousandViews <= 0) {
            throw new Error("CREDIT_PRICING_NOT_CONFIGURED");
         }

         const costCredits = Math.ceil(
            (targetViewCount * pricing.creditsPerThousandViews) / 1000,
         );
         if (
            !Number.isSafeInteger(costCredits) ||
            costCredits > 2_147_483_647
         ) {
            throw new Error("CREDIT_COST_TOO_HIGH");
         }

         const debit = await tx.user.updateMany({
            where: {
               id: session.user.id,
               creditsBalance: { gte: costCredits },
            },
            data: { creditsBalance: { decrement: costCredits } },
         });
         if (debit.count !== 1) throw new Error("INSUFFICIENT_CREDITS");

         const campaign = await tx.campaign.create({
            data: {
               creatorId: session.user.id,
               title,
               brandName,
               brandLogo: brandLogo || null,
               coverImage: coverImage || null,
               description: description || null,
               budgetCents: Number(budgetCents),
               minimumContribution: minimumContributionAmount,
               targetViews: targetViewCount,
               campaignCostCredits: costCredits,
               rateTiktokCents: Number(rates?.tiktok ?? 0),
               rateXCents: Number(rates?.x ?? 0),
               rateInstagramCents: Number(rates?.instagram ?? 0),
               rateYoutubeCents: Number(rates?.youtube ?? 0),
               rateFacebookCents: Number(rates?.facebook ?? 0),
               platforms: platforms as string[],
               minPayoutCents: Number(minPayoutCents ?? 0),
               maxPayoutCents: Number(maxPayoutCents ?? 0),
               requirements: requirements || null,
               referenceUrl: referenceUrl || null,
               status: "ACTIVE",
            },
            include: {
               _count: { select: { members: true, submissions: true } },
               submissions: { select: { views: true } },
            },
         });

         await tx.creditLedger.create({
            data: {
               userId: session.user.id,
               campaignId: campaign.id,
               amount: -costCredits,
               description: `Campaign launch: ${campaign.title}`,
            },
         });
         return campaign;
      });

      return NextResponse.json({ campaign: toSummary(c) }, { status: 201 });
   } catch (err) {
      const code = err instanceof Error ? err.message : "";
      if (code === "INSUFFICIENT_CREDITS") {
         return NextResponse.json(
            { message: "Not enough credits to launch this campaign." },
            { status: 402 },
         );
      }
      if (code === "CREDIT_PRICING_NOT_CONFIGURED") {
         return NextResponse.json(
            {
               message:
                  "Campaign credit pricing has not been configured by an admin.",
            },
            { status: 503 },
         );
      }
      if (code === "CREDIT_COST_TOO_HIGH") {
         return NextResponse.json(
            {
               message:
                  "This target view count exceeds the supported credit cost.",
            },
            { status: 400 },
         );
      }
      console.error("[campaigns.POST]", err);
      return NextResponse.json(
         { message: "Could not create campaign." },
         { status: 500 },
      );
   }
}
