import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getMongoDatabase } from "@/lib/mongodb";

type PartnerRecord = {
   pairKey: string;
   requesterId: string;
   recipientId: string;
   status: "PENDING" | "ACCEPTED" | "DECLINED";
   createdAt: Date;
   updatedAt: Date;
};

function pairKey(firstId: string, secondId: string) {
   return [firstId, secondId].sort().join(":");
}

function storageError(error: unknown) {
   console.error("[partners] error:", error);
   return NextResponse.json(
      {
         message:
            "Partner storage is unavailable. Check MongoDB configuration.",
      },
      { status: 503 },
   );
}

export async function GET() {
   const session = await auth();
   const userId = session?.user?.id;
   if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
   }

   try {
      const collection = (await getMongoDatabase()).collection<PartnerRecord>(
         "partnerConnections",
      );
      const records = await collection
         .find({ $or: [{ requesterId: userId }, { recipientId: userId }] })
         .sort({ updatedAt: -1 })
         .limit(200)
         .toArray();
      const otherIds = records.map((record) =>
         record.requesterId === userId
            ? record.recipientId
            : record.requesterId,
      );
      const users = await prisma.user.findMany({
         where: { id: { in: otherIds } },
         select: { id: true, name: true, email: true, image: true },
      });
      const usersById = new Map(users.map((user) => [user.id, user]));

      return NextResponse.json({
         partners: records.map((record) => ({
            id: record._id.toString(),
            status: record.status,
            direction: record.requesterId === userId ? "SENT" : "RECEIVED",
            createdAt: record.createdAt.toISOString(),
            partner:
               usersById.get(
                  record.requesterId === userId
                     ? record.recipientId
                     : record.requesterId,
               ) ?? null,
         })),
      });
   } catch (error) {
      return storageError(error);
   }
}

export async function POST(req: Request) {
   const session = await auth();
   const userId = session?.user?.id;
   if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
   }

   let email: unknown;
   try {
      ({ email } = (await req.json()) ?? {});
   } catch {
      return NextResponse.json(
         { message: "Enter a valid email." },
         { status: 400 },
      );
   }
   if (
      typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
   ) {
      return NextResponse.json(
         { message: "Enter a valid email." },
         { status: 400 },
      );
   }

   const partner = await prisma.user.findFirst({
      where: { email: { equals: email.trim(), mode: "insensitive" } },
      select: { id: true, name: true, email: true, image: true },
   });
   if (!partner) {
      return NextResponse.json(
         { message: "No account exists for that email." },
         { status: 404 },
      );
   }
   if (partner.id === userId) {
      return NextResponse.json(
         { message: "You cannot invite yourself." },
         { status: 400 },
      );
   }

   try {
      const collection = (await getMongoDatabase()).collection<PartnerRecord>(
         "partnerConnections",
      );
      await collection.createIndex({ pairKey: 1 }, { unique: true });
      const key = pairKey(userId, partner.id);
      const existing = await collection.findOne({ pairKey: key });
      if (existing) {
         return NextResponse.json(
            { message: "A partner connection already exists." },
            { status: 409 },
         );
      }

      const now = new Date();
      const record: PartnerRecord = {
         pairKey: key,
         requesterId: userId,
         recipientId: partner.id,
         status: "PENDING",
         createdAt: now,
         updatedAt: now,
      };
      const result = await collection.insertOne(record);
      return NextResponse.json(
         {
            partner: {
               id: result.insertedId.toString(),
               status: record.status,
               direction: "SENT",
               createdAt: now.toISOString(),
               partner,
            },
         },
         { status: 201 },
      );
   } catch (error) {
      return storageError(error);
   }
}

export async function PATCH(req: Request) {
   const session = await auth();
   const userId = session?.user?.id;
   if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
   }

   let connectionId: unknown;
   let status: unknown;
   try {
      ({ connectionId, status } = (await req.json()) ?? {});
   } catch {
      return NextResponse.json(
         { message: "Invalid request." },
         { status: 400 },
      );
   }
   if (
      typeof connectionId !== "string" ||
      !ObjectId.isValid(connectionId) ||
      (status !== "ACCEPTED" && status !== "DECLINED")
   ) {
      return NextResponse.json(
         { message: "Invalid partner action." },
         { status: 400 },
      );
   }

   try {
      const collection = (await getMongoDatabase()).collection<PartnerRecord>(
         "partnerConnections",
      );
      const result = await collection.updateOne(
         {
            _id: new ObjectId(connectionId),
            recipientId: userId,
            status: "PENDING",
         },
         { $set: { status, updatedAt: new Date() } },
      );
      if (result.matchedCount === 0) {
         return NextResponse.json(
            { message: "Partner request not found." },
            { status: 404 },
         );
      }
      return NextResponse.json({ ok: true, status });
   } catch (error) {
      return storageError(error);
   }
}
