import "dotenv/config";
import { defineConfig } from "@prisma/prisma7/config";

export default defineConfig({
   schema: "prisma/schema.prisma",
   migrations: {
      path: "prisma/migrations",
      seed: "tsx prisma/seed.ts", // ← add this
   },
   datasource: {
      url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
   },
});
