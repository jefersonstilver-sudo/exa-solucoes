

# Plano: Animação de Feedback + Auto-refresh na Página de Aprovações

## Problema
Quando o admin aprova ou rejeita um vídeo, não há feedback visual claro e a lista não atualiza automaticamente — o usuário precisa recarregar a página manualmente.

## Solução

### 1. Auto-refresh após ação (`RealPendingVideosSection.tsx`)
- Após `approveVideo` ou `rejectVideo` completar com sucesso, chamar `fetchPendingVideos()` + `onRefresh()` para atualizar a lista e os contadores automaticamente
- O item aprovado/rejeitado desaparece da lista sem reload

### 2. Animação de feedback inline (`RealPendingVideosSection.tsx`)
- Adicionar estado `actionResult: { [videoId]: 'approved' | 'rejected' }` para rastrear ações recentes
- Quando um vídeo é aprovado/rejeitado, mostrar um overlay animado no card do vídeo com:
  - **Aprovado**: fundo verde com ícone CheckCircle + texto "Aprovado!" com fade-in e scale
  - **Rejeitado**: fundo vermelho com ícone XCircle + texto "Rejeitado" com fade-in e scale
- Após 1.5s da animação, remover o item da lista com transição suave (fade-out + slide)

### 3. Toast aprimorado (já existe, manter)
- Manter os toasts existentes como confirmação secundária

## Mudanças em arquivos

| Arquivo | Mudança |
|---------|---------|
| `src/components/admin/approvals/RealPendingVideosSection.tsx` | Adicionar estado `actionResult`, overlay animado nos cards, auto-refresh após ação |

## O que NÃO muda
- Nenhuma outra página, componente ou workflow
- Lógica de aprovação/rejeição (RPCs, emails, API externa) permanece idêntica
- Layout desktop e mobile da ApprovalsPage inalterado

