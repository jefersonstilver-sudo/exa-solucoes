

# Reconstruir Filtro de Período e Exibição de Datas

## Problemas Identificados

### 1. PeriodFilter com trigger invisível
O componente `PeriodFilter.tsx` usa um `<div />` vazio como `PopoverTrigger` para o calendário personalizado (linha 92-93). Isso é hacky e pode falhar — o popover não tem elemento visual para ancorar. O fluxo depende de estado (`isCustomOpen`) setado a partir do dropdown, o que é frágil.

### 2. Datas no CampaignReportCard mostram o contrato inteiro
A linha 151 mostra `dataInicio → dataFim` do pedido (ex: "30 mar 2026 → 30 mar 2027"), mas o "dias ativos" ao lado é calculado com base no filtro de período (15 dias). Isso confunde — o usuário vê 1 ano de contrato mas "15 dias ativos".

### 3. O filtro "Hoje" calcula `subDays(0)` = mesma data
Na PeriodFilter, "Hoje" usa `days: 0`, então `start = end = new Date()`. Isso pode causar 0 dias ativos.

## Solução

### Arquivo 1: `src/components/advertiser/PeriodFilter.tsx` — Reconstruir
Substituir a abordagem DropdownMenu + Popover separado por um componente unificado usando apenas `Popover` com calendários integrados:

- Botão principal mostra o período selecionado (ex: "Últimos 30 dias" ou "01/04 - 15/04")
- Ao clicar, abre popover com:
  - Botões rápidos: Hoje, 7 dias, 15 dias, 30 dias
  - Seção de período personalizado com dois calendários (início/fim) lado a lado
  - Botão "Aplicar" para o período personalizado
- "Hoje" corrigido para usar `startOfDay` até `endOfDay`
- Design alinhado com EXA (vermelho `#9C1E1E`, sem componentes verdes)

### Arquivo 2: `src/components/advertiser/CampaignReportCard.tsx` — Corrigir exibição de datas
- Linha 148-157: Mostrar **duas informações** separadas:
  - "Contrato: 30/03/2026 → 30/03/2027" — período do contrato completo
  - "Período analisado: X dias" — refletindo o filtro selecionado
- Isso elimina a confusão entre o contrato e o período filtrado

### Arquivo 3: `src/hooks/useVideoReportData.ts` — Ajuste menor
- Garantir que `diasAtivos` nunca seja 0 quando `filteredStart === filteredEnd` (caso "Hoje") — usar `Math.max(1, ...)` para pelo menos 1 dia

## Detalhes Técnicos

### Nova estrutura do PeriodFilter
```text
Popover
├── Trigger: Button com ícone Calendar + label
└── Content
    ├── Botões rápidos (Hoje, 7d, 15d, 30d)
    ├── Separador
    ├── Calendário Início + Calendário Fim (lado a lado)
    └── Botão "Aplicar" (desabilitado sem ambas datas)
```

### Impacto
- 3 arquivos modificados
- Nenhuma migration
- Nenhuma mudança em funcionalidades existentes fora do relatório

