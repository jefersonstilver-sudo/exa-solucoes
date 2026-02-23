

# Card "Canal de Entrada" - Rastreabilidade Completa do Contato

## O que sera adicionado

Um novo card **"Canal de Entrada"** no `TabVisaoGeral.tsx`, posicionado entre o card "Resumo do Contato" e "Dados Pessoais", mostrando:

| Campo | Fonte dos dados | Exemplo |
|-------|----------------|---------|
| Origem | `contact.origem` (badge existente) | Badge: "Conversa WhatsApp - Sofia" |
| Criado por | `contact.created_by` -> query `profiles.full_name` | "Artur Giehl" ou "Sistema (automatico)" |
| Data de criacao | `contact.created_at` | "19/02/2026 as 14:32" |
| Hora de criacao | `contact.created_at` | Inclusa na data formatada |
| Fonte do sync | `contact.metadata?.source` | "Sincronizado de conversas WhatsApp" |
| Agente(s) | `contact.agent_sources` | "Sofia, Eduardo" |
| Referencia | `contact.metadata?.order_id` ou `conversation_id` | Link ou ID de referencia |

## Logica de exibicao do "Criado por"

1. Se `metadata?.auto_created === true` -> "Sistema (sincronizacao automatica)"
2. Se `created_by` existe -> buscar nome via `supabase.from('profiles').select('full_name').eq('id', created_by)`
3. Se nenhum dos dois -> "Nao registrado"

## Traducao de `metadata.source`

- `sync_conversations` -> "Sincronizado de conversas WhatsApp"
- `sync_escalacoes` -> "Escalacao comercial"
- `sync_pedidos` -> "Sincronizado de pedidos"
- `sync_lead_profiles` -> "Importado de perfil de lead"
- `null/undefined` -> nao exibe linha

## Detalhes tecnicos

### Arquivo modificado: `src/components/contatos/detalhe/TabVisaoGeral.tsx`

1. Adicionar `useState` e `useEffect` para buscar o nome do criador via profiles
2. Criar o card "Canal de Entrada" com icone `LogIn` do lucide-react
3. Layout em grid 2x3 com os campos listados acima
4. Cada campo com label em `text-xs text-muted-foreground` e valor em `font-medium`
5. Agentes exibidos como badges individuais quando `agent_sources` existe

### Estrutura visual do card

```
Canal de Entrada
-----------------
Origem:         [Badge colorido]
Criado por:     Nome do usuario / Sistema (auto)
Data:           19/02/2026 as 14:32
Fonte:          Sincronizado de conversas WhatsApp
Agente(s):      [Sofia] [Eduardo]
Ref:            conv_abc123
```

O card substitui e expande o antigo card "Informacoes do Sistema" (que fica redundante), incorporando seus campos (Origem, Categoria, Criado em, Ultima atualizacao) dentro do novo card mais completo.

### Nenhuma alteracao no banco de dados

Todos os campos necessarios ja existem na tabela `contatos_unificados`: `created_by`, `metadata`, `agent_sources`, `origem`, `conversation_id`. Apenas a UI precisa ser atualizada.
