import { NextRequest, NextResponse } from "next/server"
import {
  hasPushConfiguration,
  removeSubscription,
  saveSubscription,
} from "@/lib/web-push"

export const dynamic = "force-dynamic"

interface SubscriptionInput {
  endpoint?: unknown
  expirationTime?: unknown
  keys?: { p256dh?: unknown; auth?: unknown }
}

function sameOriginRequest(request: NextRequest): boolean {
  const origin = request.headers.get("origin")
  if (!origin) return true

  try {
    return new URL(origin).host === request.nextUrl.host
  } catch {
    return false
  }
}

function isSupportedPushEndpoint(endpoint: URL): boolean {
  const hostname = endpoint.hostname.toLowerCase()
  return (
    hostname === "fcm.googleapis.com" ||
    hostname === "push.services.mozilla.com" ||
    hostname.endsWith(".push.services.mozilla.com") ||
    hostname === "web.push.apple.com" ||
    hostname.endsWith(".push.apple.com") ||
    hostname === "notify.windows.com" ||
    hostname.endsWith(".notify.windows.com")
  )
}

export async function POST(request: NextRequest) {
  if (!sameOriginRequest(request)) {
    return NextResponse.json({ error: "Origem da solicitação inválida." }, { status: 403 })
  }
  if (!hasPushConfiguration()) {
    return NextResponse.json(
      { error: "O serviço de notificações ainda não foi configurado." },
      { status: 503 }
    )
  }

  let input: SubscriptionInput
  try {
    input = (await request.json()) as SubscriptionInput
  } catch {
    return NextResponse.json({ error: "Corpo JSON inválido." }, { status: 400 })
  }

  if (
    typeof input.endpoint !== "string" ||
    input.endpoint.length > 2048 ||
    !input.keys ||
    typeof input.keys.p256dh !== "string" ||
    typeof input.keys.auth !== "string" ||
    !input.keys.p256dh ||
    !input.keys.auth
  ) {
    return NextResponse.json({ error: "Assinatura push inválida." }, { status: 400 })
  }

  try {
    const endpoint = new URL(input.endpoint)
    if (endpoint.protocol !== "https:") {
      return NextResponse.json({ error: "Endpoint push inválido." }, { status: 400 })
    }
    if (!isSupportedPushEndpoint(endpoint)) {
      return NextResponse.json(
        { error: "O provedor deste endpoint push não é compatível." },
        { status: 400 }
      )
    }

    await saveSubscription({
      endpoint: endpoint.toString(),
      expirationTime:
        typeof input.expirationTime === "number" ? input.expirationTime : null,
      keys: { p256dh: input.keys.p256dh, auth: input.keys.auth },
    })

    return NextResponse.json({ subscribed: true })
  } catch (error) {
    console.error("[push/subscribe] falha ao salvar assinatura:", error)
    return NextResponse.json(
      { error: "Não foi possível salvar a assinatura push." },
      { status: 502 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  if (!sameOriginRequest(request)) {
    return NextResponse.json({ error: "Origem da solicitação inválida." }, { status: 403 })
  }
  if (!hasPushConfiguration()) {
    return NextResponse.json(
      { error: "O serviço de notificações ainda não foi configurado." },
      { status: 503 }
    )
  }

  let endpoint: unknown
  try {
    endpoint = (await request.json()).endpoint
  } catch {
    return NextResponse.json({ error: "Corpo JSON inválido." }, { status: 400 })
  }
  if (typeof endpoint !== "string" || endpoint.length > 2048) {
    return NextResponse.json({ error: "Endpoint push inválido." }, { status: 400 })
  }

  try {
    await removeSubscription(endpoint)
    return NextResponse.json({ subscribed: false })
  } catch (error) {
    console.error("[push/subscribe] falha ao remover assinatura:", error)
    return NextResponse.json(
      { error: "Não foi possível cancelar a assinatura push." },
      { status: 502 }
    )
  }
}
