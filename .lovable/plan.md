

# Plano: Redesign Visual — EditTaskModal + ToggleExa Unificado

Execução em 2 etapas conforme solicitado.

---

## ETAPA 1 — Criar ToggleExa e substituir todos os Switch shadcn

### 1a. Criar `src/components/ui/toggle-exa.tsx`
Componente conforme especificado no prompt: multi-color (red/green/blue/amber/gray), sizes sm/md, label com posição configurável, transição suave com cubic-bezier.

### 1b. Substituir Switch em 2 arquivos

| Arquivo | Ocorrências | Mudança |
|---------|-------------|---------|
| `EditTaskModal.tsx` (linhas 30, 1392, 1399) | 2 usos | `Switch` → `ToggleExa` com `color="red"` |
| `ComputerDetailModal.tsx` (linhas 15, 374) | 1 uso | `Switch` → `ToggleExa` com `color="red"` |

**Nota**: `AppleSwitch` nos demais arquivos (ModulePermissionsModal, AdvertiserSettings, AgendaNotificationSettingsModal, TaskRemindersPanel) também será substituída por `ToggleExa` para unificação total. São 4 arquivos adicionais. O `apple-switch.tsx` e `switch.tsx` originais não serão deletados.

**Ajuste de API**: `Switch` usa `onCheckedChange(bool)`, `AppleSwitch` usa `onCheckedChange(bool)`. O `ToggleExa` usa `onChange(bool)` — todas as chamadas serão adaptadas.

---

## ETAPA 2 — Redesign visual do EditTaskModal + TaskRemindersPanel

### 2a. Header sticky EXA (R-02-A)
- Substituir `bg-muted/30` por gradiente sutil EXA: `bg-gradient-to-r from-[#9C1E1E]/5 to-transparent`
- Emoji do tipo em container com `bg-[#9C1E1E]/10 rounded-2xl p-2.5`
- Remover `statusConfig` e `priorityConfig` locais (linhas 158-171) — usar `getTaskStatusConfig()` de `taskStatus.ts` e `getTaskPriorityConfig()` de `taskPriority.ts`
- Badges com classes dos mappers centrais

### 2b. Coluna esquerda — form limpo (R-02-B)
- Container: `space-y-5 px-6 py-5`
- Labels uniformizados: `text-xs font-semibold uppercase tracking-wide text-muted-foreground`
- Inputs: adicionar `focus-visible:ring-[#9C1E1E]/30 focus-visible:border-[#9C1E1E]`
- Separadores: `<div className="border-t border-border/40" />`

### 2c. Coluna direita — sidebar estruturada (R-02-C)
- Seções com `rounded-xl border bg-background p-4 space-y-3`
- Lembretes e "Ao Salvar" sempre visíveis
- Confirmações e Contatos em Collapsible (já implementados no G3) — ajustar visual dos headers com badges EXA
- Separadores entre seções: `space-y-4` no container principal, sem `<div className="border-t">` explícitos

### 2d. Footer profissional (R-02-D)
- Botão "Excluir": ghost com ícone + texto, cor `destructive`
- Botão "Salvar": `bg-[#9C1E1E] hover:bg-[#9C1E1E]/90 text-white` em vez do `bg-primary` genérico
- Layout: `justify-between` com Excluir à esquerda, Cancelar+Salvar à direita

### 2e. TaskRemindersPanel redesign (R-03)
- Cada lembrete: `rounded-xl border bg-background p-2.5 flex items-center gap-2`
- `AppleSwitch` → `ToggleExa size="sm" color="red"`
- Select de tipo com `w-[100px]`, unidade com `w-[80px]`
- Input de valor com `w-14 text-center`
- Botão remover: `hover:text-destructive hover:bg-destructive/10 rounded-lg`
- Botão adicionar: `border-dashed border-[#9C1E1E]/30 text-[#9C1E1E]`

---

## Arquivos alterados

| Arquivo | Etapa | Tipo |
|---------|-------|------|
| `src/components/ui/toggle-exa.tsx` | 1 | Novo |
| `src/components/admin/agenda/EditTaskModal.tsx` | 1+2 | Edição |
| `src/modules/monitoramento-ia/components/anydesk/ComputerDetailModal.tsx` | 1 | Edição |
| `src/components/admin/account-types/ModulePermissionsModal.tsx` | 1 | Edição |
| `src/pages/advertiser/AdvertiserSettings.tsx` | 1 | Edição |
| `src/pages/admin/tarefas/components/AgendaNotificationSettingsModal.tsx` | 1 | Edição |
| `src/components/admin/agenda/TaskRemindersPanel.tsx` | 1+2 | Edição |

**Nenhuma lógica de negócio, hook, query ou state será alterado.**

