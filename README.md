# EXA Mídia

Plataforma institucional e operacional da **EXA Mídia** — marca da **Indexa Mídia LTDA** (CNPJ 38.142.638/0001-30), DOOH residencial premium em Foz do Iguaçu/PR.

Site público: <https://www.examidia.com.br>

---

## Stack

- React 18 + Vite + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Auth, Postgres com RLS, Storage, Edge Functions)

## Desenvolvimento local

Pré-requisitos: Node.js LTS e npm.

```sh
npm install
npm run dev
```

A aplicação sobe em `http://localhost:8080`.

## Build de produção

```sh
npm run build
```

Os artefatos são gerados em `dist/`.

## Estrutura

- `src/` — aplicação React (páginas públicas, área administrativa, módulos internos).
- `public/` — assets estáticos servidos a partir da raiz (favicons, OG, manifest, sitemap, robots).
- `supabase/` — migrations, edge functions e configuração do backend.

## Acesso

Repositório privado. Acesso restrito ao time interno da Indexa Mídia LTDA.

© Indexa Mídia LTDA — Todos os direitos reservados.
