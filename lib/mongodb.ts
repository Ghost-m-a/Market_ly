import { MongoClient } from "mongodb";

const globalMongo = globalThis as typeof globalThis & {
   mongoClientPromise?: Promise<MongoClient>;
};

export async function getMongoDatabase() {
   const uri = process.env.MONGODB_URI;
   if (!uri) throw new Error("MONGODB_URI is not configured.");

   globalMongo.mongoClientPromise ??= new MongoClient(uri).connect();
   const client = await globalMongo.mongoClientPromise;
   return client.db(process.env.MONGODB_DATABASE || undefined);
}
