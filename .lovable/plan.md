## Diagnóstico

Varredura completa nas RPCs e dashboards. Os números estão zerados por **3 causas reais**:

### 1. `get_orders_stats_real` (Dashboard `/super_admin/pedidos`)
Calcula `receita_confirmada` SOMENTE da tabela `parcelas`. Hoje **17 pedidos** com status `ativo`/`pago_pendente_video` (incluindo R$ 6.271 e R$ 792, lançados manualmente pelo admin) **não têm parcela gerada**. Por isso aparece "R$ 0,00 Receita Confirmada".

### 2. `get_dashboard_stats_by_month` (Dashboard Inicial)
- `monthly_revenue` até soma `valor_total`, mas **não distingue** receita à vista vs mensal recorrente (MRR).
- Não há card mostrando vendas/receita do mês com a quebra correta.

### 3. Formulário de novo pedido não persiste tipo de cobrança
Mudança recente do form (avista/mensal) gravou `valor_total`, mas as colunas `tipo_cobranca` e `valor_mensal` **não existem** na tabela `pedidos` — informação se perde.

---

## O que vou fazer

### A) Migração SQL
1. Adicionar em `public.pedidos`:
   - `tipo_cobranca text DEFAULT 'avista'` (`avista` | `mensal`)
   - `valor_mensal numeric` (nullable)
2. Reescrever `get_orders_stats_real` para somar **direto de `pedidos.valor_total`** quando status ∈ (`pago`, `ativo`, `pago_pendente_video`, `video_aprovado`) — **funciona com pedidos manuais do admin**, sem depender de parcelas. Quando houver parcelas, prioriza o valor pago real das parcelas para evitar contagem dupla.
3. Adicionar à RPC dois novos campos: `receita_avista` e `receita_mensal_recorrente` (MRR).
4. Atualizar `get_dashboard_stats_by_month` para incluir:
   - `monthly_revenue_avista`
   - `monthly_revenue_recorrente` (MRR)
   - `vendas_realizadas` (count de pedidos do mês com status pago/ativo)

### B) Frontend
- `useAdminCreateOrder.ts` — gravar `tipo_cobranca` e `valor_mensal` no INSERT.
- `OrdersCompactStats.tsx` — consumir os novos campos da RPC (Receita Confirmada passará a mostrar ~R$ 7.077 em vez de R$ 0).
- `DashboardStatsCards.tsx` — card "Receita do Mês" mostra total + quebra discreta "À vista: R$ X · Mensal: R$ Y/mês".
- Tipo TS em `useMonthlyDashboardData` — adicionar campos novos.

### C) Não vou alterar
- Layout/visual dos cards (mantém glassmorphism EXA).
- Outros fluxos (criação de pedido continua igual, só passa a persistir 2 campos extras).
- Nenhuma RPC fora das 2 listadas.

---

## Resultado esperado
- Dashboard de Pedidos: **R$ 7.077,50** de receita confirmada (804,30 + 6.273,20) em vez de R$ 0.
- Dashboard Inicial: vendas e receita do mês corretas, com separação à vista vs mensal.
- Pedidos lançados **manualmente pelo admin** entram em todos os totais automaticamente.
- Novos pedidos no modo "Mensal" alimentam o MRR corretamente.

Aprove para eu executar.