
# Plano: Correções no Módulo de Permuta

## Problemas a Corrigir

### 1. Valor de Referência não salvo no Rascunho
O campo `valor_referencia_monetaria` não está sendo incluído no auto-save de rascunho, fazendo com que o valor seja perdido se o usuário não enviar a proposta imediatamente.

### 2. Texto Copiado incompleto
A função `handleCopyProposalText` não inclui o "Valor de Referência Monetária" na seção de permuta, então o texto copiado não mostra "quanto custaria se fosse comprar".

### 3. Proposta existente sem dados
A proposta `fc269217...` foi criada antes da implementação, então não tem `valor_referencia_monetaria` preenchido. É necessário editar e resalvar.

---

## Correções Técnicas

### Arquivo: `src/pages/admin/proposals/NovaPropostaPage.tsx`

#### Correção 1: Adicionar `valor_referencia_monetaria` ao rascunho automático

Localização: Linhas 900-952 (função de auto-save)

Adicionar o campo no objeto `draftData`:

```typescript
// Na linha ~929, após descricao_contrapartida
descricao_contrapartida: modalidadeProposta === 'permuta' ? descricaoContrapartida : null,
metodo_pagamento_alternativo: modalidadeProposta === 'permuta' ? 'permuta' : null,
valor_referencia_monetaria: modalidadeProposta === 'permuta' ? valorReferenciaMonetaria : null, // ADICIONAR
```

Também adicionar na lista de dependências do useEffect (linha ~993):

```typescript
modalidadeProposta, itensPermuta, valorTotalPermuta, ocultarValoresPublico,
descricaoContrapartida, metodoPagamentoAlternativo, valorReferenciaMonetaria, // ADICIONAR
```

#### Correção 2: Incluir Valor de Referência no texto copiado

Localização: Linhas 1240-1257 (seção de permuta no handleCopyProposalText)

Atualizar para incluir o valor de referência:

```typescript
if (modalidadeProposta === 'permuta') {
  text += `
💱 PERMUTA
────────────────────────────────────────────────────
• Modalidade: Permuta (não-monetária)
`;
  
  // NOVO: Mostrar valor de referência monetária
  if (valorReferenciaMonetaria > 0) {
    const periodoMeses = isCustomDays ? Math.ceil(customDays / 30) : durationMonths;
    const totalReferencia = isCustomDays 
      ? (valorReferenciaMonetaria / 30) * customDays 
      : valorReferenciaMonetaria * durationMonths;
    text += `
💰 VALOR DE REFERÊNCIA (Quanto Custaria em Dinheiro)
• Valor Mensal: ${formatCurrency(valorReferenciaMonetaria)}
• Total (${isCustomDays ? customDays + ' dias' : durationMonths + ' meses'}): ${formatCurrency(totalReferencia)}
`;
  }
  
  text += `
📦 CONTRAPARTIDA (Equipamentos/Serviços)
• Ocultar valores no público: ${ocultarValoresPublico ? 'Sim' : 'Não'}
• Descrição: ${descricaoContrapartida || '(não informada)'}

Itens de Permuta:
`;
  itensPermuta.forEach((item, index) => {
    text += `${index + 1}. ${item.nome} (Qtd: ${item.quantidade})${!item.ocultar_preco ? ` - ${formatCurrency(item.preco_unitario)} cada = ${formatCurrency(item.preco_total)}` : ''}
`;
  });
  text += `
Valor Total Permuta: ${formatCurrency(valorTotalPermuta)}

`;
}
```

---

## Resultado Esperado

### Texto Copiado (Antes)
```
💱 PERMUTA
────────────────────────────────────────────────────
• Modalidade: Permuta (não-monetária)
• Ocultar valores no público: Sim
• Descrição da Contrapartida: (não informada)

Itens de Permuta:
1. Tablet Android 24" Touchscreen (Qtd: 90) - R$ 1.500,00 cada = R$ 135.000,00

Valor Total Permuta: R$ 135.000,00
```

### Texto Copiado (Depois)
```
💱 PERMUTA
────────────────────────────────────────────────────
• Modalidade: Permuta (não-monetária)

💰 VALOR DE REFERÊNCIA (Quanto Custaria em Dinheiro)
• Valor Mensal: R$ 1.500,00
• Total (12 meses): R$ 18.000,00

📦 CONTRAPARTIDA (Equipamentos/Serviços)
• Ocultar valores no público: Sim
• Descrição: (não informada)

Itens de Permuta:
1. Tablet Android 24" Touchscreen (Qtd: 90) - R$ 1.500,00 cada = R$ 135.000,00

Valor Total Permuta: R$ 135.000,00
```

---

## Para a Proposta Existente

Para a proposta `fc269217-3465-4ab4-a952-f079d1122a31` que já existe:
1. Acessar modo edição: `/propostas/fc269217-3465-4ab4-a952-f079d1122a31/editar`
2. Preencher o campo "Valor de Referência"
3. Reenviar a proposta

Ou posso atualizar diretamente no banco de dados se preferir.

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/admin/proposals/NovaPropostaPage.tsx` | Adicionar `valor_referencia_monetaria` ao rascunho + melhorar texto copiado |

---

## Checklist

- [ ] Adicionar `valor_referencia_monetaria` ao objeto draftData (auto-save)
- [ ] Adicionar `valorReferenciaMonetaria` às dependências do useEffect de auto-save
- [ ] Atualizar `handleCopyProposalText` para incluir valor de referência na seção de permuta
- [ ] Testar: criar nova proposta de permuta → copiar texto → verificar se mostra valor de referência
- [ ] Testar: editar proposta existente → preencher valor de referência → ver página pública
