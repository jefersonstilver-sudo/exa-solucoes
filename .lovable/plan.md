

# Plano: Redesign do Layout de Vídeos Aprovados

## Problema
O layout atual dos vídeos aprovados é denso, desorganizado e não tem preview de vídeo — diferente da seção de vídeos pendentes que usa `VideoPlayer`.

## Solução

### 1. Adicionar `video_url` à RPC (`get_approved_videos_by_period`)
- Nova migration adicionando `v.url as video_url` ao retorno da função
- Sem quebrar nada existente — apenas adiciona um campo novo

### 2. Redesign completo do card desktop (`RealApprovedVideosSection.tsx`)
Layout novo por card, organizado em duas colunas:

```text
┌─────────────────────────────────────────────────────┐
│  ┌──────────┐   Nome do Vídeo        [Slot 2]      │
│  │          │   Cliente: nome   Valor: R$ 1,00      │
│  │  VIDEO   │   Aprovado por: nome  em 01/04/2026   │
│  │ PREVIEW  │   Período: 12 meses (início → fim)    │
│  │          │                                        │
│  │          │   [STATUS]   [Visualizar] [▼ Ações]   │
│  └──────────┘                                        │
└─────────────────────────────────────────────────────┘
```

- **Esquerda**: Preview do vídeo usando `VideoPlayer` (aspect-video, ~200px width)
- **Direita**: Informações organizadas em linhas compactas, sem repetição de emails
- **Status + Ações**: Inline na parte inferior direita
- Remover labels redundantes ("Cliente:", "@email" duplicado)
- Usar a mesma estética glass/blur das outras seções

### 3. Ajustes mobile
- Preview de vídeo no topo do card, aspect-video full-width
- Info compacta abaixo
- Botões de ação em linha

## Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `supabase/migrations/new.sql` | Atualizar RPC para retornar `video_url` |
| `src/components/admin/approvals/RealApprovedVideosSection.tsx` | Redesign completo dos cards com video preview |

## O que NÃO muda
- Nenhuma outra página, componente ou workflow
- Lógica de busca de status, ações admin, period selector — tudo permanece igual
- Seção de vídeos pendentes inalterada

