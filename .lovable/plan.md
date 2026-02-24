

# Minimalizar Cards e Filtros da Central de Tarefas

## O que muda

### 1. Stats Cards -- De cards grandes para barra inline compacta

Substituir os 4 cards com icones e padding grande por uma unica barra horizontal com numeros compactos:

```text
ANTES (4 cards pesados com icones):
+----------------+ +----------------+ +----------------+ +----------------+
| [icon]         | | [icon]         | | [icon]         | | [icon]         |
| 42  Total      | | 18  Pendentes  | | 12  Andamento  | | 12  Concluidas |
+----------------+ +----------------+ +----------------+ +----------------+

DEPOIS (barra inline leve):
Total: 42  |  Pendentes: 18  |  Andamento: 12  |  Concluidas: 12
```

- Remover icones dos stats
- Remover bordas e backgrounds pesados
- Numeros em negrito + labels em texto pequeno, tudo em 1 linha
- Separados por divisores sutis (|)

### 2. Filtros -- De card com titulo para barra compacta colapsavel

```text
ANTES:
+--------------------------------------------------+
| [icon] Filtros                    [Limpar filtros] |
|                                                    |
| Status        Prioridade    Departamento  Resp.    |
| [badges...]   [badges...]   [select]      [select] |
+--------------------------------------------------+

DEPOIS (colapsado por default):
[Filtros v]  Status: Ativos | Prioridade: Todas | ...

DEPOIS (expandido ao clicar):
[Filtros ^]
[Status badges] [Prioridade badges] [Dept select] [Resp select]
```

- Remover o card wrapper (bg-white, border, padding grande)
- Filtros colapsaveis: mostrar resumo inline quando fechado
- Quando expandido, selects em linha sem card envolvente
- Remover icone de filtro e reduzir padding geral

### 3. Arquivo editado

**`src/pages/admin/tarefas/CentralTarefasPage.tsx`**:
- Linhas 179-228: Substituir grid de 4 cards por barra inline compacta com flex e separadores
- Linhas 230-243: Envolver TaskFiltersBar em um Collapsible (do Radix) que inicia fechado, com trigger minimalista mostrando resumo dos filtros ativos

Nenhum outro arquivo e alterado. A logica de dados, agenda, modais, drawer -- tudo permanece identico.

