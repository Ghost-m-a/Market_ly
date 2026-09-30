import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { findOrCreateDirect } from "@/lib/messages-server";

export async function POST(req: Request) {
   const session = await auth();
   if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
   }

   const { email } = (await req.json()) ?? {};
   if (!email) {
      return NextResponse.json(
         { message: "Email is required." },
         { status: 400 },
      );
   }

   const other = await prisma.user.findUnique({
      where: { email: String(email).trim().toLowerCase() },
      select: { id: true },
   });
   if (!other) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
   }
   if (other.id === session.user.id) {
      return NextResponse.json(
         { message: "You can't DM yourself." },
         { status: 400 },
      );
   }

   const conv = await findOrCreateDirect(session.user.id, other.id);
   return NextResponse.json({ conversationId: conv.id });
}
