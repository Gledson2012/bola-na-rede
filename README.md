# ⚽ FutebolApp

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
├── jogos/page.tsx          # Lista de jogos com filtros
├── jogos/[id]/page.tsx     # Detalhe da partida (lances e classificação)
├── times/page.tsx          # Times
├── times/[id]/page.tsx     # Detalhe do time
├── classificacao/page.tsx  # Tabela de classificação
└── noticias/page.tsx       # Notícias
components/
├── ui/                     # Button, Card, Badge
├── layout/                 # Header, BottomNav
├── futebol/                # MatchCard, TeamCard, LeagueTable, NewsCard
├── providers/              # React Query + reidratação do Zustand
├── ErrorBoundary.tsx
└── Skeleton.tsx
lib/
├── api.ts                  # Cliente da API + mapeadores
├── queries.ts              # Hooks de dados (React Query)
├── competitions.ts         # Metadados das competições
├── store.ts                # Estado persistido (favoritos/lembretes)
└── utils.ts                # cn, formatDate, formatTime
types/index.ts              # Tipos globais (Team, Match, Standing, News)
```

## 🔌 Fonte de dados

As chamadas do app vão para `/api/proxy/*`, reescritas no `next.config.js` para
`https://futebol-api-nine.vercel.app`. O proxy depende do host do Next (Vercel ou
`next dev`); não funciona em exportação estática.

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
