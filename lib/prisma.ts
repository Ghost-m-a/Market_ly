import { PrismaClient } from "@prisma/client";

// إعلام TypeScript بوجود المتغير في النطاق العالمي لمنع تكرار الـ Client أثناء الـ Hot Reload
const globalForPrisma = globalThis as unknown as {
   prisma: PrismaClient | undefined;
};

export const prisma =
   globalForPrisma.prisma ??
   new PrismaClient({
      log:
         process.env.NODE_ENV === "development"
            ? ["query", "error", "warn"]
            : ["error"],
   });

if (process.env.NODE_ENV !== "production") {
   globalForPrisma.prisma = prisma;
}
