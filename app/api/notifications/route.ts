import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
   const session = await auth();
   if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
   }

   const { searchParams } = new URL(request.url);
   const userId = searchParams.get("userId");

   if (!userId) {
      return NextResponse.json(
         { error: "userId is required" },
         { status: 400 },
      );
   }
   if (userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
   }

   try {
      const notifications = await prisma.notification.findMany({
         where: { userId: session.user.id },
         orderBy: { createdAt: "desc" },
      });

      return NextResponse.json(notifications);
   } catch (error) {
      console.error("[GET NOTIFICATIONS ERROR]", error);
      return NextResponse.json(
         { error: "Failed to fetch notifications" },
         { status: 500 },
      );
   }
}

export async function POST(request: Request) {
   const session = await auth();
   if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
   }

   try {
      const {
         userId,
         title,
         message,
         type = "info",
         link,
      } = await request.json();

      if (!userId || !title || !message) {
         return NextResponse.json(
            { error: "Missing required fields" },
            { status: 400 },
         );
      }
      if (userId !== session.user.id) {
         return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const notification = await prisma.notification.create({
         data: { userId: session.user.id, title, message, type, link },
      });

      return NextResponse.json(notification, { status: 201 });
   } catch (error) {
      console.error("[CREATE NOTIFICATION ERROR]", error);
      return NextResponse.json(
         { error: "Failed to create notification" },
         { status: 500 },
      );
   }
}

export async function PATCH(request: Request) {
   const session = await auth();
   if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
   }

   try {
      const { notificationId, read = true } = await request.json();
      if (typeof notificationId !== "string" || typeof read !== "boolean") {
         return NextResponse.json(
            { error: "notificationId and a boolean read value are required" },
            { status: 400 },
         );
      }

      const result = await prisma.notification.updateMany({
         where: { id: notificationId, userId: session.user.id },
         data: { read },
      });

      if (result.count === 0) {
         return NextResponse.json(
            { error: "Notification not found" },
            { status: 404 },
         );
      }

      return NextResponse.json({ ok: true });
   } catch (error) {
      console.error("[UPDATE NOTIFICATION ERROR]", error);
      return NextResponse.json(
         { error: "Failed to update notification" },
         { status: 500 },
      );
   }
}
