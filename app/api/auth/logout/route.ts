import { NextRequest, NextResponse } from "next/server"
import { extractToken, removeSession } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const token = extractToken(request.headers.get("authorization"))
  if (token) {
    await removeSession(token)
  }
  return NextResponse.json({ loggedOut: true })
}