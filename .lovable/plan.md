

# Plano: Sistema de Logs Reais de Reprodução + Nome do Pedido

## Resumo
Criar infraestrutura completa para registrar cada reprodução de vídeo nos elevadores em tempo real, substituir dados fictícios por dados reais no relatório do anunciante, e exibir o nome correto dos pedidos.

## Arquitetura

```text
TV (Player)                    Edge Function               Tabela
┌──────────┐   batch/5min   ┌──────────────┐   service   ┌──────────────────┐
│ Minimal  │ ─────POST────▶ │ log-playback │ ──role────▶ │ video_playback   │
│ Display  │   [{video_id,  │ (público,    │   INSERT    │ _logs            │
│ Panel    │    building_id, │  valida      │             │                  │
│          │    duration_s,  │  payload)    │             │                  │
│          │    started_at}] │              │             │                  │
└──────────┘                └──────────────┘             └──────────────────┘

Relatório (useVideoReportData)
┌────────────────────────────────┐
│ SELECT SUM(duration_seconds),  │
│   COUNT(*), DATE(started_at)   │
│ FROM video_playback_logs       │
│ WHERE video_id = X             │
│   AND started_at BETWEEN ...   │
│ GROUP BY DATE(started_at)      │
│                                │
│ Fallback: se COUNT = 0 para    │
│ período, mostra estimativa     │
│ com badge "Estimativa"         │
└────────────────────────────────┘
```

## Fase 1 — Tabela `video_playback_logs`

Nova migration criando:
- `id`, `building_id` (NOT NULL), `video_id` (NOT NULL), `pedido_id`, `started_at`, `duration_seconds`
- Indexes em `(video_id, started_at)` e `(building_id, started_at)` para queries rápidas
- RLS: sem acesso público direto (inserção via Edge Function com service_role); SELECT para authenticated com `has_role('admin')` ou `client_id` match via pedido

## Fase 2 — Edge Function `log-video-playback`

- Endpoint público (sem JWT — TVs não autenticam)
- Valida payload com Zod: array de `{ video_id, building_id, pedido_id?, duration_seconds, started_at }`
- Valida que `building_id` e `video_id` são UUIDs reais
- Insere com `SUPABASE_SERVICE_ROLE_KEY` (bypass RLS)
- Rate limit básico: máximo 100 logs por request

## Fase 3 — Player (`MinimalDisplayPanel.tsx`)

- Ao iniciar vídeo: salvar `startedAt = Date.now()` em ref
- Ao terminar (`onEnded`): calcular duração real, acumular em array local
- A cada 5 minutos (ou ao atingir 50 itens): enviar batch via `supabase.functions.invoke('log-video-playback', { body: { logs: [...] } })`
- Limpar buffer após envio bem-sucedido
- Se falhar, manter no buffer e tentar no próximo ciclo
- Ao desmontar componente (`useEffect cleanup`): tentar enviar buffer restante

## Fase 4 — Relatório com dados reais (`useVideoReportData.ts`)

**Nome do pedido:**
- Adicionar `nomePedido` ao tipo `CampaignReport`
- Usar `pedido.nome_pedido` (já retornado pelo `select('*')`)

**Métricas reais:**
- Query `video_playback_logs` agrupada por `video_id` no período selecionado
- `totalExibicoes = COUNT(*)` real
- `totalHoras = SUM(duration_seconds) / 3600` real
- Se COUNT = 0 para o período (dados anteriores à implementação): manter estimativa com badge visual "Estimativa" ao lado do número

**Gráfico de evolução:**
- `GROUP BY DATE(started_at)` para gerar timeline real dia a dia
- Dias sem logs = 0 horas (linha no zero, não inventada)

**Prédios:**
- Contar `DISTINCT building_id` dos logs reais (em quantos prédios o vídeo realmente tocou)

## Fase 5 — UI do Card (`CampaignReportCard.tsx`)

- Título: `campaign.nomePedido` (nome real) em vez de `Pedido #hash`
- Subtítulo: `#{pedidoId.substring(0,8)}` como referência secundária
- Badge "Dados Reais" (verde) ou "Estimativa" (amarelo) ao lado das métricas
- Métricas de prédios: "Exibido em X prédios" baseado nos logs reais

## Fase 6 — Real-time subscription filtrado

- Filtrar subscription de `pedidos` por `client_id` para evitar refetch desnecessário

## Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `supabase/migrations/new.sql` | Criar `video_playback_logs` + indexes + RLS |
| `supabase/functions/log-video-playback/index.ts` | Edge Function pública para batch insert |
| `src/pages/public/MinimalDisplayPanel.tsx` | Buffer de playback + envio batch 5min |
| `src/hooks/useVideoReportData.ts` | Query real de logs + `nomePedido` + fallback estimativa |
| `src/components/advertiser/CampaignReportCard.tsx` | Nome pedido + badges dados reais/estimativa |
| `src/components/advertiser/CampaignSummaryStats.tsx` | Badge indicando fonte dos dados |

## O que NÃO muda
- Funcionalidade do player (vídeos continuam tocando normalmente)
- Sistema de aprovação, agendamento, painéis
- Layout de outras páginas
- Nenhuma tabela existente alterada

## Segurança
- Edge Function valida formato/tamanho do payload
- Inserção via service_role (sem acesso público direto à tabela)
- RLS na tabela: admin vê tudo, cliente vê só seus pedidos
- Sem exposição de dados sensíveis no player

