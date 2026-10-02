import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getStripeClient } from "@/lib/stripe";

export async function POST(
   request: Request,
   { params }: { params: Promise<{ id: string }> },
) {
   const session = await auth();
   if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
   }

   const { id: campaignId } = await params;
   let transactionId: string | undefined;

   try {
      const body = await request.json();
      const amount = Number(body?.amount);
      const amountCents = Math.round(amount * 100);

      if (
         !Number.isFinite(amount) ||
         amount <= 0 ||
         Math.abs(amount * 100 - amountCents) > 0.000001 ||
         amountCents > 99_999_999
      ) {
         return NextResponse.json(
            { message: "Enter a valid contribution amount in USD." },
            { status: 400 },
         );
      }

      const campaign = await prisma.campaign.findUnique({
         where: { id: campaignId },
         select: {
            id: true,
            title: true,
            creatorId: true,
            status: true,
            minimumContributionCents: true,
         },
      });

      if (!campaign) {
         return NextResponse.json(
            { message: "Campaign not found." },
            { status: 404 },
         );
      }
      if (campaign.status !== "ACTIVE") {
         return NextResponse.json(
            { message: "This campaign is not accepting contributions." },
            { status: 409 },
         );
      }
      if (campaign.creatorId === session.user.id) {
         return NextResponse.json(
            { message: "You cannot contribute to your own campaign." },
            { status: 403 },
         );
      }

      const minimumCents = Math.max(100, campaign.minimumContributionCents);
      if (amountCents < minimumCents) {
         return NextResponse.json(
            {
               message: `Minimum contribution is $${(minimumCents / 100).toFixed(2)}.`,
            },
            { status: 400 },
         );
      }

      const stripe = getStripeClient();
      const transaction = await prisma.transaction.create({
         data: {
            amountCents,
            amountPaidCents: 0,
            currency: "USD",
            status: "PENDING",
            userId: session.user.id,
            campaignId,
         },
      });
      transactionId = transaction.id;

      const origin =
         process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
      const checkout = await stripe.checkout.sessions.create({
         mode: "payment",
         line_items: [
            {
               quantity: 1,
               price_data: {
                  currency: "usd",
                  unit_amount: amountCents,
                  product_data: {
                     name: `Contribution to ${campaign.title}`,
                  },
               },
            },
         ],
         client_reference_id: transaction.id,
         metadata: { transactionId: transaction.id, campaignId },
         payment_intent_data: {
            metadata: { transactionId: transaction.id, campaignId },
         },
         success_url: `${origin}/dashboard/payments?checkout=success`,
         cancel_url: `${origin}/dashboard/discover?checkout=cancelled`,
      });

      if (!checkout.url)
         throw new Error("Stripe did not return a Checkout URL.");

      await prisma.transaction.update({
         where: { id: transaction.id },
         data: { providerRef: checkout.id },
      });

      return NextResponse.json({ checkoutUrl: checkout.url }, { status: 201 });
   } catch (error) {
      if (transactionId) {
         await prisma.transaction.updateMany({
            where: { id: transactionId, status: "PENDING" },
            data: { status: "FAILED" },
         });
      }
      console.error("[CREATE CONTRIBUTION CHECKOUT ERROR]", error);
      return NextResponse.json(
         {
            message:
               "Could not start secure checkout. Check payment configuration.",
         },
         { status: 502 },
      );
   }
}
