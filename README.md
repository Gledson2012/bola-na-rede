# ⚽ Bola na Rede

Aplicativo mobile de futebol desenvolvido com **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS** e empacotado para Android com **Capacitor**.

## 🚀 Tecnologias

- [Next.js 14](https://nextjs.org/) — App Router
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) — estilização utility-first
- [TanStack Query](https://tanstack.com/query) — cache e atualização automática dos dados
- [Zustand](https://zustand-demo.pmnd.rs/) — favoritos, partidas fixadas e lembretes (persistidos)
- [Lucide React](https://lucide.dev/) — ícones
- [Capacitor 7](https://capacitorjs.com/) — empacotamento Android
- [Vitest](https://vitest.dev/) — testes unitários das regras de domínio
- Mobile-first, áreas seguras (notch) e PWA (manifest + ícones PNG/maskable)

## 📦 Estrutura

```
app/
├── layout.tsx              # Layout raiz com Header e BottomNav
├── page.tsx                # Redireciona para /jogos
├── error.tsx               # Erro global da aplicação
├── loading.tsx             # Loading global
├── not-found.tsx           # Página 404
├── manifest.ts             # Manifest PWA
├── icon.svg                # Ícone / favicon
├── analise/page.tsx        # Estimativas estatísticas das partidas
├── api/
│   ├── analise/             # Estimativas e backtest
│   ├── live-monitor/        # Monitor protegido por segredo de cron
│   └── push/                # Configuração e inscrições Web Push
├── jogos/page.tsx          # Lista de jogos com filtros
├── jogos/[id]/page.tsx     # Detalhe da partida (lances e classificação)
├── times/page.tsx          # Times
├── times/[id]/page.tsx     # Detalhe do time
├── classificacao/page.tsx  # Tabela de classificação
└── noticias/page.tsx       # Notícias
components/
├── analise/                # Painel de análise e backtest
├── futebol/                # MatchCard, TeamCard, LeagueTable, NewsCard
├── layout/                 # Header, BottomNav
├── live/                   # Controle de alertas de partidas
├── providers/              # React Query + reidratação do Zustand
├── ui/                     # Button
├── ErrorBoundary.tsx
├── ServiceWorkerRegistration.tsx
└── Skeleton.tsx
lib/
├── api.ts                  # Cliente da API (com timeout) + mapeadores
├── backtest.ts             # Avaliação retrospectiva das probabilidades
├── competitions.ts         # Metadados das competições
├── concurrency.ts          # Execução paralela com limite
├── history.ts              # Forma recente e classificação a partir de resultados
├── live-monitor-storage.ts # Redis REST e deduplicação/lock
├── news-matching.ts        # Vinculação entre notícias e partidas
├── prediction.ts           # Modelo de Poisson
├── queries.ts              # Hooks de dados (React Query)
├── store.ts                # Estado persistido com versão e limite de itens
├── upstream.ts             # Cache/retry das chamadas à API de futebol
├── utils.ts                # cn, formatadores e utilitários
├── web-push.ts             # Inscrições e envio de notificações
└── *.test.ts               # Testes das regras de domínio (Vitest)
types/index.ts              # Tipos globais (Team, Match, Standing, News)
public/                     # Ícones PWA, página offline e service worker
.github/workflows/          # CI e agendamento do monitor a cada 5 minutos
```

## 🔌 Fonte de dados

As chamadas do app vão para `/api/proxy/*`, reescritas no `next.config.js` para
`https://futebol-api-nine.vercel.app`. O proxy depende do host do Next (Vercel ou
`next dev`); não funciona em exportação estática.

A tela `/analise` estima probabilidades usando um modelo de Poisson, tabelas da
competição e forma recente quando há resultados anteriores disponíveis. Sem forma
recente válida, usa os dados da tabela. A tela também permite executar um backtest
retrospectivo de 14 dias, comparando o Brier score do modelo com a frequência de
resultados dos 45 dias anteriores, sem usar resultados posteriores a cada partida.
Dias sem histórico disponível são excluídos e informados. O teste é exploratório e
não garante desempenho futuro. São estimativas, não recomendações de aposta; a
fonte não fornece odds ou xG.

### Alertas ao vivo com resumo de IA

A tela `/analise` permite assinar notificações push para gols, pênaltis e cartões
vermelhos. O workflow do GitHub consulta partidas ao vivo a cada cinco minutos,
deduplica eventos com Redis e envia as notificações pelo Web Push. Quando a chave
OpenRouter está configurada, `openrouter/free` resume os eventos observados; se o
modelo estiver indisponível, o alerta usa um texto factual gerado pelas regras do
servidor. Resumos de IA não acrescentam dados além dos eventos da API.

Para habilitar em produção:

1. Crie uma base Redis REST no Upstash e configure `UPSTASH_REDIS_REST_URL` e
   `UPSTASH_REDIS_REST_TOKEN` nas variáveis de ambiente do servidor.
2. Configure `OPENROUTER_API_KEY` no servidor para permitir o roteador de modelos
   gratuitos. Crie a chave na conta OpenRouter; o identificador `openrouter/free`
   seleciona modelos gratuitos disponíveis, sujeitos a limites e disponibilidade.
3. Gere um par VAPID com `npx web-push generate-vapid-keys`. Configure
   `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` e `VAPID_SUBJECT` no servidor. A chave
   privada nunca deve ser exposta ao navegador.
4. Gere um segredo para autenticar o monitor, por exemplo `openssl rand -hex 32`.
   Configure `MONITOR_CRON_SECRET` no servidor e como secret de repositório no
   GitHub com o mesmo valor.
5. Configure a variável de repositório `LIVE_MONITOR_URL` com a origem pública do
   app (por exemplo `https://seu-app.vercel.app`) e habilite GitHub Actions. O
   workflow roda a cada cinco minutos e também pode ser iniciado manualmente.
6. Configure `APP_PUBLIC_URL` com a origem pública do app e redeploy após
   definir as variáveis do servidor.

Use `.env.example` como referência para os nomes das variáveis. Não coloque
tokens, chaves VAPID privadas ou segredos no código, no navegador ou neste arquivo.
As notificações exigem navegador com suporte a Service Worker/Push API e permissão
do usuário. A execução agendada pode atrasar e o provedor gratuito de IA tem
limites; por isso, nenhum alerta deve ser tratado como instantâneo ou garantido.

> Limitações conhecidas da API: ela informa apenas o horário do jogo (sem data),
> reporta o minuto da partida em **segundos** (convertido em `lib/api.ts`) e não
> fornece estatísticas, escalações ou histórico de confrontos.

## ▶️ Como rodar

```bash
# 1. Instale as dependências
npm install

# 2. Rode em modo desenvolvimento
npm run dev

# 3. Acesse http://localhost:3000
```

Verificações:

```bash
npm run lint        # ESLint (next/core-web-vitals)
npx tsc --noEmit    # Checagem de tipos
npm test            # Testes unitários (Vitest)
npm run build       # build de produção
```

O workflow `.github/workflows/ci.yml` executa essas etapas em cada push e pull
request.

## 🛡️ Qualidade e segurança

- Headers de segurança (HSTS, `nosniff`, `X-Frame-Options`, Permissions-Policy e
  um subconjunto conservador de CSP) aplicados a todas as rotas.
- As telas `/jogos` e `/noticias` renderizam a lista inicial no servidor (ISR) e
  o cliente revalida em seguida: o primeiro paint mostra conteúdo, não skeleton.
- `/api/analise` e `/api/noticias` são respostas globais cacheadas na CDN
  (`revalidate` + `s-maxage`), reduzindo execuções do modelo por visitante.
- O service worker guarda assets imutáveis (`/_next/static/*`) e mostra
  `public/offline.html` quando a navegação falha por falta de rede. Ele é
  registrado automaticamente apenas no build de produção.
- O otimizador de imagens do Next está desligado (`images.unoptimized`), pois as
  imagens vêm de hosts variados; isso fecha o endpoint `/_next/image`.
- Requisições do cliente têm timeout com mensagem amigável em caso de rede ruim.
- O estado persistido tem versão, migração e teto por lista para não estourar o
  `localStorage`.
- Listas longas usam `content-visibility: auto` para não calcular layout do que
  está fora da tela.

## 📱 Android (Capacitor)

O app Android está em `android/` e, atualmente, carrega o site publicado via
`server.url` em `capacitor.config.ts` (WebView). Para gerar o APK:

```bash
npx cap sync android
cd android && ./gradlew assembleDebug
```

## 🧱 Próximos passos sugeridos

- Contrato de API com data real do jogo (para filtros por dia) e minutagem em minutos
- Enriquecer a fonte de dados: estatísticas, escalações e H2H reais
- Autenticação (NextAuth.js / Clerk)
- Componentes de servidor para as listas iniciais e virtualização das listas longas
- Rate limit no proxy (requer Redis ou regra no provedor de borda)
- Cache offline / estratégia de fallback no WebView
