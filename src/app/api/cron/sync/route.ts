import { NextResponse, type NextRequest } from "next/server";
import { syncApiFootball } from "@/integrations/api-football/sync";

export async function GET(request: NextRequest) {
  const expectedSecret = process.env.CRON_SECRET;
  const receivedSecret = request.headers.get("x-cron-secret") ?? request.nextUrl.searchParams.get("secret");

  if (!expectedSecret || receivedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await syncApiFootball("full");

  return NextResponse.json({ ok: true, result });
}
