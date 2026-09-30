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

      const c = await prisma.campaign.create({
         data: {
            creatorId: session.user.id,
            title,
            brandName,
            brandLogo: brandLogo || null,
            coverImage: coverImage || null,
            description: description || null,
            budgetCents: Number(budgetCents),
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

      return NextResponse.json({ campaign: toSummary(c) }, { status: 201 });
   } catch (err) {
      console.error("[campaigns.POST]", err);
      return NextResponse.json(
         { message: "Could not create campaign." },
         { status: 500 },
      );
   }
}
