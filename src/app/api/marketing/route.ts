import { NextResponse } from "next/server";
import { getPublicMarketing } from "@/lib/marketing";

// Config pública de tracking (sem segredos). Consumida pelo TrackingScripts.
export const dynamic = "force-dynamic";

export async function GET() {
  const m = await getPublicMarketing();
  return NextResponse.json(m, {
    headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
  });
}
