

# Fix: AlertDialog "Excluir Painel" Trava com Tela Preta

## Diagnóstico

O problema é claro e simples:

O `AlertDialog` (confirmação de exclusão) está **renderizando atrás** do `Dialog` pai (ComputerDetailModal).

**Hierarquia atual de z-index:**
- `Dialog` overlay: `z-[var(--z-modal-overlay)]` = **z-100**
- `Dialog` content: `z-[var(--z-modal)]` = **z-110**
- `AlertDialog` overlay: `z-50` (padrão shadcn)
- `AlertDialog` content: `z-50` (padrão shadcn)

Quando o usuário clica "Excluir Painel", o AlertDialog abre com overlay preto em `z-50`, mas o conteúdo (botões Cancelar/Confirmar) também fica em `z-50` — ambos **atrás** do Dialog pai que está em z-100/110. Resultado: tela preta sem botões visíveis, site "travado".

## Correção

### 1. Atualizar `src/components/ui/alert-dialog.tsx`

Elevar o z-index do AlertDialog para ficar **acima** de qualquer modal/drawer:

- `AlertDialogOverlay`: de `z-50` para `z-[var(--z-floating)]` (999)
- `AlertDialogContent`: de `z-50` para `z-[var(--z-floating)]` (999)

Isso garante que AlertDialogs (que são sempre confirmações críticas) sempre fiquem no topo, independente de estarem dentro de um Dialog, Drawer ou Sheet.

### 2. Verificar outros usos de AlertDialog no projeto

Essa correção resolve automaticamente todos os AlertDialogs do projeto, incluindo:
- `DeleteConfirmationDialog` (benefícios)
- `ComputerDetailModal` (excluir painel — o caso reportado)
- Qualquer outro AlertDialog aninhado em Dialog

**1 arquivo alterado. Correção cirúrgica, sem efeitos colaterais.**

