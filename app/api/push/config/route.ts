import { NextResponse } from "next/server"
import { hasRedisConfiguration } from "@/lib/live-monitor-storage"
import { getPublicVapidKey, hasPushConfiguration } from "@/lib/web-push"

export const dynamic = "force-dynamic"

export async function GET() {
  return NextResponse.json(
    {
      pushConfigured: hasPushConfiguration(),
      redisConfigured: hasRedisConfiguration(),
      aiConfigured: Boolean(process.env.OPENROUTER_API_KEY),
      vapidPublicKey: getPublicVapidKey(),
    },
    { headers: { "Cache-Control": "no-store" } }
  )
}
