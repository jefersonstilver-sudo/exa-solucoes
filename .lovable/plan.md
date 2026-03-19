

# Plano: Instalar Toggle Geist + Variáveis CSS + Substituição Global

## Conflito detectado

O arquivo `src/components/ui/toggle.tsx` atual é o **Radix Toggle** (shadcn), que exporta `toggleVariants` usado por `toggle-group.tsx` (importado em `KanbanHeader.tsx`). Sobrescrever diretamente quebraria o build.

**Solução**: Mover o conteúdo Radix atual para `src/components/ui/toggle-radix.tsx` e atualizar o import em `toggle-group.tsx` para apontar para o novo path. Depois, criar o novo `toggle.tsx` com o componente Geist.

---

## ETAPA 1 — Instalar o componente Toggle

| Ação | Arquivo |
|------|---------|
| Mover Radix Toggle | `src/components/ui/toggle-radix.tsx` (novo, cópia do conteúdo atual) |
| Atualizar import | `src/components/ui/toggle-group.tsx` linha 6: `toggle` → `toggle-radix` |
| Criar Toggle Geist | `src/components/ui/toggle.tsx` (conteúdo exato fornecido pelo usuário) |

## ETAPA 2 — Variáveis CSS + Tailwind

| Ação | Arquivo |
|------|---------|
| Adicionar CSS vars light | `src/styles/base.css` dentro de `:root` (~25 variáveis) |
| Adicionar CSS vars dark | `src/styles/base.css` dentro de `.dark` (~25 variáveis) |
| Extend colors + boxShadow | `tailwind.config.ts` dentro de `theme.extend.colors` e `theme.extend.boxShadow` |

**Nota**: As novas cores (blue-700, red-600, etc.) serão adicionadas ao lado das existentes sem conflito, pois usam nomes diferentes dos já definidos.

## ETAPA 3 — Substituição em 6 arquivos

| Arquivo | De | Para |
|---------|-----|------|
| `EditTaskModal.tsx` | `ToggleExa` | `Toggle` com `onChange={(e) => fn(e.target.checked)}` `color="red" size="large"` |
| `TaskRemindersPanel.tsx` | `ToggleExa` | `Toggle` `color="red" size="small"` |
| `ModulePermissionsModal.tsx` | `ToggleExa` | `Toggle` `color="red" size="large"` |
| `AdvertiserSettings.tsx` | `ToggleExa` | `Toggle` `color="red" size="large"` |
| `AgendaNotificationSettingsModal.tsx` | `ToggleExa` | `Toggle` `color="red" size="large"` |
| `ComputerDetailModal.tsx` | `ToggleExa` | `Toggle` `color="red" size="large"` |

Em cada arquivo: remove import de `ToggleExa`, adiciona `import { Toggle } from "@/components/ui/toggle"`, adapta props (`checked`, `onChange` com `e.target.checked`). Lógica intacta.

---

## Arquivos alterados (8 total)

| Arquivo | Tipo |
|---------|------|
| `src/components/ui/toggle-radix.tsx` | Novo (move Radix) |
| `src/components/ui/toggle-group.tsx` | Edição (import path) |
| `src/components/ui/toggle.tsx` | Reescrito (Toggle Geist) |
| `src/styles/base.css` | Edição (CSS vars) |
| `tailwind.config.ts` | Edição (colors + shadow) |
| `src/components/admin/agenda/EditTaskModal.tsx` | Edição |
| `src/components/admin/agenda/TaskRemindersPanel.tsx` | Edição |
| `src/components/admin/account-types/ModulePermissionsModal.tsx` | Edição |
| `src/pages/advertiser/AdvertiserSettings.tsx` | Edição |
| `src/pages/admin/tarefas/components/AgendaNotificationSettingsModal.tsx` | Edição |
| `src/modules/monitoramento-ia/components/anydesk/ComputerDetailModal.tsx` | Edição |

Nenhuma lógica de negócio alterada.

