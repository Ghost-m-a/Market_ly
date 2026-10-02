import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
   const session = await getAdminSession();
   if (!session)
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });

   const pricing = await prisma.creditPricing.findUnique({
      where: { id: "default" },
   });
   return NextResponse.json({
      creditsPerThousandViews: pricing?.creditsPerThousandViews ?? 0,
      updatedAt: pricing?.updatedAt.toISOString() ?? null,
   });
}

export async function PATCH(req: Request) {
   const session = await getAdminSession();
   if (!session)
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });

   let creditsPerThousandViews: unknown;
   try {
      ({ creditsPerThousandViews } = (await req.json()) ?? {});
   } catch {
      return NextResponse.json(
         { message: "Invalid pricing request." },
         { status: 400 },
      );
   }
   if (
      !Number.isSafeInteger(creditsPerThousandViews) ||
      Number(creditsPerThousandViews) < 1 ||
      Number(creditsPerThousandViews) > 1_000_000
   ) {
      return NextResponse.json(
         {
            message:
               "Rate must be a whole number between 1 and 1,000,000 credits per 1,000 views.",
         },
         { status: 400 },
      );
   }

   const pricing = await prisma.creditPricing.upsert({
      where: { id: "default" },
      create: {
         id: "default",
         creditsPerThousandViews: Number(creditsPerThousandViews),
      },
      update: { creditsPerThousandViews: Number(creditsPerThousandViews) },
   });
   return NextResponse.json({
      creditsPerThousandViews: pricing.creditsPerThousandViews,
      updatedAt: pricing.updatedAt.toISOString(),
   });
}
