import postgres from "postgres";

const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error(
    "POSTGRES_URL não está definida. Configure a variável de ambiente (veja .env.local / README)."
  );
}

declare global {
  var __karaokeSql: ReturnType<typeof postgres> | undefined;
}

// Reuse the connection across hot-reloads in dev and across invocations in serverless.
export const sql =
  globalThis.__karaokeSql ??
  postgres(connectionString, {
    ssl: "require",
    max: 5,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__karaokeSql = sql;
}
