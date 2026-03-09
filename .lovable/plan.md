

# Unificar lista de prédios: seleção única com "Selecionar Todos"

## Problema atual

A UI mostra **duas seções separadas**: uma lista de prédios selecionados em cima (com X para remover) e uma lista de todos os prédios embaixo (para adicionar). O usuário quer **uma única lista** onde os prédios selecionados mudam de cor, com um botão "Selecionar Todos".

Além disso, o erro "Edge Function returned a non-2xx status code" precisa ser investigado separadamente — provavelmente relacionado ao `admin-update-user` na criação de conta.

## Alterações — `OrderConfigSection.tsx`

### Remover a seção "Selected buildings list" (linhas 136-159)
Eliminar completamente o bloco que renderiza os prédios selecionados separadamente.

### Redesenhar a lista única (linhas 161-177)
- Cada prédio na lista mostra um **checkbox visual** ou muda de cor (bg-primary/10 + borda colorida + checkmark) quando selecionado
- Prédios selecionados ficam com fundo destacado e ícone de check
- Remover limite de `slice(0, 30)` ou aumentar

### Adicionar botão "Selecionar Todos / Desmarcar Todos"
- Ao lado do campo de busca ou abaixo dele
- Se todos os prédios filtrados estão selecionados → "Desmarcar Todos"
- Caso contrário → "Selecionar Todos"

### Layout final

```text
┌─ Prédios * (17 selecionados) ──────────────────┐
│ [🔍 Buscar prédio...]  [✓ Selecionar Todos]    │
│ ┌──────────────────────────────────────────────┐ │
│ │ ✅ Bella Vita          Centro         001    │ │
│ │ ✅ Royal Legacy        Vila Yolanda   002    │ │
│ │ ☐  Torre Azul          R. Jorge       009    │ │
│ │ ✅ Residencial Miró    Centro         003    │ │
│ │ ...                                          │ │
│ └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

## Arquivos

| Arquivo | Mudança |
|---------|---------|
| `OrderConfigSection.tsx` | Remover lista separada de selecionados, unificar em lista única com visual de seleção + botão "Selecionar Todos" |

