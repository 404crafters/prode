import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { RANKING_CACHE_TAG } from "@/db/queries/ranking";
import { syncFootballData } from "@/integrations/football-data/sync";

export async function GET(request: NextRequest) {
  const expectedSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const receivedSecret =
    authHeader?.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : (request.headers.get("x-cron-secret") ?? request.nextUrl.searchParams.get("secret"));

  if (!expectedSecret || receivedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await syncFootballData("full");
  revalidateTag(RANKING_CACHE_TAG, "max");

  return NextResponse.json({ ok: true, result });
}
