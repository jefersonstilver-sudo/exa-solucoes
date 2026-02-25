

# Agenda Fullscreen -- Modo Imersivo com Efeitos Modernos

## Visao Geral
Botao "Tela Cheia" ao lado de "Nova Tarefa" que abre uma pagina dedicada fullscreen. Layout limpo, sem header do admin, sem sidebar, sem padding. Calendario ocupa 100% da tela com efeitos visuais modernos e transicoes suaves.

## Layout Visual

```text
+------------------------------------------------------------------+
| [< Voltar]    Marco 2026    [<] [Hoje] [>]    [Dia][Sem][Mes]  [X] |
+------------------------------------------------------------------+
|                                                                    |
|    Calendario ocupando toda a viewport restante                    |
|    - Celulas maiores, mais tarefas visiveis                        |
|    - Cards com hover elegante e transicoes                         |
|    - Hora atual destacada com linha vermelha (dia/semana)          |
|                                                                    |
+------------------------------------------------------------------+
```

## Efeitos e Detalhes Visuais

- **Entrada da pagina**: fade-in suave ao montar o componente
- **Troca de view (Dia/Sem/Mes)**: transicao com opacity ao alternar
- **Hover nos cards**: scale sutil (1.02) com shadow elevada
- **Dia atual**: indicador pulsante discreto no numero do dia
- **Linha "agora"**: linha vermelha horizontal na posicao do horario atual (views Dia e Semana)
- **Celulas do calendario**: backdrop-blur leve para glassmorphism sutil
- **Botao voltar**: com seta e label, navegacao via `useNavigate(-1)`
- **Tecla ESC**: fecha o fullscreen e volta para Central de Tarefas

## Arquivos a Criar

### 1. `src/pages/admin/tarefas/FullscreenAgendaPage.tsx` (NOVO)
- Pagina completa com `h-screen` e `overflow-hidden`
- Header fino fixo (h-12) com:
  - Botao voltar (ArrowLeft + "Voltar")
  - Titulo do periodo atual (capitalizado)
  - Navegacao de datas (prev/hoje/next)
  - Tabs Dia/Semana/Mes
  - Botao fechar (X) no canto direito
- Reutiliza os mesmos AgendaDayView, AgendaWeekView, AgendaMonthView com prop `fullscreen={true}`
- Reutiliza EditTaskModal ao clicar em tarefa
- Usa a mesma query `agenda-tasks` da CentralTarefasPage
- useEffect com listener de tecla ESC para fechar
- Wrapper com classe `animate-fade-in` na entrada

## Arquivos a Modificar

### 2. `src/pages/admin/tarefas/CentralTarefasPage.tsx`
- Adicionar botao `Maximize2` ao lado de "Nova Tarefa" (linha ~200)
- `onClick={() => navigate('/super_admin/tarefas/fullscreen')}`
- Apenas adicao de 1 botao, nada mais alterado

### 3. `src/routes/SuperAdminRoutes.tsx`
- Adicionar rota: `<Route path="tarefas/fullscreen" element={<Suspense><FullscreenAgendaPage /></Suspense>} />`
- Apenas 1 linha adicionada

### 4. `src/components/admin/layout/ModernSuperAdminLayout.tsx`
- Adicionar `'/tarefas/fullscreen'` ao array `FULLSCREEN_ROUTES` (linha 12)
- Oculta header e remove padding automaticamente

### 5. `src/pages/admin/tarefas/components/AgendaDayView.tsx`
- Prop opcional `fullscreen?: boolean`
- Quando fullscreen: `min-h-[80px]` nos slots (vs 60px), header com fonte maior
- Linha vermelha "now indicator" na hora atual

### 6. `src/pages/admin/tarefas/components/AgendaWeekView.tsx`
- Prop opcional `fullscreen?: boolean`
- Quando fullscreen: `min-h-[52px]` nas celulas (vs 40px), header sticky mais visivel
- Linha vermelha "now indicator" na coluna do dia atual

### 7. `src/pages/admin/tarefas/components/AgendaMonthView.tsx`
- Prop opcional `fullscreen?: boolean`
- Quando fullscreen: `min-h-[140px]` nas celulas, mostra ate 5 tarefas (vs 3)

### 8. `src/components/admin/agenda/DroppableCalendarDay.tsx`
- Prop opcional `fullscreen?: boolean` passada do MonthView
- Quando fullscreen: celula mais alta, mostra ate 5 tarefas, fonte levemente maior

## Funcionalidades Garantidas
- DnD (drag and drop) no mes continua funcionando normalmente
- Click em tarefa abre EditTaskModal com todos os dados
- Polling de 5s nos receipts continua ativo no modal
- Todas as 3 views (Dia/Semana/Mes) funcionais com navegacao de datas
- Botao "Hoje" reseta para data atual
- Responsivo: no mobile o fullscreen usa toda a tela sem bottom nav
- Nenhuma funcionalidade existente alterada

