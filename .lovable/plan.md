

# Auditoria Completa: Erro ao Salvar Rascunho

## Diagnóstico Técnico

### Causa Raiz Identificada

O erro `PGRST204: Could not find the 'buildings' column of 'proposals' in the schema cache` acontece porque a função `handleSaveDraft` (linha 1757-1872) está enviando **nomes de colunas incorretos** que não existem na tabela `proposals`.

### Comparação: Auto-Save vs handleSaveDraft

| Campo no Auto-Save (linha 917) | Campo no handleSaveDraft (linha 1790) | Coluna Real no Banco |
|--------------------------------|---------------------------------------|----------------------|
| `selected_buildings` | `buildings` | `selected_buildings` |
| `total_panels` | `buildings_count` | **NÃO EXISTE** |
| `total_impressions_month` | **AUSENTE** | `total_impressions_month` |
| `fidel_monthly_value` | `monthly_value` | `fidel_monthly_value` |
| `cash_total_value` | `total_value` | `cash_total_value` |
| `cobranca_futura` | **AUSENTE** | `cobranca_futura` |
| `exigir_contrato` | **AUSENTE** | `exigir_contrato` |

### Problema Principal

A função `handleSaveDraft` foi escrita com **nomes de campos inventados** (alucinação) que não correspondem ao schema real da tabela `proposals`. O auto-save (linha 902-967) usa os nomes corretos, mas alguém criou uma **segunda função de salvamento** (handleSaveDraft) que não segue o mesmo padrão.

---

## Campos Errados que Precisam ser Corrigidos

### Na função handleSaveDraft (linhas 1777-1829):

```text
ERRADO                           →  CORRETO
─────────────────────────────────────────────────────────
buildings:                       →  selected_buildings:
buildings_count:                 →  (REMOVER - não existe)
monthly_value:                   →  fidel_monthly_value:
total_value:                     →  cash_total_value:
duration_months: isCustomDays?1  →  duration_months: isCustomDays?0
duration_days:                   →  custom_days:
(falta is_custom_days)           →  is_custom_days: isCustomDays
(falta payment_type)             →  payment_type: ...
(falta total_panels)             →  total_panels: ...
(falta total_impressions_month)  →  total_impressions_month: ...
(falta cobranca_futura)          →  cobranca_futura: ...
(falta exigir_contrato)          →  exigir_contrato: ...
(falta exclusividade_valor_extra)→  (usar nome correto)
oferecer_exclusividade:          →  exclusividade_segmento:
```

---

## Correção Necessária

### Reescrever o objeto `draftData` na função handleSaveDraft

Precisa ser **idêntico** ao formato usado no auto-save (linhas 902-967), garantindo que:
1. Todos os nomes de colunas correspondem ao schema real
2. Não há campos inventados
3. Todos os campos necessários estão presentes

### Estrutura Correta do draftData

```tsx
const draftData = {
  status: 'rascunho',
  // Cliente
  client_name: `${clientData.firstName} ${clientData.lastName}`.trim() || 'Rascunho',
  client_first_name: clientData.firstName || null,
  client_last_name: clientData.lastName || null,
  client_company_name: clientData.companyName || null,
  client_country: clientData.country || 'BR',
  client_cnpj: clientData.document || null,
  client_email: clientData.email || null,
  client_phone: clientData.phoneFullNumber || clientData.phone || null,
  client_address: clientData.address || null,
  client_latitude: clientData.latitude || null,
  client_longitude: clientData.longitude || null,
  client_logo_url: clientLogoUrl || null,
  
  // Prédios - NOME CORRETO
  selected_buildings: buildingsData as Json,
  total_panels: totalPanels,
  total_impressions_month: totalImpressionsAdjusted,
  
  // Período e pagamento - NOMES CORRETOS
  duration_months: isCustomDays ? 0 : durationMonths,
  fidel_monthly_value: modalidadeProposta === 'permuta' ? 0 : (parseFloat(fidelValue) || 0),
  cash_total_value: modalidadeProposta === 'permuta' ? 0 : (isCustomPayment ? customTotal : cashTotal),
  discount_percent: discountPercent,
  payment_type: isCustomDays ? 'days' : isCustomPayment ? 'custom' : 'standard',
  is_custom_days: isCustomDays,
  custom_days: isCustomDays ? customDays : null,
  custom_installments: isCustomPayment ? customInstallments.map((p, idx) => ({
    installment: idx + 1,
    due_date: formatDateForInput(p.dueDate),
    amount: parseFloat(p.amount) || 0
  })) as Json : null,
  
  // Produto
  tipo_produto: tipoProduto,
  quantidade_posicoes: quantidadePosicoes,
  titulo: tituloProposta || null,
  
  // Permuta - campos corretos
  modalidade_proposta: modalidadeProposta,
  itens_permuta: modalidadeProposta === 'permuta' ? itensPermuta as Json : [],
  valor_total_permuta: modalidadeProposta === 'permuta' ? valorTotalPermuta : 0,
  ocultar_valores_publico: modalidadeProposta === 'permuta' ? ocultarValoresPublico : false,
  descricao_contrapartida: modalidadeProposta === 'permuta' ? descricaoContrapartida : null,
  metodo_pagamento_alternativo: modalidadeProposta === 'permuta' ? 'permuta' : null,
  valor_referencia_monetaria: modalidadeProposta === 'permuta' ? valorReferenciaMonetaria : null,
  
  // Configurações adicionais
  cobranca_futura: cobrancaFutura,
  exigir_contrato: exigirContrato,
  venda_futura: vendaFutura,
  predios_contratados: vendaFutura ? prediosContratados : selectedBuildingsData.length,
  
  // Exclusividade - NOME CORRETO
  exclusividade_segmento: oferecerExclusividade,
  segmento_exclusivo: oferecerExclusividade ? segmentoExclusivo : null,
  exclusividade_percentual: oferecerExclusividade ? exclusividadePercentual : null,
  
  // Travamento
  travamento_preco_ativo: travamentoPrecoAtivo,
  travamento_preco_valor: travamentoPrecoAtivo ? travamentoPrecoValor : null,
  travamento_telas_limite: travamentoPrecoAtivo ? travamentoTelasLimite : null,
  
  // Multa
  multa_rescisao_ativa: multaRescisaoAtiva,
  multa_rescisao_percentual: multaRescisaoAtiva ? multaRescisaoPercentual : null,
  
  // CC Emails
  cc_emails: ccEmails.length > 0 ? ccEmails : null,
  
  // Validade
  expires_at: validityHours === 0 ? null : validityHours === -1 && customDateRange?.to 
    ? customDateRange.to.toISOString() 
    : new Date(Date.now() + validityHours * 60 * 60 * 1000).toISOString(),
};
```

---

## Arquivo a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/admin/proposals/NovaPropostaPage.tsx` | Reescrever o objeto `draftData` dentro de `handleSaveDraft` (linhas 1777-1829) usando os nomes de colunas corretos, idênticos ao auto-save |

---

## Resumo das Correções

### Campos para RENOMEAR:
- `buildings` → `selected_buildings`
- `monthly_value` → `fidel_monthly_value`
- `total_value` → `cash_total_value`
- `duration_days` → `custom_days`
- `oferecer_exclusividade` → `exclusividade_segmento`

### Campos para REMOVER (não existem no banco):
- `buildings_count`

### Campos para ADICIONAR:
- `total_panels`
- `total_impressions_month`
- `payment_type`
- `is_custom_days`
- `cobranca_futura`
- `exigir_contrato`
- `valor_total_permuta`

---

## Checklist de Implementação

### NovaPropostaPage.tsx (função handleSaveDraft)
- [ ] Renomear `buildings` para `selected_buildings`
- [ ] Remover campo `buildings_count`
- [ ] Renomear `monthly_value` para `fidel_monthly_value`
- [ ] Renomear `total_value` para `cash_total_value`
- [ ] Renomear `duration_days` para `custom_days`
- [ ] Adicionar `is_custom_days: isCustomDays`
- [ ] Adicionar `payment_type`
- [ ] Adicionar `total_panels` e `total_impressions_month`
- [ ] Adicionar `cobranca_futura` e `exigir_contrato`
- [ ] Adicionar `valor_total_permuta`
- [ ] Renomear `oferecer_exclusividade` para `exclusividade_segmento`
- [ ] Garantir formato de `custom_installments` igual ao auto-save

### Testes
- [ ] Criar nova proposta → Clicar "Salvar Rascunho" → Verificar que salva sem erro
- [ ] Editar rascunho existente → Clicar "Salvar Rascunho" → Verificar que atualiza sem erro
- [ ] Verificar que auto-save continua funcionando
- [ ] Verificar que "Publicar" continua funcionando

