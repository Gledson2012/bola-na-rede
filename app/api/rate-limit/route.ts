import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit, clientKey } from "@/lib/rate-limit"

/**
 * Endpoint para testar rate limiting.
 *
 * GET /api/rate-limit
 *
 * Retorna informações sobre o limite de taxa do IP requisitante.
 */
export async function GET(request: NextRequest) {
  try {
    const ip = clientKey(request.headers)

    // Testa com limite de 10 requisições por minuto
    const result = await checkRateLimit(ip, 10, 60)

    if (result.limited) {
      return NextResponse.json(
        {
          success: false,
          message: "Limite de taxa excedido",
          remaining: result.remaining,
          retryAfter: result.retryAfter,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": "10",
            "X-RateLimit-Remaining": String(result.remaining),
            "Retry-After": String(result.retryAfter),
          },
        }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: "Requisição permitida",
        remaining: result.remaining,
        retryAfter: result.retryAfter,
      },
      {
        headers: {
          "X-RateLimit-Limit": "10",
          "X-RateLimit-Remaining": String(result.remaining),
        },
      }
    )
  } catch (error) {
    console.error("Rate limit error:", error)
    return NextResponse.json(
      { success: false, message: "Erro ao verificar limite de taxa" },
      { status: 500 }
    )
  }
}
