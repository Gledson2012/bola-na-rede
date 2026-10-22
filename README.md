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
- Mobile-first, áreas seguras (notch) e PWA (manifest + ícone)

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
├── live/                   # Controle de alertas de partidas
├── ui/                     # Button, Card, Badge
├── layout/                 # Header, BottomNav
├── futebol/                # MatchCard, TeamCard, LeagueTable, NewsCard
├── providers/              # React Query + reidratação do Zustand
├── ErrorBoundary.tsx
└── Skeleton.tsx
lib/
├── api.ts                  # Cliente da API + mapeadores
├── backtest.ts             # Avaliação retrospectiva das probabilidades
├── live-monitor-storage.ts # Redis REST e deduplicação/lock
├── queries.ts              # Hooks de dados (React Query)
├── web-push.ts             # Inscrições e envio de notificações
├── competitions.ts         # Metadados das competições
├── store.ts                # Estado persistido (favoritos/lembretes)
└── utils.ts                # cn, formatDate, formatTime
types/index.ts              # Tipos globais (Team, Match, Standing, News)
public/push-service-worker.js # Recepção de notificações push
.github/workflows/           # Agendamento do monitor a cada 5 minutos
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
npm run build   # build de produção
npm run lint    # ESLint (next/core-web-vitals)
```

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
- Notificações push (OneSignal / Firebase)
- Cache offline / estratégia de fallback no WebView
