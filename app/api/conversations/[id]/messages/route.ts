import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getMessages, sendMessage } from "@/lib/messages-server";

export async function GET(
   _req: Request,
   { params }: { params: Promise<{ id: string }> },
) {
   const { id } = await params;
   const session = await auth();
   if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
   }

   const data = await getMessages(id, session.user.id);
   if (!data.isMember) {
      return NextResponse.json({ message: "Not a member" }, { status: 403 });
   }

   return NextResponse.json(data);
}

export async function POST(
   req: Request,
   { params }: { params: Promise<{ id: string }> },
) {
   const { id } = await params;
   const session = await auth();
   if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
   }

   const { body } = (await req.json()) ?? {};

   try {
      const msg = await sendMessage(id, session.user.id, String(body ?? ""));
      return NextResponse.json({ message: msg }, { status: 201 });
   } catch (err) {
      const code = err instanceof Error ? err.message : "UNKNOWN";
      const status =
         code === "EMPTY_MESSAGE" || code === "MESSAGE_TOO_LONG" ? 400 : 500;
      return NextResponse.json(
         { message: "Could not send message." },
         { status },
      );
   }
}
