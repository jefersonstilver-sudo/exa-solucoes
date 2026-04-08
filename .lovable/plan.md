

# Duas correções rápidas

## 1. Remover barra de stats da Central de Tarefas
**Arquivo: `src/pages/admin/tarefas/CentralTarefasPage.tsx`**
- Remover linhas 255-264 (o bloco `{/* Stats Inline Bar */}` com Total, Pendentes, Em Andamento, Concluídas)

## 2. Corrigir erro de build no ClientLogoUploadModal
**Arquivo: `src/components/admin/proposals/ClientLogoUploadModal.tsx`**
- Linha 43: Trocar o tipo do ref de `ReturnType<typeof setInterval> | null` para `number | null`
- Isso resolve o conflito entre `window.setInterval` (retorna `number`) e o tipo Node.js `Timeout`

