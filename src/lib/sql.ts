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
// max is intentionally low: each serverless instance gets its own pool, and
// Supabase's pooler (pgbouncer) has a limited number of slots — a handful of
// concurrent Vercel instances each opening 5 connections can exhaust it and
// cause new connections to hang, which is a common cause of function timeouts.
export const sql =
  globalThis.__karaokeSql ??
  postgres(connectionString, {
    ssl: "require",
    max: 1,
    connect_timeout: 10,
    idle_timeout: 20,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__karaokeSql = sql;
}
