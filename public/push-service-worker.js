/*
 * Service worker único do app.
 *
 * Responsabilidades:
 * 1. Push e clique em notificação (já existia).
 * 2. Cache de assets imutáveis do Next (`/_next/static/*` e imagens), que têm
 *    hash no nome e nunca mudam dentro de um deploy.
 * 3. Fallback offline: se a navegação falhar por falta de rede, mostra
 *    `/offline.html` em vez do erro nativo do WebView.
 *
 * HTML/API não são cacheados: um deploy novo precisa buscar o HTML novo, que
 * referencia os chunks novos. Só os arquivos com hash são servidos do cache.
 */

const VERSION = "1"
const STATIC_CACHE = `bnr-static-${VERSION}`
const OFFLINE_CACHE = `bnr-offline-${VERSION}`
const OFFLINE_URL = "/offline.html"
const MAX_STATIC_ENTRIES = 120

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(OFFLINE_CACHE)
      .then((cache) => cache.add(new Request(OFFLINE_URL, { cache: "reload" })))
      .catch(() => undefined)
      .then(() => self.skipWaiting())
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== OFFLINE_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  )
})

async function trimCache(cache, maxEntries) {
  const keys = await cache.keys()
  if (keys.length <= maxEntries) return
  await Promise.all(
    keys.slice(0, keys.length - maxEntries).map((key) => cache.delete(key))
  )
}

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE)
  const cached = await cache.match(request)
  if (cached) return cached

  const response = await fetch(request)
  if (response.ok) {
    cache
      .put(request, response.clone())
      .then(() => trimCache(cache, MAX_STATIC_ENTRIES))
      .catch(() => undefined)
  }
  return response
}

async function networkFirstNavigation(request) {
  try {
    return await fetch(request)
  } catch {
    const cache = await caches.open(OFFLINE_CACHE)
    const offline = await cache.match(OFFLINE_URL)
    if (offline) return offline

    return new Response("Sem conexão com a internet.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET") return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request))
    return
  }

  const isImmutableAsset =
    url.pathname.startsWith("/_next/static/") ||
    /\.(?:png|jpe?g|gif|svg|ico|webp|woff2?)$/i.test(url.pathname)

  if (isImmutableAsset) {
    event.respondWith(
      cacheFirst(request).catch(() => new Response("", { status: 504 }))
    )
  }
})

self.addEventListener("push", (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    payload = {
      title: "Bola na Rede",
      body: event.data?.text() || "Novo alerta de futebol.",
    }
  }

  const title = payload.title || "Bola na Rede"
  const options = {
    body: payload.body || "Há uma atualização em uma partida ao vivo.",
    icon: payload.icon || "/icon-192.png",
    badge: "/icon-192.png",
    data: { url: payload.url || "/jogos", ...(payload.data || {}) },
    tag: payload.tag || "bola-na-rede-live",
    renotify: true,
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const targetUrl = new URL(
    event.notification.data?.url || "/jogos",
    self.location.origin
  )

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find(
          (client) => new URL(client.url).origin === self.location.origin
        )
        if (existing) {
          existing.navigate(targetUrl.href)
          return existing.focus()
        }
        return self.clients.openWindow(targetUrl.href)
      })
  )
})
