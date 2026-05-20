## Objetivo
Corrigir os bugs do relatório atual e adicionar o **contador de dias em exibição** (real, derivado de dados reais) em **todos os lugares** onde vídeos aparecem — sem alterar nada além disso.

---

## Parte 1 — Correções de dados (bugs encontrados)

### 1.1. Vídeo órfão `v4-delivery` do pedido `7419ff78…`
- Está `is_active=true` + `approved=true`, sem `selected_for_display` e **sem regra em `campaign_video_schedules`** → fica zero pra sempre no relatório.
- **Ação:** criar regra de agendamento padrão preenchendo a janela livre (Seg–Qui, 14:00–17:00). Manter o vídeo no pedido. (Se preferir transformar em base ou remover, me avise antes da execução.)

### 1.2. Bug do `approved_at` nulo
- 4 vídeos têm `approval_status=approved` mas `approved_at IS NULL` por bug em `src/services/videoUploadService.ts:449`.
- **Ações:**
  - Backfill: setar `approved_at = updated_at` nos 4 órfãos.
  - Corrigir `videoUploadService.ts` para sempre gravar `approved_at = now()` ao aprovar.

### 1.3. Bug do tooltip "05 de julho" no chart
- O eixo X mostra datas corretas (05/05, 06/05…) mas o tooltip do gráfico em `CampaignReportCard` renderiza o mês errado.
- **Ação:** corrigir o formatter do tooltip para usar o mesmo formato do eixo X.

---

## Parte 2 — Contador de dias em exibição (sem tabelas novas)

### 2.1. Fonte da verdade (100% derivada de dados reais)
Criar utilitário `src/utils/videoDisplayDays.ts` com a função:

```text
calcDisplayDays(video, scheduleRules, today):
  if video.is_base_video OR scheduleRules vazio:
      start = video.approved_at
      return floor((today - start) / 1 dia)
  else:
      start = MIN(scheduleRules.created_at)
      conta dias entre start e today que caem em days_of_week ativos
      return esse total
```

- **Vídeo base:** `dias = hoje − approved_at` (auto-ativado pela `auto-activate-first-video`).
- **Vídeo agendado:** conta apenas dias úteis do agendamento (a mesma matemática que `useVideoReportData.ts` já usa para "exibições por dia"). Isso responde à sua pergunta "é de acordo aos agendamentos registrados — ela já deveria contar".
- Vídeos não aprovados / sem `approved_at` → contador não aparece.

### 2.2. Faixas de cor (badge "bolinha")
```text
0–14 dias  → verde   (Novo)
15–29 dias → vermelho claro (Atenção: renovar em breve)
30+ dias   → vermelho forte (Crítico: vídeo velho, renovar agora)
```

### 2.3. Componente único reutilizável
`src/components/video-management/VideoDaysBadge.tsx`
- Bolinha pequena no canto superior esquerdo do thumbnail
- Tooltip ao passar o mouse:
  > "Este vídeo está em exibição há **X dias**. Vídeos com mais de 30 dias rendem menos — quanto mais frequente a troca, melhor o resultado da sua campanha."

---

## Parte 3 — Onde aplicar o badge (todos os locais)

| # | Local | Arquivo |
|---|---|---|
| 1 | Cards do anunciante (Meus Vídeos) | `src/components/advertiser/VideoThumbnailGrid.tsx` |
| 2 | Card do relatório do anunciante | `src/components/advertiser/CampaignReportCard.tsx` |
| 3 | Coluna "dias em exibição" no resumo | `CampaignSummaryStats.tsx` (novo KPI: "vídeos > 30 dias") |
| 4 | Admin — relatório profissional do pedido | `src/components/admin/orders/ProfessionalOrderReport.tsx` |
| 5 | Admin — slots de vídeo do pedido | `src/components/video-management/OrderVideoThumbnail.tsx` e telas relacionadas |
| 6 | Admin — lista de campanhas ativas do prédio | consumidores de `useBuildingActiveCampaigns` |
| 7 | Admin — Gestão de Vídeos / aprovação | `src/components/admin/orders/...` (slots) |
| 8 | **PDF exportado** | `src/components/admin/orders/ProfessionalPDFExporter.tsx` — adicionar coluna "Dias em exibição" + cor da faixa |
| 9 | Painel de alertas do admin | adicionar alerta "X vídeos com mais de 30 dias" no dashboard admin |

---

## Parte 4 — Garantias

- ✅ **Zero dado fictício:** tudo derivado de `approved_at`, `campaign_video_schedules`, `campaign_schedule_rules`, `is_active`, `selected_for_display`, `is_base_video`. Mesma fonte que o relatório já consome.
- ✅ **Nenhuma tabela nova, nenhum trigger novo, nenhum edge function novo.** Cálculo no client em uma única função pura testável.
- ✅ **Sem alterar UI/funcionalidade fora do escopo** (regra do projeto).
- ✅ Banner verde do `MyVideos` continua avisando que exibições são operacionais.

---

## Detalhes técnicos

- Hook auxiliar `useVideoDisplayDays(videoId, pedidoId)` que reaproveita o que `useVideoDisplayStatus` já busca (não duplica query).
- Migração SQL **única** apenas para os 2 fixes de dados (Parte 1.1 e 1.2 backfill).
- Code-fix em `videoUploadService.ts` para evitar futuros órfãos.

---

## Pendências para você confirmar antes de executar
1. **v4-delivery**: agendar Seg–Qui 14:00–17:00 (sugestão) ou outra ação?
2. **Faixas 0-14 / 15-29 / 30+**: mantém esses limites?
3. **Texto do tooltip**: o copy proposto acima está bom?