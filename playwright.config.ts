import { defineConfig } from "@playwright/test"

/**
 * Testes E2E para Bola na Rede.
 *
 * O app é um Next.js App Router (não exportável estático): roda `next start`
 * no diretório de build (`.next`) e os testes acessam `http://localhost:3000`.
 *
 * Variáveis de ambiente opcionais (padrão casa de testes de dev):
 * - BASE_URL       Endereço do servidor (padrão http://localhost:3000)
 * - UPSTREAM_URL   Rota reversa do upstream; se vazia os testes usam a
 *                  configuração padrão do app (/api/proxy).
 */
export default defineConfig({
  testDir: "./tests/e2e",
  /* Run tests in files in parallel (fast) */
  fullyParallel: true,
  /* Valores fixos: 1 worker local, quantos o CI permitir */
  workers:
    process.env.CI ? "2" : 1,
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  /* Launch chromium headless (no display required) */
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    headless: true,
    viewport: { width: 390, height: 844 }, // phone-ish
    /* Respect the app's accessibility tree and avoid script injection */
    actionTimeout: 10_000,
  },
  /* A build é reaproveitada para todos os testes */
  webServer: {
    command: "npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      // O app anteriormente buscava o upstream via /api/proxy; sem rede
      // externa nos testes o app degrada com UI limpa. Mantém a variável
      // de ambiente para futura troca de upstream.
      FUTEBOL_API_URL: process.env.FUTEBOL_API_URL || "https://futebol-api-nine.vercel.app",
    },
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
})
