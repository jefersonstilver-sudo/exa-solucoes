
# Plano: Mostrar Valor Monetário de Referência em Propostas de Permuta

## Contexto do Problema

Atualmente, quando uma proposta é configurada como **Permuta**, o sistema:
- ❌ Zera o `fidel_monthly_value` (linha 906 do NovaPropostaPage)
- ❌ Não mostra na proposta pública quanto custaria monetariamente
- ❌ O PDF mostra R$ 0,00 nos planos de pagamento

**O que você precisa:**
- ✅ Mostrar o valor que custaria se fosse comprar (referência monetária)
- ✅ Mostrar que o cliente pode pagar em permuta com os equipamentos
- ✅ Manter o controle de visibilidade dos valores dos equipamentos

---

## Solução Proposta

### 1. Novo Campo: Valor de Referência Monetária

Adicionar campo `valor_referencia_monetaria` que será preenchido mesmo em propostas de permuta para mostrar "quanto custaria se fosse comprar".

### 2. Alterações no Admin (NovaPropostaPage.tsx)

**a) Novo estado:**
```typescript
const [valorReferencia, setValorReferencia] = useState<number>(0);
```

**b) Na seção de permuta, MANTER o campo de valor mensal visível:**
- Ao invés de ocultar os campos monetários quando `modalidadeProposta === 'permuta'`
- Mostrar um campo "Valor de Referência (quanto custaria se fosse comprar)"
- Este valor será usado para mostrar ao cliente a economia/benefício da permuta

**c) Salvar no banco:**
```typescript
// No objeto de envio
valor_referencia_monetaria: modalidadeProposta === 'permuta' ? valorReferencia : null,
```

### 3. Alterações na Página Pública (PropostaPublicaPage.tsx)

Na seção de permuta, adicionar ANTES dos equipamentos:

```text
┌─────────────────────────────────────────────────────┐
│ 💰 VALOR DO PACOTE                                  │
│                                                     │
│ Este pacote de mídia tem valor de mercado de:      │
│           R$ 18.000,00                             │
│           (12x de R$ 1.500,00)                     │
│                                                     │
├─────────────────────────────────────────────────────┤
│ 🔄 ACORDO DE PERMUTA                                │
│                                                     │
│ Em vez do pagamento monetário, esta proposta        │
│ oferece a seguinte condição de parceria:            │
│                                                     │
│ 📦 Contrapartida Acordada:                          │
│ 1. Tablet Android 24" (90x) ........... R$ 135.000 │
│                                                     │
│ 🤝 Acordo de Parceria                               │
└─────────────────────────────────────────────────────┘
```

### 4. Alterações no PDF (ProposalPDFExporter.tsx)

Adicionar à interface `ProposalData`:
```typescript
modalidade_proposta?: 'monetaria' | 'permuta' | null;
itens_permuta?: Array<{...}> | null;
valor_referencia_monetaria?: number | null;
ocultar_valores_publico?: boolean | null;
```

No método `generateProposalPDF`, verificar modalidade:
```typescript
if (proposal.modalidade_proposta === 'permuta') {
  this.drawPermutaSection(proposal);
} else {
  this.drawCommercialConditions(proposal, isCortesia, baseTotalValue);
}
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/admin/proposals/NovaPropostaPage.tsx` | Adicionar campo `valorReferencia` + manter visível quando permuta + salvar no banco |
| `src/pages/public/PropostaPublicaPage.tsx` | Mostrar "Valor do Pacote" antes da seção de permuta |
| `src/components/admin/proposals/ProposalPDFExporter.tsx` | Adicionar seção de permuta no PDF |
| **Banco de Dados** | Adicionar coluna `valor_referencia_monetaria` na tabela `proposals` (se ainda não existir) |

---

## Detalhes Técnicos

### Interface Visual Admin

Na seção de Período e Valores, quando `modalidadeProposta === 'permuta'`:

```text
┌─ Período e Valores ─────────────────────────────────┐
│                                                     │
│ [Monetária]  [Permuta ✓]                            │
│                                                     │
│ ┌─ Valor de Referência ────────────────────────────┐│
│ │ 💡 Informe quanto custaria este pacote se fosse  ││
│ │    uma proposta monetária (usado como referência)││
│ │                                                  ││
│ │ Valor Mensal: R$ [1.500,00]                      ││
│ │                                                  ││
│ │ Total em 12 meses: R$ 18.000,00                  ││
│ └──────────────────────────────────────────────────┘│
│                                                     │
│ ┌─ Equipamentos Ofertados (Permuta) ───────────────┐│
│ │ ...lista de equipamentos...                      ││
│ └──────────────────────────────────────────────────┘│
│                                                     │
│ Período: [3] [6] [12] [24] [Dias]                   │
└─────────────────────────────────────────────────────┘
```

### Interface Visual Página Pública

```text
┌─ Valor do Pacote ───────────────────────────────────┐
│ 💰 Este pacote de mídia tem valor de:               │
│                                                     │
│     R$ 18.000,00                                    │
│     (12x de R$ 1.500,00/mês)                        │
│                                                     │
│ 📊 Cobertura: 100 telas | 1.161.000 exibições/mês   │
└─────────────────────────────────────────────────────┘

┌─ Acordo de Permuta ─────────────────────────────────┐
│ 🤝 Proposta de Parceria                             │
│                                                     │
│ Em vez do pagamento monetário, esta proposta        │
│ oferece a seguinte condição de troca:               │
│                                                     │
│ 📦 Contrapartida:                                   │
│ 1. Tablet Android 24" Touchscreen (90x)             │
│    Valor: R$ 135.000,00                             │
│                                                     │
│ 📅 Período: 12 meses                                │
│                                                     │
│        [🤝 Acordo de Parceria]                      │
└─────────────────────────────────────────────────────┘
```

---

## Fluxo Completo

```text
ADMIN                           BANCO                    PÚBLICO/PDF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Seleciona Permuta ────────────────────────────────────────────────
   
2. Preenche "Valor de 
   Referência" (R$ 1.500/mês)   ──► valor_referencia_monetaria
   
3. Adiciona Equipamentos       ──► itens_permuta[]
   (90x Tablet = R$ 135.000)
   
4. Seleciona período (12 meses) ──► duration_months
   
5. Toggle "Ocultar valores"    ──► ocultar_valores_publico
   (por item ou global)

6. Envia proposta ──────────────►  Salva no banco ──────────────────►
                                                    
                                   Página Pública exibe:
                                   - "Valor do Pacote: R$ 18.000"
                                   - "Acordo de Permuta"
                                   - Lista de equipamentos
                                   
                                   PDF exibe a mesma estrutura
```

---

## Checklist de Implementação

- [ ] Verificar se coluna `valor_referencia_monetaria` existe no banco
- [ ] Adicionar estado `valorReferencia` no NovaPropostaPage
- [ ] Mostrar campo de valor de referência quando `modalidadeProposta === 'permuta'`
- [ ] Salvar `valor_referencia_monetaria` no envio da proposta
- [ ] Carregar `valor_referencia_monetaria` no modo edição
- [ ] Atualizar PropostaPublicaPage para exibir "Valor do Pacote" antes de permuta
- [ ] Atualizar ProposalPDFExporter para renderizar seção de permuta
- [ ] Atualizar função `handleCopyProposalText` para incluir valor de referência
- [ ] Testar fluxo completo: criar permuta → ver pública → baixar PDF

