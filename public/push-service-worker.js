self.addEventListener("push", (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    payload = { title: "Bola na Rede", body: event.data?.text() || "Novo alerta de futebol." }
  }

  const title = payload.title || "Bola na Rede"
  const options = {
    body: payload.body || "Há uma atualização em uma partida ao vivo.",
    icon: payload.icon || "/icon.svg",
    badge: "/icon.svg",
    data: { url: payload.url || "/jogos", ...(payload.data || {}) },
    tag: payload.tag || "bola-na-rede-live",
    renotify: true,
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const targetUrl = new URL(event.notification.data?.url || "/jogos", self.location.origin)

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => new URL(client.url).origin === self.location.origin)
      if (existing) {
        existing.navigate(targetUrl.href)
        return existing.focus()
      }
      return self.clients.openWindow(targetUrl.href)
    })
  )
})
