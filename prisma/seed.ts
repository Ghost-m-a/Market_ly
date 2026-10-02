import "dotenv/config";
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "crypto";

config({ path: [".env.local", ".env"] });
const prisma = new PrismaClient();

function hash(pw: string) {
   const salt = randomBytes(16).toString("hex");
   const h = scryptSync(pw, salt, 64).toString("hex");
   return `${salt}:${h}`;
}
