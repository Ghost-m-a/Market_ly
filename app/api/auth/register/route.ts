import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function POST(req: Request) {
   try {
      const { name, email, password } = (await req.json()) ?? {};

      if (!name || !email || !password) {
         return NextResponse.json(
            { message: "Name, email, and password are required." },
            { status: 400 },
         );
      }

      if (typeof password !== "string" || password.length < 8) {
         return NextResponse.json(
            { message: "Password must be at least 8 characters." },
            { status: 400 },
         );
      }

      const normalized = String(email).trim().toLowerCase();

      const existing = await prisma.user.findUnique({
         where: { email: normalized },
      });
      if (existing) {
         return NextResponse.json(
            { message: "An account with that email already exists." },
            { status: 409 },
         );
      }

      const user = await prisma.user.create({
         data: {
            name: String(name).trim(),
            email: normalized,
            passwordHash: hashPassword(password),
         },
      });

      return NextResponse.json({
         user: { id: user.id, name: user.name, email: user.email },
      });
   } catch (err) {
      console.error("[register] error:", err);
      return NextResponse.json(
         { message: "Could not create account." },
         { status: 500 },
      );
   }
}
