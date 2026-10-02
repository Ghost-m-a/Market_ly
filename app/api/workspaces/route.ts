import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getMongoDatabase } from "@/lib/mongodb";

type WorkspaceRecord = {
   userId: string;
   type: "PERSONAL" | "BUSINESS";
   name: string;
   createdAt: Date;
};

type WorkspacePreference = {
   userId: string;
   activeWorkspaceId: string;
   updatedAt: Date;
};

function failure(error: unknown) {
   console.error("[workspaces] error:", error);
   return NextResponse.json(
      {
         message:
            "Workspace storage is unavailable. Check MongoDB configuration.",
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
      const db = await getMongoDatabase();
      const workspaces = db.collection<WorkspaceRecord>("workspaces");
      const preferences = db.collection<WorkspacePreference>(
         "workspacePreferences",
      );
      await Promise.all([
         workspaces.createIndex(
            { userId: 1, type: 1 },
            {
               unique: true,
               partialFilterExpression: { type: "PERSONAL" },
               name: "one_personal_workspace_per_user",
            },
         ),
         preferences.createIndex({ userId: 1 }, { unique: true }),
      ]);

      let personal = await workspaces.findOne({
         userId: session.user.id,
         type: "PERSONAL",
      });
      if (!personal) {
         try {
            await workspaces.insertOne({
               userId: session.user.id,
               type: "PERSONAL",
               name: "Personal",
               createdAt: new Date(),
            });
         } catch (error) {
            if (
               !(error instanceof Error) ||
               !("code" in error) ||
               error.code !== 11000
            ) {
               throw error;
            }
         }
         personal = await workspaces.findOne({
            userId: session.user.id,
            type: "PERSONAL",
         });
      }
      if (!personal)
         throw new Error("Could not initialize personal workspace.");

      const items = await workspaces
         .find({ userId: session.user.id })
         .sort({ type: 1, createdAt: 1 })
         .toArray();
      let preference = await preferences.findOne({ userId: session.user.id });
      let activeWorkspaceId = preference?.activeWorkspaceId;
      if (!items.some((item) => item._id.toString() === activeWorkspaceId)) {
         activeWorkspaceId = personal._id.toString();
         await preferences.updateOne(
            { userId: session.user.id },
            {
               $set: {
                  activeWorkspaceId,
                  updatedAt: new Date(),
               },
            },
            { upsert: true },
         );
      }

      return NextResponse.json({
         workspaces: items.map((item) => ({
            id: item._id.toString(),
            name: item.name,
            type: item.type,
         })),
         activeWorkspaceId,
      });
   } catch (error) {
      return failure(error);
   }
}

export async function POST(req: Request) {
   const session = await auth();
   if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
   }

   let name: unknown;
   try {
      ({ name } = (await req.json()) ?? {});
   } catch {
      return NextResponse.json(
         { message: "Invalid request." },
         { status: 400 },
      );
   }
   if (
      typeof name !== "string" ||
      name.trim().length < 2 ||
      name.trim().length > 60
   ) {
      return NextResponse.json(
         { message: "Workspace name must be between 2 and 60 characters." },
         { status: 400 },
      );
   }

   try {
      const db = await getMongoDatabase();
      const workspaces = db.collection<WorkspaceRecord>("workspaces");
      const preferences = db.collection<WorkspacePreference>(
         "workspacePreferences",
      );
      const result = await workspaces.insertOne({
         userId: session.user.id,
         type: "BUSINESS",
         name: name.trim(),
         createdAt: new Date(),
      });
      const activeWorkspaceId = result.insertedId.toString();
      await preferences.updateOne(
         { userId: session.user.id },
         { $set: { activeWorkspaceId, updatedAt: new Date() } },
         { upsert: true },
      );

      return NextResponse.json(
         {
            workspace: {
               id: activeWorkspaceId,
               name: name.trim(),
               type: "BUSINESS",
            },
            activeWorkspaceId,
         },
         { status: 201 },
      );
   } catch (error) {
      return failure(error);
   }
}

export async function PATCH(req: Request) {
   const session = await auth();
   if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
   }

   let workspaceId: unknown;
   try {
      ({ workspaceId } = (await req.json()) ?? {});
   } catch {
      return NextResponse.json(
         { message: "Invalid request." },
         { status: 400 },
      );
   }
   if (typeof workspaceId !== "string" || !ObjectId.isValid(workspaceId)) {
      return NextResponse.json(
         { message: "Workspace not found." },
         { status: 404 },
      );
   }

   try {
      const db = await getMongoDatabase();
      const workspaces = db.collection<WorkspaceRecord>("workspaces");
      const workspace = await workspaces.findOne({
         _id: new ObjectId(workspaceId),
         userId: session.user.id,
      });
      if (!workspace) {
         return NextResponse.json(
            { message: "Workspace not found." },
            { status: 404 },
         );
      }

      await db
         .collection<WorkspacePreference>("workspacePreferences")
         .updateOne(
            { userId: session.user.id },
            { $set: { activeWorkspaceId: workspaceId, updatedAt: new Date() } },
            { upsert: true },
         );
      return NextResponse.json({ activeWorkspaceId: workspaceId });
   } catch (error) {
      return failure(error);
   }
}
