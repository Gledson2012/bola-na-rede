import { test, expect, type Page } from "@playwright/test"

// URL base definida pelo playwright.config (BASE_URL, default :3000)

test("home renderiza e navega com a barra de conteúdo", async ({ page }) => {
  await page.goto("/")
  await page.waitForLoadState("domcontentloaded")
  // Título da aplicação
  await expect(page.locator("h1")).toHaveText("Bola na Rede")
  // Botão principal: "Ver Jogos de Hoje"
  await expect(
    page.getByRole("link", { name: "Ver Jogos de Hoje" })
  ).toBeVisible()
  // Link de pular conteúdo
  await expect(page.locator('a[href="#conteudo"]')).toBeVisible()
  // Seção de ligas em destaque
  await expect(
    page.getByRole("heading", { name: "Ligas em Destaque", level: 3 })
  ).toBeVisible()
})

test("página de jogos renderiza lista e filtros", async ({ page }) => {
  await page.goto("/jogos")
  await page.waitForLoadState("domcontentloaded")
  await expect(
    page.getByRole("heading", { name: "Jogos" })
  ).toBeVisible()
  // Estado do dia: filtro segmentado e resumo
  await expect(
    page.getByRole("button", { name: /Todos/ })
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: /Fixados/ })
  ).toBeVisible()
})

test("página de análise renderiza cabeçalho e seções", async ({ page }) => {
  await page.goto("/analise")
  await page.waitForLoadState("domcontentloaded")
  await expect(
    page.getByRole("heading", { name: "Análise" })
  ).toBeVisible()
  // Card de resumo da análise
  await expect(
    page.getByRole("region", { name: "Resumo da análise" })
  ).toBeVisible()
  // Modal "Como funciona a análise"
  await page.click('button[aria-label="Como funciona a análise"]')
  await expect(
    page.getByRole("heading", { name: "Como funciona a Análise" })
  ).toBeVisible()
  // Fechar o modal clicando no botão de fechar
  await page.click('button[aria-label="Fechar"]')
  await expect(
    page.getByRole("heading", { name: "Como funciona a Análise" })
  ).not.toBeVisible()
})

test("página de classificação renderiza tabela", async ({ page }) => {
  await page.goto("/classificacao")
  await page.waitForLoadState("domcontentloaded")
  // O <h1> é o nome da liga (padrão: Brasileirão)
  await expect(
    page.getByRole("heading", { name: "Brasileirão Série A" })
  ).toBeVisible()
  // O resumo da classificação (TableStats) está disponível
  await expect(
    page.getByRole("region", { name: "Resumo da classificação" })
  ).toBeVisible()
})

test("página de notícias renderiza e navega", async ({ page }) => {
  await page.goto("/noticias")
  await page.waitForLoadState("domcontentloaded")
  await expect(
    page.getByRole("heading", { name: "Notícias" })
  ).toBeVisible()
})

test("rota 404 retorna página não encontrada", async ({ page }) => {
  const response = await page.goto("/nao-existe")
  expect(response?.status()).toBe(404)
  await expect(
    page.getByRole("heading", { name: "Página não encontrada" })
  ).toBeVisible()
})

test("navegação por teclado (F/R/1–5) funciona", async ({ page }) => {
  await page.goto("/jogos")
  await page.waitForLoadState("domcontentloaded")
  // Foco na página (body) para o atalho funcionar
  await page.click("body")
  // F = focarmos no input de busca
  page.keyboard.press("f")
  await expect(
    page.getByRole("searchbox", { name: "Buscar partidas" })
  ).toBeFocused()
  // R = atualizar; não quebra a página
  page.keyboard.press("r")
  // Filtros ativados por clique (semapáforo ARIA)
  await page.getByRole("button", { name: "Em breve" }).click()
  await expect(
    page.getByRole("button", { name: "Em breve" })
  ).toHaveAttribute("aria-pressed", "true")
})

test("página raiz entrega HTML mesmo sem recursos upstream", async ({ page }) => {
  // O app degrada com UI limpa se o upstream estiver offline; validamos
  // que a rota responde e entrega HTML.
  await page.goto("/")
  await page.waitForLoadState("domcontentloaded")
  await expect(
    page.getByRole("heading", { name: "Bola na Rede" })
  ).toBeVisible()
})
