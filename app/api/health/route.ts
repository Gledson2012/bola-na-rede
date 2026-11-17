import { NextResponse } from "next/server"
import { getUpstreamSourcesStatus } from "@/lib/upstream"

export const dynamic = "force-dynamic"

export async function GET() {
  const sources = getUpstreamSourcesStatus()
  const allDown = sources.length > 0 && sources.every((s) => !s.available)

  return NextResponse.json(
    {
      status: allDown ? "degraded" : "ok",
      sources,
      checkedAt: new Date().toISOString(),
    },
    {
      status: allDown ? 503 : 200,
      headers: { "Cache-Control": "no-store" },
    }
  )
}