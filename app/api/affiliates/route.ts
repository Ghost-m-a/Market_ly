import { randomBytes } from "node:crypto";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getMongoDatabase } from "@/lib/mongodb";

type AffiliateLinkRecord = {
   userId: string;
   code: string;
   destination: string;
   label: string;
   clicks: number;
   createdAt: Date;
};

function storageError(error: unknown) {
   console.error("[affiliates] error:", error);
   return NextResponse.json(
      {
         message:
            "Affiliate storage is unavailable. Check MongoDB configuration.",
      },
      { status: 503 },
   );
}

export async function GET() {
   const session = await auth();
   if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
   }

   try {
      const links = await (await getMongoDatabase())
         .collection<AffiliateLinkRecord>("affiliateLinks")
         .find({ userId: session.user.id })
         .sort({ createdAt: -1 })
         .limit(200)
         .toArray();
      return NextResponse.json({
         links: links.map((link) => ({
            id: link._id.toString(),
            code: link.code,
            destination: link.destination,
            label: link.label,
            clicks: link.clicks,
            createdAt: link.createdAt.toISOString(),
         })),
      });
   } catch (error) {
      return storageError(error);
   }
}

export async function POST(req: Request) {
   const session = await auth();
   if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
   }

   let destination: unknown;
   let label: unknown;
   try {
      ({ destination, label } = (await req.json()) ?? {});
   } catch {
      return NextResponse.json(
         { message: "Invalid link request." },
         { status: 400 },
      );
   }
   if (
      typeof destination !== "string" ||
      typeof label !== "string" ||
      !label.trim()
   ) {
      return NextResponse.json(
         { message: "A link name and destination URL are required." },
         { status: 400 },
      );
   }

   let url: URL;
   try {
      url = new URL(destination.trim());
   } catch {
      return NextResponse.json(
         { message: "Enter a complete destination URL." },
         { status: 400 },
      );
   }
   if (url.protocol !== "https:" && url.protocol !== "http:") {
      return NextResponse.json(
         { message: "Only HTTP and HTTPS links are allowed." },
         { status: 400 },
      );
   }
   if (label.trim().length > 80) {
      return NextResponse.json(
         { message: "Link name must be 80 characters or fewer." },
         { status: 400 },
      );
   }

   try {
      const collection = (
         await getMongoDatabase()
      ).collection<AffiliateLinkRecord>("affiliateLinks");
      await collection.createIndex({ code: 1 }, { unique: true });
      const record: AffiliateLinkRecord = {
         userId: session.user.id,
         code: randomBytes(8).toString("base64url"),
         destination: url.toString(),
         label: label.trim(),
         clicks: 0,
         createdAt: new Date(),
      };
      const result = await collection.insertOne(record);
      return NextResponse.json(
         {
            link: {
               id: result.insertedId.toString(),
               code: record.code,
               destination: record.destination,
               label: record.label,
               clicks: record.clicks,
               createdAt: record.createdAt.toISOString(),
            },
         },
         { status: 201 },
      );
   } catch (error) {
      return storageError(error);
   }
}

export async function DELETE(req: Request) {
   const session = await auth();
   if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
   }

   let id: unknown;
   try {
      ({ id } = (await req.json()) ?? {});
   } catch {
      return NextResponse.json(
         { message: "Invalid request." },
         { status: 400 },
      );
   }
   if (typeof id !== "string" || !ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Link not found." }, { status: 404 });
   }

   try {
      const result = await (await getMongoDatabase())
         .collection<AffiliateLinkRecord>("affiliateLinks")
         .deleteOne({ _id: new ObjectId(id), userId: session.user.id });
      if (result.deletedCount === 0) {
         return NextResponse.json(
            { message: "Link not found." },
            { status: 404 },
         );
      }
      return NextResponse.json({ ok: true });
   } catch (error) {
      return storageError(error);
   }
}
