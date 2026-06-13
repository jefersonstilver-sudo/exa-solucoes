## Ajustes no Relatório de Playlist

### 1. Remover seção "Visão por Cliente"
**Arquivo:** `src/pages/admin/RelatorioPlaylistPage.tsx`
- Remover o import de `ReportByClient`.
- Remover `<ReportByClient report={data} />` do JSX.
- Manter o arquivo `ReportByClient.tsx` no projeto (não-destrutivo) — pode ser deletado depois se confirmado.

### 2. Corrigir detecção de prédio online/offline
**Problema:** o hook `useGlobalPlaylistReport` está consultando `painels` + `paineis_status`, mas a página `/super_admin/predios` (via `useBuildingsPanelsStatus`) usa a tabela **`devices`** com `status` + `is_active=true`. Por isso a coluna de status no relatório diverge da página de prédios.

**Arquivo:** `src/hooks/useGlobalPlaylistReport.ts`
- Substituir a query de `painels` + `paineis_status` por uma única query em `devices`:
  ```ts
  supabase
    .from('devices')
    .select('id, building_id, status, last_online_at')
    .in('building_id', buildingIds)
    .eq('is_active', true)
  ```
- Reescrever o cálculo de `buildingOnline`:
  - Para cada prédio: pegar todos os `devices` daquele `building_id`.
  - `online = devices.some(d => d.status === 'online')` (mesma regra exata do `useBuildingsPanelsStatus`).
  - Sem painéis cadastrados → `online_label = 'Sem painel'` (não conta como offline para alertas).
- Atualizar `online_label`:
  - `Online` quando algum device online.
  - `Offline` quando todos offline.
  - `Sem painel` quando `devices.length === 0`.
- Ajustar o alerta `predio_offline_com_pedido` para só disparar quando o prédio TEM painéis cadastrados E todos estão offline (evita falso-positivo em prédios sem device).
- Recalcular `quantidade_telas` exibida no card a partir do `devices.length` real (mesma fonte da página de prédios), em vez de confiar no campo `quantidade_telas` da tabela `buildings` (que pode estar desatualizado).

### Escopo
- Nenhuma outra UI/funcionalidade alterada.
- Sem mudanças de schema.
- Sem mudanças nas tabelas de vídeos, KPIs, alertas (exceto a regra do alerta offline acima).
