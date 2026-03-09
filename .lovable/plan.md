

# Correção: Badges de Incidente nos Cards da Página de Painéis e Tela Cheia

## Problema
Os badges "⚠ Sem causa" e "📋 Causa definida" foram implementados apenas no `ComputerCard.tsx` (componente dark theme não utilizado na página principal). Os componentes reais — `PanelCard.tsx` (cards normais) e `MonitorCard` dentro de `FullscreenMonitor.tsx` (tela cheia) — não têm nenhum indicador de incidente. Além disso, os dados de incidentes pendentes não são carregados junto com os devices.

## Solução

### 1. Criar hook leve para buscar status de incidentes em lote
**`src/modules/monitoramento-ia/hooks/useDeviceIncidentStatus.ts`** — Novo hook que busca de `device_offline_incidents` o status de todos os devices offline de uma vez (não por device individual). Retorna um `Map<deviceId, 'pendente' | 'causa_registrada' | null>`.

### 2. Adicionar badge no `PanelCard.tsx`
- Receber prop `incidentStatus?: 'pendente' | 'causa_registrada' | null`
- Quando `pendente`: badge vermelho piscante "⚠ Sem causa" na área de badges (junto com eventos, prédio, elevador)
- Quando `causa_registrada`: badge amarelo estático "📋 Causa definida"
- Só aparece para devices offline

### 3. Adicionar badge no `FullscreenMonitor.tsx` → `MonitorCard`
- Receber `incidentStatus` prop
- Quando `pendente`: ícone `AlertTriangle` piscante no footer, ao lado do status offline
- Quando `causa_registrada`: ícone `CheckCircle` amarelo discreto

### 4. Integrar no `Paineis.tsx`
- Importar `useDeviceIncidentStatus` com os IDs dos devices offline
- Passar `incidentStatus` para cada `PanelCard`
- Passar para `FullscreenMonitor` (que repassa para `MonitorCard`)

## Arquivos

| Arquivo | Ação |
|---------|------|
| `hooks/useDeviceIncidentStatus.ts` | Criar — busca batch de status de incidentes |
| `components/PanelCard.tsx` | Modificar — adicionar badge de incidente |
| `components/FullscreenMonitor.tsx` | Modificar — adicionar indicador no MonitorCard |
| `pages/Paineis.tsx` | Modificar — integrar hook e passar props |

