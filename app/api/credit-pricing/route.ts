import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
   const session = await auth();
   if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
   }

   const pricing = await prisma.creditPricing.findUnique({
      where: { id: "default" },
   });
   return NextResponse.json({
      creditsPerThousandViews: pricing?.creditsPerThousandViews ?? 0,
   });
}
