
# Diagnóstico: Seletor de Posições Não Aparece em Modo de Edição

## Análise Completa

Após análise detalhada do código, banco de dados e logs, confirmei que:

1. ✅ **O código está correto** - A seção de "Quantidade de Posições (Marcas)" está posicionada corretamente após a seleção de prédios (linha 2536)
2. ✅ **A condição está correta** - Apenas `selectedBuildings.length > 0` (sem restrição de produto)
3. ✅ **Os dados estão salvos** - A proposta tem 17 prédios e `quantidade_posicoes = 1` no banco
4. ✅ **A hidratação acontece** - O log "📝 Carregando dados da proposta" aparece

## Problema Identificado

O problema é uma **condição de corrida (race condition)** entre:
- O reset de `selectedBuildings` para `[]` (linha 506)
- A hidratação que popula os prédios novamente (linha 589)

Durante um breve momento entre o reset e a hidratação, `selectedBuildings.length === 0`, o que pode fazer a seção não aparecer.

Além disso, quando você está scrollando a página, a seção **pode estar presente mas fora da área visível**.

## Solução Proposta

### Mudança 1: Adicionar indicador visual de carregamento

Mostrar a seção de posições em estado de "loading" enquanto os prédios estão sendo carregados, para garantir que ela sempre apareça após os prédios:

```tsx
{/* Quantidade de Posições - Sempre visível em modo edição com loading state */}
{(selectedBuildings.length > 0 || (isEditMode && !dataLoaded)) && (
  <Card className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
    {(!dataLoaded && isEditMode) ? (
      <div className="flex items-center gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Carregando posições...</span>
      </div>
    ) : (
      <>
        {/* Conteúdo normal do seletor de posições */}
      </>
    )}
  </Card>
)}
```

### Mudança 2: Forçar re-render após hidratação

Adicionar um `console.log` de debug e garantir que a hidratação está atualizando o estado corretamente:

```tsx
// Após setSelectedBuildings na hidratação
console.log('🏢 Prédios carregados para edição:', buildingIds.length, buildingIds);
```

### Mudança 3: Garantir scroll correto

A seção de posições está **logo após os prédios** - verifique se você está scrollando até ela. A ordem é:
1. Dados do Cliente
2. **Prédios** (com a lista)
3. **Quantidade de Posições (Marcas)** ← Logo abaixo
4. Venda Futura
5. Período e Valores

---

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `NovaPropostaPage.tsx` | Adicionar loading state para seção de posições |
| `NovaPropostaPage.tsx` | Adicionar console.log de debug para prédios |

---

## Código Específico

**Linha ~2536 - Atualizar condição e adicionar loading:**

```tsx
{/* Quantidade de Posições (Marcas) - Logo após seleção de prédios */}
{(selectedBuildings.length > 0 || (isEditMode && !dataLoaded && isLoadingProposal)) && (
  <Card className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
    {isEditMode && !dataLoaded ? (
      <div className="flex items-center gap-3 py-2">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Carregando configurações de posições...</span>
      </div>
    ) : (
      <>
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Quantidade de Posições (Marcas)</h3>
          {/* ... resto do conteúdo */}
        </div>
        {/* ... slider e info */}
      </>
    )}
  </Card>
)}
```

**Linha ~589 - Adicionar log de debug:**

```tsx
console.log('🏢 Prédios hidratados para edição:', buildingIds.length, 'IDs:', buildingIds.slice(0, 3));
setSelectedBuildings(buildingIds);
```

---

## Resultado Esperado

1. Em modo de edição, a seção de posições sempre aparece (com loading ou com slider)
2. O slider funciona corretamente após os dados serem carregados
3. Logs de debug ajudam a diagnosticar se os prédios estão sendo carregados
