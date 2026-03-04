

# Plano: Reconstruir Modal de Configurações de Notificações — iPhone-First, Premium, Minimalista

## Problema Atual

O `AgendaNotificationSettingsModal` usa um `Dialog` padrão com `Accordion` que:
- Não é otimizado para iPhone (toque difícil, inputs pequenos, scroll ruim)
- Visual genérico, não segue o padrão EXA Premium
- Parece "feito por IA" — layout mecânico sem refinamento humano

## Solução

Reconstruir completamente o modal com abordagem **iPhone-first**, usando **Drawer (bottom-sheet)** no mobile e **Dialog** no desktop. Design inspirado nos Settings do iOS — cards limpos, toggles grandes, tipografia clara, sem accordion.

---

## Mudanças

### 1. Reconstruir `AgendaNotificationSettingsModal.tsx`

**Mobile (Drawer bottom-sheet):**
- Usa `Drawer` do vaul (já instalado) em vez de Dialog
- Cards individuais para cada seção (não accordion)
- Switch com label à esquerda, toggle à direita (padrão iOS)
- Inputs de horário/minutos como campos inline com feedback visual
- Touch targets mínimo 44px em todos os elementos interativos
- Scroll suave com `-webkit-overflow-scrolling: touch`
- Seções separadas por divisores sutis

**Desktop (Dialog):**
- Mantém Dialog com `max-w-lg`
- Mesmo layout de cards, adaptado para largura maior

**Design visual (ambos):**
- Fundo sólido `bg-background` (sem glassmorphism excessivo que confunde)
- Cards com `bg-card rounded-xl border border-border/50 shadow-sm`
- Ícones em círculos coloridos sutis (estilo iOS Settings)
- Badge de status discreto (ponto verde/cinza, não texto "Ativo/Inativo")
- Tipografia: título 15px semibold, descrição 13px text-muted
- Espaçamento generoso entre seções
- Seção de destinatários com avatares circulares (iniciais) em row horizontal

**Interações:**
- Toggle salva imediatamente (sem botão "Salvar")
- Input de horário/minutos salva on blur (já implementado, manter)
- Toast discreto de confirmação
- Loading skeleton enquanto carrega configs

### 2. Ajustar botão engrenagem no `CentralTarefasPage.tsx`

- Manter exatamente como está (já minimalista, ghost, h-8 w-8)
- Nenhuma alteração necessária

### 3. Hook `useAgendaNotificationSettings.ts`

- Nenhuma alteração — lógica está correta e funcional

---

## Arquivos

| Arquivo | Ação |
|---------|------|
| `src/pages/admin/tarefas/components/AgendaNotificationSettingsModal.tsx` | Reescrever completo (iPhone-first) |

## O que NÃO muda

- `CentralTarefasPage.tsx` — intacto
- `useAgendaNotificationSettings.ts` — intacto
- Edge Functions — intactas
- Nenhuma outra página ou componente

