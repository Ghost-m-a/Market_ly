import "dotenv/config";
import { config } from "dotenv";
import { createHash } from "node:crypto";
import { MongoClient, type Document } from "mongodb";
import { Client as PostgresClient } from "pg";
import { getMongoDatabaseUrl } from "../lib/mongodb-url";

config({ path: ".env.local" });

type SourceRow = Record<string, unknown>;
type MigratedDocument = Document & { _id: string };
type TableSpec = {
   table: string;
   defaults?: (row: SourceRow) => SourceRow;
   moneyFields?: { source: string; target: string }[];
};

const tables: TableSpec[] = [
   { table: "User", defaults: () => ({ role: "USER", creditsBalance: 0 }) },
   { table: "Account" },
   { table: "Session" },
   {
      table: "VerificationToken",
      defaults: (row) => ({
         id: createHash("sha256")
            .update(`${String(row.identifier)}\0${String(row.token)}`)
            .digest("hex"),
      }),
   },
   {
      table: "Campaign",
      defaults: () => ({
         imageUrl: null,
         category: "content",
         targetAudience: "",
         minimumContributionCents: 0,
         targetViews: 0,
         campaignCostCredits: 0,
      }),
      moneyFields: [
         { source: "minimumContribution", target: "minimumContributionCents" },
      ],
   },
   { table: "CampaignMember" },
   { table: "Submission" },
   { table: "Conversation" },
   { table: "ConversationMember" },
   {
      table: "Message",
      defaults: (row) => ({
         recipientId: null,
         content: row.body ?? "",
         messageType: "private",
         read: false,
         updatedAt: row.createdAt ?? new Date(),
      }),
   },
   { table: "Notification" },
   {
      table: "Transaction",
      defaults: () => ({ amountPaidCents: 0 }),
      moneyFields: [
         { source: "amount", target: "amountCents" },
         { source: "amountPaid", target: "amountPaidCents" },
      ],
   },
   {
      table: "CampaignContributor",
      moneyFields: [{ source: "contribution", target: "contributionCents" }],
   },
   { table: "CreditPricing" },
   { table: "CreditLedger" },
   { table: "PasswordResetToken" },
   { table: "EmailVerificationToken" },
];

function toDocument(spec: TableSpec, source: SourceRow) {
   const row = { ...(spec.defaults?.(source) ?? {}), ...source };
   if (spec.table === "VerificationToken" && !source.id) {
      row.id = spec.defaults?.(source).id;
   }

   for (const field of spec.moneyFields ?? []) {
      const value = row[field.source];
      if (value !== null && value !== undefined) {
         row[field.target] = Math.round(Number(value) * 100);
         delete row[field.source];
      }
   }

   const id = row.id;
   if (typeof id !== "string" || !id) {
      throw new Error(`Source row in ${spec.table} has no usable id.`);
   }
   delete row.id;
   return { _id: id, ...row };
}

async function main() {
   const apply = process.argv.includes("--apply");
   const sourceUrl = process.env.DATABASE_URL;
   const targetUrl = getMongoDatabaseUrl();
   if (!sourceUrl || !targetUrl) {
      throw new Error("DATABASE_URL and MONGODB_URI must both be configured.");
   }

   const postgres = new PostgresClient({ connectionString: sourceUrl });
   const mongo = new MongoClient(targetUrl, {
      serverSelectionTimeoutMS: 10_000,
   });

   try {
      await postgres.connect();
      await mongo.connect();
      await postgres.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");

      const existingTables = await postgres.query(
         "SELECT table_name FROM information_schema.tables WHERE table_schema = $1 AND table_type = $2",
         ["public", "BASE TABLE"],
      );
      const available = new Set(
         existingTables.rows.map((row) => String(row.table_name)),
      );
      const db = mongo.db();
      const summary: {
         collection: string;
         sourceRows: number;
         copied: boolean;
      }[] = [];

      for (const spec of tables) {
         if (!available.has(spec.table)) continue;
         const rows = await postgres.query(`SELECT * FROM "${spec.table}"`);
         const collection = db.collection<MigratedDocument>(spec.table);
         summary.push({
            collection: spec.table,
            sourceRows: rows.rowCount ?? 0,
            copied: apply,
         });

         if (!apply || rows.rows.length === 0) continue;
         const operations = rows.rows.map((row: SourceRow) => {
            const document = toDocument(spec, row);
            return {
               replaceOne: {
                  filter: { _id: document._id },
                  replacement: document,
                  upsert: true,
               },
            };
         });
         for (let offset = 0; offset < operations.length; offset += 500) {
            await collection.bulkWrite(operations.slice(offset, offset + 500), {
               ordered: true,
            });
         }
      }

      await postgres.query("ROLLBACK");
      console.log(
         JSON.stringify(
            {
               mode: apply ? "applied" : "dry-run",
               targetDatabase: db.databaseName,
               tables: summary,
            },
            null,
            2,
         ),
      );
      if (!apply) {
         console.log(
            "No MongoDB records were written. Re-run with --apply to copy.",
         );
      }
   } finally {
      await postgres.end().catch(() => {});
      await mongo.close().catch(() => {});
   }
}

main().catch((error: unknown) => {
   console.error(
      "PostgreSQL to MongoDB copy failed:",
      error instanceof Error ? error.message : "Unknown error",
   );
   process.exitCode = 1;
});
