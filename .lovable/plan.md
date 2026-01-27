
# Plano: Corrigir Edição de Data de Vencimento no Contas a Pagar

## Problema Identificado

### 1. Erro de Console (React.Fragment)
Na linha 294-306 do `EditarContaModal.tsx`, o código usa `React.Fragment` para mapear categorias, mas o sistema está passando `data-lov-id` para o Fragment (que só aceita `key` e `children`).

### 2. Data de Vencimento Não Editável
O modal atual tem limitações:

| Tipo de Despesa | Campo Atual | Problema |
|-----------------|-------------|----------|
| Fixa (mensal) | `dia_vencimento` (1-28) | Não permite alterar mês/ano específico |
| Fixa (semanal) | `data_primeiro_lancamento` | Funciona parcialmente |
| Variável | `data` | O campo existe mas pode não estar funcionando corretamente |

O usuário quer poder **alterar a data completa** (dia/mês/ano) do lançamento, não apenas o dia do mês.

---

## Solução Proposta

### Etapa 1: Corrigir o Erro de React.Fragment

Substituir `React.Fragment` por um `<div>` ou reestruturar o mapeamento de categorias para evitar o erro.

**Antes:**
```typescript
{categorias.filter(c => !c.parent_id).map(parent => (
  <React.Fragment key={parent.id}>
    <SelectItem value={parent.id}>...</SelectItem>
    {categorias.filter(...).map(child => (...))}
  </React.Fragment>
))}
```

**Depois:**
```typescript
{categorias.filter(c => !c.parent_id).flatMap(parent => [
  <SelectItem key={parent.id} value={parent.id}>...</SelectItem>,
  ...categorias
    .filter(c => c.parent_id === parent.id)
    .map(child => (
      <SelectItem key={child.id} value={child.id}>...</SelectItem>
    ))
])}
```

### Etapa 2: Adicionar Campo de Data Completa para Despesas Fixas

Para despesas fixas (não-semanais), adicionar um campo de data que permite alterar a data específica do próximo vencimento:

**Novo layout:**
```text
┌─────────────────────────────────────────────────────────────┐
│  📅 Vencimento                                              │
├─────────────────────────────────────────────────────────────┤
│  [Para despesas mensais/trimestrais/etc]                    │
│                                                             │
│  Próximo vencimento: [____10/02/2026____] (DatePicker)     │
│                                                             │
│  Ou definir dia fixo: [__10__] de cada mês                 │
│                                                             │
│  [Para despesas semanais]                                   │
│  Data de início: [____27/01/2026____]                       │
│                                                             │
│  [Para despesas variáveis]                                  │
│  Data: [____27/01/2026____]                                 │
└─────────────────────────────────────────────────────────────┘
```

### Etapa 3: Atualizar a Lógica de Salvamento

Modificar `handleSave()` para:
1. Salvar `data_primeiro_lancamento` para TODAS as despesas fixas (não só semanais)
2. Manter `dia_vencimento` como referência para recorrências futuras
3. Permitir que ambos os campos coexistam

**Lógica atualizada:**
```typescript
if (conta.tipo === 'fixa') {
  // Sempre permitir editar a data do próximo vencimento
  updateData.data_primeiro_lancamento = formData.data_proximo_vencimento || null;
  
  // Manter dia_vencimento para cálculos futuros
  if (formData.periodicidade !== 'semanal') {
    updateData.dia_vencimento = formData.dia_vencimento;
  }
}
```

### Etapa 4: Atualizar a Exibição na Lista

Em `ContasPagarPage.tsx`, ajustar o cálculo de `data_vencimento` para usar `data_primeiro_lancamento` se disponível:

```typescript
if (d.data_primeiro_lancamento) {
  // Usa data específica se definida
  dataVencimentoStr = d.data_primeiro_lancamento;
  dataVencimento = toLocalDate(d.data_primeiro_lancamento) ?? hoje;
} else if (d.dia_vencimento) {
  // Calcula baseado no dia do mês
  // ... código existente
}
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/admin/financeiro/contas-pagar/EditarContaModal.tsx` | Corrigir Fragment + adicionar campo de data completa |
| `src/pages/admin/financeiro/ContasPagarPage.tsx` | Ajustar lógica de exibição de data |

---

## Interface do Campo de Data

O novo campo usará o padrão Shadcn com DatePicker:

```typescript
<div className="space-y-2">
  <Label htmlFor="data_vencimento">Data do Vencimento</Label>
  <Popover>
    <PopoverTrigger asChild>
      <Button
        variant="outline"
        className={cn("w-full justify-start text-left font-normal bg-white")}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {formData.data_proximo_vencimento 
          ? format(toLocalDate(formData.data_proximo_vencimento), 'dd/MM/yyyy')
          : <span className="text-muted-foreground">Selecionar data</span>
        }
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-auto p-0" align="start">
      <Calendar
        mode="single"
        selected={toLocalDate(formData.data_proximo_vencimento)}
        onSelect={(date) => setFormData(prev => ({ 
          ...prev, 
          data_proximo_vencimento: date ? format(date, 'yyyy-MM-dd') : '' 
        }))}
        className="p-3 pointer-events-auto"
      />
    </PopoverContent>
  </Popover>
</div>
```

---

## Resultado Esperado

Após implementação:

1. **Erro de console resolvido** - Sem mais warnings de React.Fragment
2. **Data editável para despesas fixas** - Campo de data completa (dia/mês/ano)
3. **Dia do mês opcional** - Para quem quer definir um padrão recorrente
4. **Compatibilidade** - Mantém funcionamento para despesas semanais e variáveis
