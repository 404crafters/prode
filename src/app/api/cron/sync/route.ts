import { NextResponse, type NextRequest } from "next/server";
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

  return NextResponse.json({ ok: true, result });
}
