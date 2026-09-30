import { NextResponse } from "next/server";
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
         isOwner: session?.user?.id === c.creatorId,
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
   if (existing.creatorId !== session.user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
   }

   const body = await req.json();
   const updated = await prisma.campaign.update({
      where: { id },
      data: {
         title: body.title,
         description: body.description,
         status: body.status,
         budgetCents: body.budgetCents,
      },
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
      select: { creatorId: true },
   });
   if (!existing)
      return NextResponse.json({ message: "Not found" }, { status: 404 });
   if (existing.creatorId !== session.user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
   }

   await prisma.campaign.delete({ where: { id } });
   return NextResponse.json({ ok: true });
}
