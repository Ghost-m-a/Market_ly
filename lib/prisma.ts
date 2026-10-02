import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import { getMongoDatabaseUrl } from "./mongodb-url";

config({ path: [".env.local", ".env"] });

const globalForPrisma = globalThis as unknown as {
   prisma?: PrismaClient;
};

function createPrismaClient(): PrismaClient {
   return new PrismaClient({
      datasources: { db: { url: getMongoDatabaseUrl() } },
      log:
         process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
   });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
   globalForPrisma.prisma = prisma;
}
