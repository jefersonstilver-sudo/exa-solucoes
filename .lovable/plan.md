
# Diagnóstico: Funcionalidade de Múltiplas Posições

## ✅ FUNCIONALIDADE EXISTE E ESTÁ FUNCIONANDO

Após análise completa do código, a funcionalidade de **"Quantidade de Posições (Marcas)"** existe e está plenamente operacional. O problema é **onde ela aparece** e **quando ela aparece**.

---

## 📍 Localização Atual

O seletor de posições está **dentro da seção "Período e Valores"** (linhas 2778-2825 de `NovaPropostaPage.tsx`), **não na seção de Prédios**.

```
Estrutura da página:
├── Vendedor Responsável
├── Dados do Cliente
├── Prédios                    ← Você está olhando aqui
├── Venda Futura
├── Período e Valores          ← O seletor de posições está AQUI
│   ├── Tipo de Proposta (Monetária/Permuta)
│   ├── Seletor de Período (1, 3, 6, 12 meses)
│   └── ⭐ Quantidade de Posições (Marcas) ← ESTÁ AQUI
├── Valores e Pagamentos
└── ...
```

---

## 🚫 Condições que ESCONDEM o Seletor

O seletor **NÃO APARECE** quando:

1. **Produto = VERTICAL PREMIUM** selecionado
   - Condição: `tipoProduto === 'horizontal'`
   - Vertical Premium permite máximo 3 posições vs Horizontal permite 15

2. **Nenhum prédio selecionado**
   - Condição: `selectedBuildings.length > 0`

**Código atual (linha 2779):**
```typescript
{tipoProduto === 'horizontal' && selectedBuildings.length > 0 && (
  <div className="mb-4 p-4 bg-gradient-to-r from-primary/5 to-primary/10 ...">
    {/* Seletor de posições */}
  </div>
)}
```

---

## 📋 O Que Está Funcionando Corretamente

| Item | Status | Localização |
|------|--------|-------------|
| Estado `quantidadePosicoes` | ✅ Existe | Linha 186 |
| Salvamento no banco | ✅ Funciona | Linha 947 |
| Carregamento ao editar | ✅ Funciona | Linha 624 |
| Cálculo de exibições multiplicadas | ✅ Funciona | Linhas 878-882 |
| Valor sugerido multiplicado | ✅ Funciona | Linha 1091 |
| Exibição na proposta pública | ✅ Funciona | Linhas 1917-1949 |
| Cláusula no contrato | ✅ Funciona | Linha 1545 |

---

## 🔧 Solução Proposta

Mover o seletor de "Quantidade de Posições" para **logo abaixo da seleção de prédios**, tornando-o mais visível e intuitivo.

### Mudanças Necessárias

**Arquivo:** `src/pages/admin/proposals/NovaPropostaPage.tsx`

1. **Remover** o seletor da seção "Período e Valores" (linhas 2778-2825)

2. **Adicionar** o seletor **dentro da seção de Prédios**, logo após a lista de prédios selecionados (após linha ~2533)

3. **Opcionalmente**: Habilitar também para Vertical Premium (com limite de 3 posições ao invés de 15)

### Código a Mover

O bloco inteiro (linhas 2778-2825) será movido para logo após o fechamento do Card de Prédios (linha ~2533):

```tsx
{/* Seção de Prédios */}
<Card>
  {/* Lista de prédios... */}
</Card>

{/* NOVO LOCAL - Quantidade de Posições (Marcas) */}
{selectedBuildings.length > 0 && (
  <Card className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 ...">
    <div className="flex items-center gap-2 mb-3">
      <Users className="h-5 w-5 text-primary" />
      <h3 className="font-semibold">Quantidade de Posições (Marcas)</h3>
    </div>
    {/* Slider e informações... */}
  </Card>
)}
```

### Benefícios

1. **Visibilidade imediata** após selecionar prédios
2. **Contexto lógico** - posições estão relacionadas aos prédios
3. **Menos scroll** necessário para acessar a funcionalidade
4. **Opcional**: Habilitar para ambos os produtos (Horizontal e Vertical Premium)

---

## 📄 Contrato - Já Está Funcionando

O contrato **já inclui** a cláusula de múltiplas posições quando `quantidade_posicoes > 1`:

```html
<!-- Cláusula 4.4 (gerada automaticamente) -->
<p><strong>MÚLTIPLAS POSIÇÕES:</strong> O CONTRATANTE contratou 
<strong>3 posições</strong> no ciclo de exibição, o que significa 
que seu material será exibido 3x mais vezes por ciclo, multiplicando 
proporcionalmente o número total de exibições.</p>
```

---

## Resumo da Implementação

| Etapa | Descrição |
|-------|-----------|
| 1 | Cortar o bloco de código do seletor de posições (linhas 2778-2825) |
| 2 | Colar após a seção de Prédios (após linha ~2533) |
| 3 | Remover condição `tipoProduto === 'horizontal'` (opcional - permite para Vertical também) |
| 4 | Ajustar `maxPosicoes` para respeitar limite do produto selecionado |
| 5 | Testar salvamento e carregamento |
