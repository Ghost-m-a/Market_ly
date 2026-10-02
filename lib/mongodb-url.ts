const DATABASE_NAME_RE = /^[A-Za-z0-9_-]{1,63}$/;

export function getMongoDatabaseUrl(): string {
   const connectionString = process.env.MONGODB_URI;
   if (!connectionString) throw new Error("MONGODB_URI is not configured.");

   const url = new URL(connectionString);
   const configuredName = process.env.MONGODB_DATABASE?.trim();
   const uriName = decodeURIComponent(url.pathname.replace(/^\/+/, ""));
   const databaseName =
      (configuredName && DATABASE_NAME_RE.test(configuredName)
         ? configuredName
         : undefined) ??
      (DATABASE_NAME_RE.test(uriName) ? uriName : "marketly");

   url.pathname = `/${databaseName}`;
   return url.toString();
}
