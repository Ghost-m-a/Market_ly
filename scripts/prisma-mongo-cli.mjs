import { spawnSync } from "node:child_process";
import { config } from "dotenv";
import { URL } from "node:url";

config({ path: [".env.local", ".env"] });

const command = process.argv[2];
const rawUri = process.env.MONGODB_URI;
if (!rawUri && command === "generate") {
   process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/marketly";
}
if (!process.env.MONGODB_URI) {
   throw new Error("MONGODB_URI is required for Prisma database commands.");
}

const validName = /^[A-Za-z0-9_-]{1,63}$/;
const url = new URL(process.env.MONGODB_URI);
const configuredName = process.env.MONGODB_DATABASE?.trim();
const uriName = decodeURIComponent(url.pathname.replace(/^\/+/, ""));
const databaseName =
   (configuredName && validName.test(configuredName)
      ? configuredName
      : undefined) ?? (validName.test(uriName) ? uriName : "marketly");
url.pathname = `/${databaseName}`;
process.env.MONGODB_URI = url.toString();

const cliPath = `${process.cwd()}/node_modules/prisma/build/index.js`;
const result = spawnSync(
   process.execPath,
   [cliPath, ...process.argv.slice(2)],
   {
      stdio: "inherit",
      env: process.env,
   },
);
process.exitCode = result.status ?? 1;
