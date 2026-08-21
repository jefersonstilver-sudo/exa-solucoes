# Banco intermitente: PGRST002 voltando

## O que está acontecendo agora

O banco está de pé — o problema é a API de dados (PostgREST), que fica **entrando e saindo do ar**:

- `GET /rest/v1/logos` respondeu `503 PGRST002 – "Could not query the database for the schema cache"`, depois `200`, depois `200` de novo em poucos segundos.
- Auth (GoTrue) está saudável; conexões em 23/60, sem locks presos.
- Os timeouts do papel `authenticator` já estão corrigidos (`statement_timeout=120s`, `lock_timeout=30s`) — não é mais aquele problema.

## Causa medida agora

Ao montar o cache de schema o PostgREST executa uma consulta em `pg_timezone_names`. Medido no banco neste momento:

```text
select count(*) from pg_timezone_names  →  50,9 segundos (1194 linhas)
```

Isso normalmente leva milissegundos. Somado à introspecção do schema (291 tabelas/views, 3.726 colunas, 327 funções em `public`), cada recarga de cache passa perto do teto de 120s: às vezes conclui (200) e às vezes é abortada (503). Qualquer migration, deploy ou restart dispara uma nova recarga e derruba a API de novo por alguns minutos.

Uma leitura de catálogo tão lenta é sinal de instância sem CPU/IO disponível (crédito de burst esgotado no plano de compute), não de algo no código do app.

## Plano proposto

1. **Confirmar o gargalo de compute** (leitura, sem alterar nada): repetir a medição de `pg_timezone_names` algumas vezes e olhar CPU/IO do projeto no painel do Supabase (Reports > Database). Se o tempo variar de ~0,1s a ~50s, é throttling de IO/CPU.
2. **Ação no painel do Supabase (feita por você, eu não tenho acesso):**
   - Settings > General > **Restart project** para forçar uma recarga limpa do PostgREST;
   - se o tempo alto se confirmar, **subir o compute size** (o micro/nano throttla e é o cenário mais provável).
3. **Reduzir o custo da introspecção (migration, opcional e reversível):** hoje `public` expõe 291 relações e 327 funções à API. Mover para um schema privado (`internal`) o que o front nunca chama pela API encurta bastante cada recarga de cache. Eu levantaria a lista antes e mostraria para você aprovar tabela por tabela — nada é movido sem sua confirmação.
4. **Resiliência no front (mudança pequena e isolada):** tratar `503/PGRST002` como erro temporário, com 3 tentativas em backoff, no cliente Supabase e no hook das logos. Assim uma recarga de cache de 30s não deixa mais a home em "Carregando logos..." nem a loja vazia. Nenhuma alteração de layout, fluxo ou funcionalidade.

## Escopo

Itens 1 e 2 são diagnóstico e ação no painel. Os itens 3 e 4 só avanço com sua aprovação explícita, e nenhum deles altera interface, regra de negócio ou fluxo existente.
