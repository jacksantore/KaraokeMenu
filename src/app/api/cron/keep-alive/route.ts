import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/sql";

// Runs daily (see vercel.json) so the Supabase free-tier project never sits
// idle long enough to auto-pause (which happens after ~7 days of inactivity
// and previously caused every DB-backed route to time out).
export const maxDuration = 15;

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const [{ count }] = await sql<{ count: number }[]>`SELECT count(*)::int AS count FROM songs`;
  return NextResponse.json({ ok: true, songCount: count, ranAt: new Date().toISOString() });
}
