

# Corrigir Exibicao de Dias no Card e Detalhes + Aumentar Logo

## Problemas Identificados

1. **Card na listagem (PropostasPage.tsx, linha 1208)**: Mostra `0M` quando a proposta usa "Periodo em Dias" (`is_custom_days = true`). O codigo atual sempre exibe `{proposal.duration_months}M` sem verificar se e periodo personalizado em dias.

2. **Detalhes (PropostaDetalhesPage.tsx, linha 673)**: Mostra "Total em 0 meses" quando `is_custom_days = true`, pois `duration_months` pode ser 0 nesse caso.

3. **Logo no card**: Atualmente `w-8 h-8` (32x32px) -- usuario pede para aumentar.

## Solucao

### 1. Card da listagem - Badge de duracao (PropostasPage.tsx, linha 1208)

**Antes:** `{proposal.duration_months}M`

**Depois:** Verificar `is_custom_days`:
- Se `is_custom_days === true` e `custom_days > 0`: mostrar `{custom_days}d` (ex: "15d")
- Caso contrario: manter `{duration_months}M` (ex: "12M")

### 2. Detalhes - Texto "Total em X meses" (PropostaDetalhesPage.tsx, linha 673)

**Antes:** `Total em {proposal.duration_months} meses`

**Depois:** Verificar `is_custom_days`:
- Se `is_custom_days === true`: mostrar `Total em {custom_days} dias`
- Caso contrario: manter `Total em {duration_months} meses`

### 3. Logo maior no card (PropostasPage.tsx, linha 128)

**Antes:** `w-8 h-8` (32x32px)

**Depois:** `w-10 h-10` (40x40px) -- aumento de 25%, mantendo proporcoes e estilos

## Arquivos Alterados

- `src/pages/admin/proposals/PropostasPage.tsx` -- linhas 128 e 1208
- `src/pages/admin/proposals/PropostaDetalhesPage.tsx` -- linha 673

Nenhuma outra funcionalidade sera alterada.

