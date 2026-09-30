import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { markRead } from "@/lib/messages-server";

export async function POST(
   _req: Request,
   { params }: { params: Promise<{ id: string }> },
) {
   const { id } = await params;
   const session = await auth();
   if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
   }

   await markRead(id, session.user.id);
   return NextResponse.json({ ok: true });
}
