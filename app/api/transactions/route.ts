import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
   const session = await auth();
   if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
   }

   try {
      const transactions = await prisma.transaction.findMany({
         where: { userId: session.user.id },
         orderBy: { createdAt: "desc" },
         include: { campaign: { select: { id: true, title: true } } },
      });

      return NextResponse.json(
         transactions.map((transaction) => ({
            ...transaction,
            amount: Number(transaction.amount),
            amountPaid: Number(transaction.amountPaid),
         })),
      );
   } catch (error) {
      console.error("[GET TRANSACTIONS ERROR]", error);
      return NextResponse.json(
         { message: "Could not load transactions." },
         { status: 500 },
      );
   }
}
