import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"

export default defineConfig([
  ...nextVitals,
  globalIgnores([
    ".next/**",
    "node_modules/**",
    "android/**",
    "out/**",
    "coverage/**",
    "public/sw.js",
    "next-env.d.ts",
  ]),
  {
    rules: {
      "react-hooks/exhaustive-deps": "warn",
      "@next/next/no-img-element": "off",
    },
  },
  {
    // Sincronização de APIs exclusivas do navegador (localStorage e Push)
    // feita no efeito de montagem. É intencional: ler no primeiro render
    // faria o HTML do servidor divergir do cliente.
    files: [
      "app/noticias/NoticiasClient.tsx",
      "components/live/LiveAlertsControl.tsx",
    ],
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
])
