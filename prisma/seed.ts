import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { randomBytes, scryptSync } from "crypto";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
   throw new Error("DATABASE_URL is not set — check your .env file.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

function hash(pw: string) {
   const salt = randomBytes(16).toString("hex");
   const h = scryptSync(pw, salt, 64).toString("hex");
   return `${salt}:${h}`;
}
