import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getMongoDatabase } from "@/lib/mongodb";

type PostRecord = {
   userId: string;
   authorName: string;
   body: string;
   createdAt: Date;
};

export async function GET() {
   const session = await auth();
   if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
   }

   try {
      const db = await getMongoDatabase();
      const posts = await db
         .collection<PostRecord>("townhallPosts")
         .find({})
         .sort({ createdAt: -1 })
         .limit(100)
         .toArray();
      return NextResponse.json({
         posts: posts.map((post) => ({
            id: post._id.toString(),
            authorId: post.userId,
            authorName: post.authorName,
            body: post.body,
            createdAt: post.createdAt.toISOString(),
         })),
      });
   } catch (error) {
      console.error("[townhall.GET] error:", error);
      return NextResponse.json(
         {
            message:
               "Townhall storage is unavailable. Check MongoDB configuration.",
         },
         { status: 503 },
      );
   }
}

export async function POST(req: Request) {
   const session = await auth();
   if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
   }

   let body: unknown;
   try {
      ({ body } = (await req.json()) ?? {});
   } catch {
      return NextResponse.json({ message: "Invalid post." }, { status: 400 });
   }
   if (typeof body !== "string" || !body.trim() || body.trim().length > 2000) {
      return NextResponse.json(
         { message: "Posts must contain 1 to 2,000 characters." },
         { status: 400 },
      );
   }

   try {
      const db = await getMongoDatabase();
      const record: PostRecord = {
         userId: session.user.id,
         authorName: session.user.name ?? "Member",
         body: body.trim(),
         createdAt: new Date(),
      };
      const result = await db
         .collection<PostRecord>("townhallPosts")
         .insertOne(record);
      return NextResponse.json(
         {
            post: {
               id: result.insertedId.toString(),
               authorId: record.userId,
               authorName: record.authorName,
               body: record.body,
               createdAt: record.createdAt.toISOString(),
            },
         },
         { status: 201 },
      );
   } catch (error) {
      console.error("[townhall.POST] error:", error);
      return NextResponse.json(
         {
            message:
               "Townhall storage is unavailable. Check MongoDB configuration.",
         },
         { status: 503 },
      );
   }
}
