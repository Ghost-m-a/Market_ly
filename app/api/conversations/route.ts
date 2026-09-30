import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { listConversations } from "@/lib/messages-server";

export async function GET() {
   const session = await auth();
   if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
   }

   const conversations = await listConversations(session.user.id);
   return NextResponse.json({ conversations });
}
