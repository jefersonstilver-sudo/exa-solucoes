## Objetivo

Publicar página pública em `examidia.com.br/catalogo` com todos os prédios da Rede EXA — Ativos, em Instalação e em Interesse — usando dados reais do Notion (Base de prédios oficial), **incluindo fotos de cada prédio**. Sem tocar nas tabelas de prédios do Supabase.

## Fonte de dados

Notion data source `Prédios Painéis` (já validado, 102 registros, 33 campos por prédio incluindo `fotos`).

Filtraremos apenas:
- **Ativo** (13)
- **Instalação** + **Instalação Internet** (8)
- **Interesse** (79)

≈ 100 prédios exibidos.

## Imagens dos prédios

O campo `fotos` no Notion vem como array de arquivos (`file.url` para uploads internos do Notion ou `external.url`). URLs internas do Notion **expiram em ~1h**, então:

1. A edge function `catalogo-predios` retorna a primeira foto de cada prédio.
2. Para uploads internos do Notion (URLs assinadas com expiração), a edge function gera uma URL do **proxy `catalogo-foto`** em vez da URL crua.
3. A edge function **`catalogo-foto`** recebe `?id=<page_id>&i=<idx>` → busca a página no Notion → devolve o arquivo via `fetch` com `Cache-Control: public, max-age=86400`.
4. Resultado: imagens sempre frescas, sem precisar copiar nada para Storage.

Prédios sem foto recebem fallback visual (número grande + nome em destaque, mantendo o estilo do mock).

## Arquitetura

```text
Browser /catalogo
   │
   ├─ GET edge: catalogo-predios   → JSON normalizado (com URLs de foto via proxy)
   │
   └─ <img src="…/catalogo-foto?id=…"> → stream do arquivo do Notion (cache 24h)
```

Sem persistência em DB, sem Supabase Storage.

## Entregas

1. **Edge function `catalogo-predios`** (`supabase/functions/catalogo-predios/index.ts`)
   - Lê data source `1d6f9e03-8d81-813f-ad60-ff2fa347c3f5` paginado
   - Filtra status ∈ {Ativo, Instalação, Instalação Internet, Interesse}
   - Normaliza: `{ id, nome, endereco, bairro, status, unidades, andares, blocos, publico_estimado, tipo, foto_url, fotos_count }`
   - `foto_url` aponta para `/functions/v1/catalogo-foto?id=…&i=0`
   - CORS público + `Cache-Control: public, max-age=600`

2. **Edge function `catalogo-foto`** (`supabase/functions/catalogo-foto/index.ts`)
   - GET `?id=<page_id>&i=<idx>` → consulta página no Notion → resolve URL atual da foto → faz `fetch` e devolve binário com Content-Type correto
   - `Cache-Control: public, max-age=86400, immutable`

3. **Página `src/pages/Catalogo.tsx`**
   - Adapta o HTML enviado (preto/vermelho EXA, Barlow Condensed + Inter) para React
   - Hero com KPIs reais (counts vindos do endpoint)
   - 3 seções: ATIVOS / EM INSTALAÇÃO / EM INTERESSE
   - **Card com foto do prédio** no topo (lazy-load, `aspect-ratio` fixo, overlay escuro com gradiente para garantir leitura do texto)
   - Fallback elegante quando não há foto (numeração grande + iniciais)
   - SEO via Helmet, texto selecionável, scroll vertical (regra páginas públicas)

4. **Rota** em `src/App.tsx`
   - `<Route path="/catalogo" element={<Catalogo/>} />` (lazy)

## Detalhes técnicos

- `NOTION_API_KEY` já configurado.
- Headers Notion: `Authorization: Bearer …`, `Notion-Version: 2022-06-28`.
- Paginação Notion: loop `has_more / next_cursor`.
- Proxy de foto evita expiração de URLs assinadas do Notion e oculta a chave.
- `examidia.com.br/catalogo` funciona automaticamente (custom domain mapeado).

## O que NÃO será feito

- Nenhuma migração de DB.
- Nenhuma leitura/escrita em `buildings` ou tabelas correlatas.
- Nenhuma mudança em rotas, layout ou componentes existentes.
