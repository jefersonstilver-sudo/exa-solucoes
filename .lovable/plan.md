

# Painéis Silenciosos — Silenciar Notificações WhatsApp por Dispositivo

## Contexto
Já existe a tabela `device_alert_configs` com o campo `alerts_enabled` (boolean), e a edge function `monitor-panels` já ignora devices com `alerts_enabled = false`. Falta apenas a **interface** para gerenciar isso dentro do card "Alerta Painel Offline".

## O que será feito

Adicionar uma nova seção colapsável **"Painéis Silenciados"** dentro do `AlertaPainelOfflineCard.tsx`, abaixo das regras e destinatários. Essa seção:

1. **Lista os painéis atualmente silenciados** (onde `alerts_enabled = false` na `device_alert_configs`)
2. **Botão "+" abre um Dialog** com a lista de todos os devices ativos, permitindo selecionar um ou mais painéis para silenciar (multi-select com checkboxes)
3. **Permite remover o silêncio** clicando no X ao lado de cada painel silenciado
4. Os painéis silenciados continuam aparecendo normalmente no monitor interno e no `/monitor` público — apenas as notificações WhatsApp são suprimidas

## Arquivos a modificar

### `src/modules/monitoramento-ia/components/exa-alerts/AlertaPainelOfflineCard.tsx`
- Adicionar estado: `silencedDevices`, `allDevices`, `showSilenceDialog`, `selectedToSilence`
- No `loadData()`: buscar `device_alert_configs` onde `alerts_enabled = false` + join com `devices` para nome
- Buscar todos os devices ativos para o dialog de seleção
- Nova seção colapsável "Painéis Silenciados" com ícone `VolumeX`:
  - Lista de painéis silenciados com badge e botão de remover
  - Botão "+" para abrir dialog
- Dialog de seleção:
  - Lista de devices com checkbox, nome e condomínio
  - Busca/filtro por texto
  - Botão "Silenciar Selecionados"
  - Ao confirmar: faz upsert em `device_alert_configs` com `alerts_enabled: false`
- Ao remover silêncio: atualiza `alerts_enabled: true` na `device_alert_configs`

## Impacto
- Apenas o componente `AlertaPainelOfflineCard.tsx` será modificado
- Nenhuma migration necessária (tabela já existe)
- A edge function já respeita o `alerts_enabled` — zero alteração no backend

