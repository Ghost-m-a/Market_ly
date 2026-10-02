import Stripe from "stripe";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripeClient } from "@/lib/stripe";

async function markCheckoutFailed(session: Stripe.Checkout.Session) {
   const transactionId = session.metadata?.transactionId;
   if (!transactionId) return;

   await prisma.transaction.updateMany({
      where: {
         id: transactionId,
         status: "PENDING",
         OR: [{ providerRef: null }, { providerRef: session.id }],
      },
      data: { status: "FAILED", providerRef: session.id },
   });
}

async function completeCheckout(session: Stripe.Checkout.Session) {
   const transactionId = session.metadata?.transactionId;
   if (
      !transactionId ||
      !session.amount_total ||
      !session.currency ||
      session.payment_status !== "paid"
   ) {
      return;
   }

   const amountPaidCents = session.amount_total;
   const amountPaid = amountPaidCents / 100;
   const currency = session.currency.toLowerCase();
   const paymentId =
      typeof session.payment_intent === "string"
         ? session.payment_intent
         : (session.payment_intent?.id ?? null);

   await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findUnique({
         where: { id: transactionId },
         include: {
            user: { select: { name: true } },
            campaign: { select: { id: true, title: true, creatorId: true } },
         },
      });

      if (
         !transaction ||
         transaction.status !== "PENDING" ||
         (transaction.providerRef !== null &&
            transaction.providerRef !== session.id) ||
         transaction.amountCents !== session.amount_total ||
         transaction.currency.toLowerCase() !== currency
      ) {
         return;
      }

      const updated = await tx.transaction.updateMany({
         where: {
            id: transactionId,
            status: "PENDING",
            OR: [{ providerRef: null }, { providerRef: session.id }],
         },
         data: {
            status: "COMPLETED",
            amountPaidCents,
            paymentId,
            providerRef: session.id,
         },
      });
      if (updated.count !== 1) return;

      const campaign = transaction.campaign;
      if (!campaign) return;

      await tx.campaignContributor.upsert({
         where: {
            campaignId_userId: {
               campaignId: campaign.id,
               userId: transaction.userId,
            },
         },
         create: {
            campaignId: campaign.id,
            userId: transaction.userId,
            contributionCents: amountPaidCents,
         },
         update: { contributionCents: { increment: amountPaidCents } },
      });

      await tx.notification.createMany({
         data: [
            {
               userId: transaction.userId,
               title: "Contribution confirmed",
               message: `Your $${amountPaid.toFixed(2)} contribution to ${campaign.title} is complete.`,
               type: "success",
               link: "/dashboard/payments",
            },
            {
               userId: campaign.creatorId,
               title: "New campaign contribution",
               message: `${transaction.user.name} contributed $${amountPaid.toFixed(2)} to ${campaign.title}.`,
               type: "success",
               link: "/dashboard",
            },
         ],
      });
   });
}

export async function POST(request: Request) {
   const signature = request.headers.get("stripe-signature");
   const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
   if (!signature || !webhookSecret) {
      return NextResponse.json(
         { message: "Webhook is not configured." },
         { status: 400 },
      );
   }

   let event: Stripe.Event;
   try {
      event = getStripeClient().webhooks.constructEvent(
         await request.text(),
         signature,
         webhookSecret,
      );
   } catch (error) {
      console.error("[STRIPE WEBHOOK SIGNATURE ERROR]", error);
      return NextResponse.json(
         { message: "Invalid webhook signature." },
         { status: 400 },
      );
   }

   try {
      if (
         event.type === "checkout.session.completed" ||
         event.type === "checkout.session.async_payment_succeeded"
      ) {
         await completeCheckout(event.data.object as Stripe.Checkout.Session);
      } else if (
         event.type === "checkout.session.expired" ||
         event.type === "checkout.session.async_payment_failed"
      ) {
         await markCheckoutFailed(event.data.object as Stripe.Checkout.Session);
      }

      return NextResponse.json({ received: true });
   } catch (error) {
      console.error("[STRIPE WEBHOOK PROCESSING ERROR]", error);
      return NextResponse.json(
         { message: "Webhook processing failed." },
         { status: 500 },
      );
   }
}
