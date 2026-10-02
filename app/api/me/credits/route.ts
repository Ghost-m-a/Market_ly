import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
   const session = await auth();
   if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
   }

   const [user, transactions] = await Promise.all([
      prisma.user.findUnique({
         where: { id: session.user.id },
         select: { creditsBalance: true },
      }),
      prisma.creditLedger.findMany({
         where: { userId: session.user.id },
         select: { id: true, amount: true, description: true, createdAt: true },
         orderBy: { createdAt: "desc" },
         take: 20,
      }),
   ]);

   return NextResponse.json({
      balance: user?.creditsBalance ?? 0,
      transactions: transactions.map((item) => ({
         ...item,
         createdAt: item.createdAt.toISOString(),
      })),
   });
}
