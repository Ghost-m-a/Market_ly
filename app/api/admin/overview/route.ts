import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { toSummary } from "@/lib/campaigns-server";

export async function GET() {
   const session = await getAdminSession();
   if (!session) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
   }

   const [users, records] = await Promise.all([
      prisma.user.findMany({
         select: {
            id: true,
            name: true,
            email: true,
            role: true,
            emailVerified: true,
            createdAt: true,
            creditsBalance: true,
            _count: { select: { campaigns: true } },
         },
         orderBy: { createdAt: "desc" },
         take: 100,
      }),
      prisma.campaign.findMany({
         include: {
            creator: { select: { name: true, email: true } },
            _count: { select: { members: true, submissions: true } },
            submissions: { select: { views: true } },
         },
         orderBy: { updatedAt: "desc" },
      }),
   ]);

   return NextResponse.json({
      users: users.map((user) => ({
         ...user,
         emailVerified: user.emailVerified?.toISOString() ?? null,
         createdAt: user.createdAt.toISOString(),
      })),
      campaigns: records.map((campaign) => ({
         ...toSummary(campaign),
         creatorName: campaign.creator.name,
         creatorEmail: campaign.creator.email,
      })),
   });
}
