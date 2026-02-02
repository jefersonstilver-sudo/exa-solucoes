
# Plano: Botão "Copiar Texto da Proposta" para Validação

## Objetivo
Adicionar um botão ao lado dos botões de Visualização e Enviar que copie TODOS os dados da proposta em formato texto legível, permitindo validação completa contra a proposta real.

## Localização
Arquivo: `src/pages/admin/proposals/NovaPropostaPage.tsx`
Linha: ~3086-3095 (área dos botões no footer fixo)

## Implementação

### 1. Adicionar ícone de cópia (import)
Adicionar `Copy` aos imports do lucide-react (linha 4).

### 2. Criar função `handleCopyProposalText`
Função que monta uma string completa e legível com TODOS os campos da proposta:

```text
═══════════════════════════════════════════════════
           PROPOSTA EXA - VALIDAÇÃO COMPLETA
═══════════════════════════════════════════════════

📋 DADOS DO CLIENTE
────────────────────────────────────────────────────
• Nome: João Silva
• Empresa: Empresa LTDA
• País: Brasil
• CNPJ: 12.345.678/0001-90
• Telefone: +55 11 99999-9999
• E-mail: joao@empresa.com
• Endereço: Rua das Flores, 123

🏢 PRÉDIOS SELECIONADOS (3 prédios)
────────────────────────────────────────────────────
1. Edifício Aurora
   • Bairro: Centro
   • Telas: 4
   • Exibições/mês: 46.440

2. Edifício Sol Nascente *
   • Bairro: Manual
   • Telas: 2
   • Exibições/mês: 23.220

TOTAIS:
• Total de Telas: 6
• Exibições Mensais: 69.660
• Público Estimado: 1.200 pessoas

📦 PRODUTO
────────────────────────────────────────────────────
• Tipo: Vertical Premium / Horizontal
• Posições (Marcas): 1

⏱️ PERÍODO
────────────────────────────────────────────────────
• Duração: 12 meses
• Tipo: Padrão / Período em Dias (15 dias) / Personalizado

💰 PAGAMENTO [MONETÁRIO]
────────────────────────────────────────────────────
• Valor Mensal (Fidelidade): R$ 1.500,00
• Desconto à Vista: 10%
• Total à Vista: R$ 16.200,00
• Valor Sugerido (base): R$ 1.200,00/mês

[OU SE PERMUTA]

💱 PERMUTA
────────────────────────────────────────────────────
• Modalidade: Permuta
• Ocultar valores no público: Sim/Não
• Descrição da Contrapartida: ...

Itens de Permuta:
1. Produto ABC (Qtd: 10) - R$ 100,00 cada = R$ 1.000,00
2. Serviço XYZ (Qtd: 1) - R$ 5.000,00

Valor Total Permuta: R$ 6.000,00

📊 CONDIÇÕES COMERCIAIS
────────────────────────────────────────────────────
🚀 Venda Futura: ATIVO
   • Prédios Contratados: 50
   • Telas Estimadas: 67

🔒 Exclusividade de Segmento: ATIVO
   • Segmento: Restaurantes
   • Acréscimo: 35%
   • Valor Extra: R$ 5.670,00

📌 Travamento de Preço: ATIVO
   • Valor por Tela: R$ 250,00
   • Limite de Telas: 50

⚖️ Multa de Rescisão: ATIVO
   • Percentual: 20%

⏳ VALIDADE
────────────────────────────────────────────────────
• Prazo: 24 horas / 72 horas / 7 dias / Personalizado / Indeterminada
• Expira em: 15/01/2025 às 18:00

📝 CONFIGURAÇÕES ADICIONAIS
────────────────────────────────────────────────────
• Título da Proposta: "Proposta Especial 2025"
• Exigir Contrato: Sim/Não
• Cobrança Futura: Sim/Não
• E-mails em Cópia (CC): email1@test.com, email2@test.com

👤 VENDEDOR
────────────────────────────────────────────────────
• Nome: Maria Vendedora
• E-mail: maria@exa.com.br
• Telefone: +55 11 98888-8888

═══════════════════════════════════════════════════
      Gerado em: 15/01/2025 às 14:30:00
═══════════════════════════════════════════════════
```

### 3. Adicionar botão no footer
Inserir entre o botão de Preview (Eye) e o botão de Enviar:

```tsx
{/* Botão Copiar Texto da Proposta */}
<Button 
  variant="outline" 
  onClick={handleCopyProposalText} 
  disabled={selectedBuildings.length === 0}
  className="h-11 px-3 border-blue-200 text-blue-600 hover:bg-blue-50"
  title="Copiar texto completo da proposta"
>
  <Copy className="h-4 w-4" />
</Button>
```

### 4. Feedback visual
Usar `toast.success('Texto da proposta copiado!')` após copiar para clipboard.

## Campos Incluídos (checklist completo)

| Seção | Campos |
|-------|--------|
| Cliente | firstName, lastName, companyName, country, document, phone, email, address |
| Prédios | Lista completa com nome, bairro, telas, exibições + indicador de manual (*) |
| Totais | totalPanels, totalImpressionsAdjusted, totalPublico |
| Produto | tipoProduto, quantidadePosicoes |
| Período | durationMonths, isCustomDays, customDays, isCustomPayment |
| Pagamento | fidelValue, discountPercent, cashTotal, valorSugeridoMensal |
| Parcelas Custom | customInstallments (data + valor de cada) |
| Permuta | modalidadeProposta, itensPermuta, valorTotalPermuta, ocultarValoresPublico, descricaoContrapartida |
| Venda Futura | vendaFutura, prediosContratados, telasContratadas |
| Exclusividade | oferecerExclusividade, segmentoExclusivo, exclusividadePercentual, exclusividadeValorCalculado |
| Travamento | travamentoPrecoAtivo, travamentoPrecoValor, travamentoTelasLimite, travamentoModoCalculo |
| Multa | multaRescisaoAtiva, multaRescisaoPercentual |
| Validade | validityHours, customDateRange, expires_at calculado |
| Extras | tituloProposta, ccEmails, exigirContrato, cobrancaFutura |
| Vendedor | selectedSeller.nome, selectedSeller.email, selectedSeller.telefone |

## Notas técnicas
- Usar `navigator.clipboard.writeText()` para copiar
- Formatar valores monetários com `toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })`
- Formatar datas com `format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })`
- Indicar prédios manuais com asterisco (*)
- Mostrar apenas seções relevantes (ex: se não for permuta, não mostrar seção de permuta)
