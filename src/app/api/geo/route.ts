import { NextResponse } from "next/server";

export const runtime = "edge";

export function GET(req: Request) {
  const country =
    req.headers.get("x-vercel-ip-country") ||
    req.headers.get("cf-ipcountry") ||
    "BR";
  return NextResponse.json({ country: country.toLowerCase() });
}
