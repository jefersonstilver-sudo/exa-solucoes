
Objetivo: destravar todos os campos do modal “Nova Tarefa” e refatorar a base dos componentes de camada/flutuantes para que selects, datas, horários e caixas de opção funcionem corretamente no desktop e no iPhone, com layout realmente responsivo.

Diagnóstico confirmado:
- Revisei `CreateTaskModal`, `EditTaskModal`, `Select`, `Popover`, `Dialog`, `Drawer`, `BuildingSelector`, `Calendar`, `z-index.css` e CSS responsivo.
- A sessão do usuário mostra que o clique no seletor acontece (`aria-expanded` abre/fecha), então o gatilho funciona.
- O problema real é de camada/interação, não de onClick:
  1. `SelectContent` e `PopoverContent` usam `z-50`, mas `Dialog` usa `z-110` e `Drawer` `z-120`. Resultado: dropdowns e calendário abrem “atrás” do modal.
  2. O `DrawerContent` customizado ignora o `direction="bottom"` do Vaul e sempre renderiza como painel lateral `fixed inset-y-0 right-0 h-full`, o que quebra a UX mobile e pode afetar inputs/pickers.
  3. Há campos com dropdown manual (`BuildingSelector`, busca de lead) e campos Radix misturados, sem uma governança única de layers.
  4. Depois de tentar abrir um select/popover, pode ficar uma camada invisível interferindo nos cliques seguintes, o que explica data/hora/opções “travadas”.

Do I know what the issue is?
Sim. O problema central é uma arquitetura inconsistente de overlays/portals: conteúdos flutuantes do formulário estão abaixo das camadas do modal/drawer e o drawer mobile foi implementado com layout incompatível com bottom-sheet.

Plano de refatoração:

1. Corrigir a arquitetura de camadas
- Ajustar `src/styles/z-index.css` para separar melhor:
  - modal overlay
  - modal content
  - drawer
  - floating content dentro de modal (select/popover/calendar/dropdowns)
- Criar um nível acima do modal/drawer para floating UI do formulário.

2. Refatorar `Select` e `Popover` para funcionar dentro de modal
- Em `src/components/ui/select.tsx`:
  - elevar o z-index do conteúdo
  - garantir `pointer-events-auto`
  - expor suporte consistente para uso dentro de modal
- Em `src/components/ui/popover.tsx`:
  - mesma normalização
  - garantir que calendário/menus não fiquem atrás do `Dialog`/`Drawer`

3. Refatorar o `Drawer` para bottom-sheet real no mobile
- Em `src/components/ui/drawer.tsx`:
  - fazer o layout respeitar `direction="bottom"`
  - bottom-sheet com `inset-x-0 bottom-0 top-auto`, `max-h` com `dvh`, canto superior arredondado e scroll interno seguro
  - manter o modo lateral apenas quando for explicitamente o caso
- Isso estabiliza inputs, teclado iOS e pickers.

4. Padronizar o modal de tarefa
- Em `src/components/admin/agenda/CreateTaskModal.tsx`:
  - reorganizar a estrutura do conteúdo para ter uma área única de scroll
  - aplicar a nova governança de layers nos campos:
    - tipo de evento
    - prioridade
    - responsáveis
    - recorrência
    - datas/calendário
    - horários
  - revisar os dropdowns manuais de lead e propostas para não disputarem camada com select/popover
- Em `src/components/admin/agenda/EditTaskModal.tsx`:
  - aplicar exatamente a mesma estratégia para não corrigir só um modal e deixar o outro quebrado

5. Revisar campos auxiliares que hoje usam dropdown absoluto
- Em `src/components/admin/agenda/BuildingSelector.tsx`:
  - alinhar o dropdown ao novo padrão de layers
  - garantir clique, scroll e fechamento corretos no mobile
- Revisar também a busca de lead dentro do `CreateTaskModal`

6. Revisar o calendário pequeno do modal
- Em `src/components/ui/calendar.tsx`:
  - ajustar responsividade do mini calendário para modal/mobile
  - preservar clique confortável nos dias e largura estável no iPhone

7. Blindar modais aninhados
- Em `src/components/admin/agenda/EventTypeManagerModal.tsx`:
  - validar o comportamento de modal aberto a partir de modal
  - garantir que a engrenagem não cause novo conflito de foco/camada

Arquivos principais envolvidos:
- `src/styles/z-index.css`
- `src/components/ui/select.tsx`
- `src/components/ui/popover.tsx`
- `src/components/ui/drawer.tsx`
- `src/components/ui/calendar.tsx`
- `src/components/admin/agenda/CreateTaskModal.tsx`
- `src/components/admin/agenda/EditTaskModal.tsx`
- `src/components/admin/agenda/BuildingSelector.tsx`
- `src/components/admin/agenda/EventTypeManagerModal.tsx`

Resultado esperado após a implementação:
- clicar na seta do select abre a lista visível e clicável
- clicar em data abre o calendário funcional
- clicar em hora abre/edita normalmente
- checkboxes, switches e caixas de opção voltam a responder
- o modal continua utilizável no desktop
- no iPhone ele vira um bottom-sheet consistente, rolável e sem travamentos

Validação que vou fazer na execução:
- testar “Tipo de Evento”, “Prioridade”, datas e horários no modal de criação
- repetir no modal de edição
- validar iPhone/mobile e desktop
- verificar se nenhuma camada invisível continua bloqueando cliques após abrir/fechar selects e popovers
