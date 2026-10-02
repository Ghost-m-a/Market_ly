import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

async function main() {
   const name = process.env.ADMIN_NAME?.trim();
   const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
   const password = process.env.ADMIN_PASSWORD;

   if (
      !name ||
      name.length < 2 ||
      !email ||
      !password ||
      password.length < 12
   ) {
      throw new Error(
         "Set ADMIN_NAME, ADMIN_EMAIL, and an ADMIN_PASSWORD of at least 12 characters.",
      );
   }

   const existing = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true },
   });
   if (existing) {
      await prisma.user.update({
         where: { id: existing.id },
         data: {
            name,
            email,
            emailVerified: new Date(),
            passwordHash: hashPassword(password),
            role: "ADMIN",
         },
      });
      console.log(`Administrator account updated for ${email}.`);
      return;
   }

   await prisma.user.create({
      data: {
         name,
         email,
         emailVerified: new Date(),
         passwordHash: hashPassword(password),
         role: "ADMIN",
      },
   });
   console.log(`Administrator account created for ${email}.`);
}

main()
   .catch((error: unknown) => {
      console.error("Could not create administrator account:", error);
      process.exitCode = 1;
   })
   .finally(async () => {
      await prisma.$disconnect();
   });
