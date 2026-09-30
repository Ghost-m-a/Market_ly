import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
   _req: Request,
   { params }: { params: Promise<{ id: string }> },
) {
   const { id } = await params;
   const session = await auth();
   if (!session?.user?.id)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

   const campaign = await prisma.campaign.findUnique({
      where: { id },
      select: { id: true, creatorId: true },
   });
   if (!campaign)
      return NextResponse.json({ message: "Not found" }, { status: 404 });
   if (campaign.creatorId === session.user.id) {
      return NextResponse.json(
         { message: "You can't join your own campaign." },
         { status: 400 },
      );
   }

   await prisma.campaignMember.upsert({
      where: { campaignId_userId: { campaignId: id, userId: session.user.id } },
      create: { campaignId: id, userId: session.user.id },
      update: {},
   });

   return NextResponse.json({ ok: true });
}
