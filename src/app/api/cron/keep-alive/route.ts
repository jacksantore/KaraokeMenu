import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/sql";

// Runs daily (see vercel.json) so the Supabase free-tier project never sits
// idle long enough to auto-pause (which happens after ~7 days of inactivity
// and previously caused every DB-backed route to time out).
//
// It touches the project two ways: a direct Postgres query (what the app
// itself uses) and a call to the Supabase REST API (PostgREST), in case the
// platform counts API traffic — not just DB connections — as activity. The
// REST call is best-effort and expected to return an empty list now that RLS
// is enabled on the tables.
export const maxDuration = 15;

async function pingRestApi(): Promise<number | null> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    const res = await fetch(`${url}/rest/v1/songs?select=id&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    return res.status;
  } catch {
    return 0;
  }
}

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const [{ count }] = await sql<{ count: number }[]>`SELECT count(*)::int AS count FROM songs`;
  const restStatus = await pingRestApi();
  return NextResponse.json({ ok: true, songCount: count, restStatus, ranAt: new Date().toISOString() });
}
