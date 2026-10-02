import { MongoClient } from "mongodb";
import { getMongoDatabaseUrl } from "./mongodb-url";

const globalMongo = globalThis as typeof globalThis & {
   mongoClientPromise?: Promise<MongoClient>;
};

export async function getMongoDatabase() {
   globalMongo.mongoClientPromise ??= new MongoClient(
      getMongoDatabaseUrl(),
   ).connect();
   const client = await globalMongo.mongoClientPromise;
   return client.db();
}
