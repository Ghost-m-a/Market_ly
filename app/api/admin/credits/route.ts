import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
   const session = await getAdminSession();
   if (!session)
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });

   let userId: unknown;
   let amount: unknown;
   try {
      ({ userId, amount } = (await req.json()) ?? {});
   } catch {
      return NextResponse.json(
         { message: "Invalid credit grant." },
         { status: 400 },
      );
   }
   if (
      typeof userId !== "string" ||
      !Number.isSafeInteger(amount) ||
      Number(amount) <= 0 ||
      Number(amount) > 1_000_000_000
   ) {
      return NextResponse.json(
         {
            message:
               "Provide a valid account and a positive whole-number credit amount.",
         },
         { status: 400 },
      );
   }

   try {
      const balance = await prisma.$transaction(async (tx) => {
         const user = await tx.user.update({
            where: { id: userId },
            data: { creditsBalance: { increment: Number(amount) } },
            select: { creditsBalance: true },
         });
         await tx.creditLedger.create({
            data: {
               userId,
               amount: Number(amount),
               description: `Admin credit grant by ${session.user.email ?? session.user.id}`,
            },
         });
         return user.creditsBalance;
      });
      return NextResponse.json({ userId, amount, balance });
   } catch {
      return NextResponse.json(
         { message: "Could not grant credits to that account." },
         { status: 404 },
      );
   }
}
