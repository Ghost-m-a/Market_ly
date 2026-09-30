import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
   _req: Request,
   { params }: { params: Promise<{ id: string }> },
) {
   const { id } = await params;
   const subs = await prisma.submission.findMany({
      where: { campaignId: id },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, name: true, image: true } } },
   });
   return NextResponse.json({ submissions: subs });
}

export async function POST(
   req: Request,
   { params }: { params: Promise<{ id: string }> },
) {
   const { id } = await params;
   const session = await auth();
   if (!session?.user?.id)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

   const body = await req.json();
   const { url, platform } = body ?? {};
   if (!url || !platform) {
      return NextResponse.json(
         { message: "url and platform are required." },
         { status: 400 },
      );
   }

   // Auto-join on submit
   await prisma.campaignMember.upsert({
      where: { campaignId_userId: { campaignId: id, userId: session.user.id } },
      create: { campaignId: id, userId: session.user.id },
      update: {},
   });

   const sub = await prisma.submission.create({
      data: {
         campaignId: id,
         userId: session.user.id,
         url,
         platform,
         status: "PENDING",
      },
   });

   return NextResponse.json({ submission: sub }, { status: 201 });
}
