import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { toSummary } from "@/lib/campaigns-server"; // ← changed
export async function GET() {
   const session = await auth();
   if (!session?.user?.id)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

   const userId = session.user.id;

   const [created, joined] = await Promise.all([
      prisma.campaign.findMany({
         where: { creatorId: userId },
         orderBy: { createdAt: "desc" },
         include: {
            _count: { select: { members: true, submissions: true } },
            submissions: { select: { views: true } },
         },
      }),
      prisma.campaign.findMany({
         where: { members: { some: { userId } }, creatorId: { not: userId } },
         orderBy: { createdAt: "desc" },
         include: {
            _count: { select: { members: true, submissions: true } },
            submissions: { select: { views: true } },
         },
      }),
   ]);

   return NextResponse.json({
      created: created.map(toSummary),
      contributed: joined.map(toSummary),
   });
}
