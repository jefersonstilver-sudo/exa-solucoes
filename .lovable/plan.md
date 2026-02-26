
# Correcoes: Reenvio Individual, Popover de Lembrete e Alinhamento da Grade

## Problemas Identificados

### 1. Popover "Enviar Lembrete" nao mostra todos os contatos
Na screenshot, existem 3 contatos na area de NOTIFICACOES (Blenda, Jeniffer, Jeferson), mas o popover "Enviar para" mostra apenas 2 (Blenda e Jeferson). Causa: o `eventRegisteredContacts` deduplica por telefone (`contact_phone`), e se a Jeniffer tiver um telefone duplicado ou vazio, ela e filtrada.

**Correcao:** Deduplificar por `contact_phone` mas tambem incluir contatos com telefone vazio/invalido (exibindo o nome para referencia), ou usar o `id` do receipt como chave unica sem filtrar duplicatas de telefone.

### 2. Nao ha opcao de reenviar para contatos individuais
Quando um contato aparece como "Enviado" mas nao recebeu de fato, o usuario precisa poder reenviar diretamente para aquele contato. Atualmente, precisa abrir o popover de lembrete, selecionar manualmente e enviar.

**Correcao:** Adicionar um botao de reenvio (icone `RefreshCw`) ao lado de cada receipt na lista de NOTIFICACOES. Ao clicar, chama `handleSendReminder` diretamente para aquele contato unico.

### 3. Linhas desalinhadas na visao Semanal
A screenshot mostra bordas tracejadas (dashed) desalinhadas. Isso ocorre porque as celulas usam `border-border` padrao, mas o layout pode ter inconsistencias nas borders entre o label da hora e as colunas dos dias.

**Correcao:** Garantir que todas as borders usem o mesmo estilo consistente (`border-border` solido), e que a grid de 8 colunas (hora + 7 dias) tenha alturas e bordas uniformes em todas as views.

### 4. Hover com informacoes completas
Ao passar o mouse sobre um evento nas views Semanal/Dia/Mes, deve mostrar informacoes detalhadas como tooltip.

**Correcao:** Adicionar tooltip rico com: tipo de evento, titulo, horario, responsaveis, status, prioridade. Usar o atributo `title` expandido ou um componente `Tooltip` do Radix.

---

## Mudancas por Arquivo

### 1. `src/components/admin/agenda/EditTaskModal.tsx`

**a) Corrigir `eventRegisteredContacts` (linhas 526-541):**
- Remover filtro que exclui contatos sem telefone valido
- Usar `receipt.id` como chave unica (ja faz isso), mas nao filtrar por telefone duplicado - usar `contact_name + contact_phone` como chave de deduplicacao para garantir que contatos com o mesmo nome mas diferentes receipts aparecam

```text
const eventRegisteredContacts = useMemo(() => {
  if (!receipts || receipts.length === 0) return [];
  const seen = new Set<string>();
  return receipts
    .filter(r => {
      // Usar combinacao unica de telefone - se nao tiver, usar nome
      const key = r.contact_phone?.replace(/\D/g, '') || r.contact_name || r.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map(r => ({
      id: r.id,
      phone: r.contact_phone,
      name: r.contact_name || r.contact_phone,
    }));
}, [receipts]);
```

**b) Adicionar botao de reenvio individual em cada receipt (linhas 994-1013):**
- Ao lado do status label de cada receipt, adicionar um botao `RefreshCw` que chama `handleSendReminder` com apenas aquele contato
- O botao aparece para qualquer status (enviado, entregue, confirmado) permitindo reenvio a qualquer momento

```text
{receipts.map((receipt) => (
  <div key={receipt.id} className={cn(...)}>
    <div className="flex items-center gap-2 min-w-0">
      {getReceiptStatusIcon(receipt.status)}
      <span className="text-sm font-medium truncate">
        {receipt.contact_name || receipt.contact_phone}
      </span>
    </div>
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
        {getReceiptStatusLabel(receipt)}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 hover:bg-primary/10"
        title="Reenviar para este contato"
        disabled={sendingReminder}
        onClick={(e) => {
          e.stopPropagation();
          handleSendReminder([receipt.id]);
        }}
      >
        <RefreshCw className="h-3 w-3 text-muted-foreground hover:text-primary" />
      </Button>
    </div>
  </div>
))}
```

### 2. `src/pages/admin/tarefas/components/AgendaWeekView.tsx`

**a) Corrigir alinhamento das bordas:**
- Mudar todas as borders para `border-solid` explicitamente
- Garantir que `border-border` seja consistente em todas as celulas
- Ajustar a grid para ter bordas uniformes sem gaps

**b) Adicionar tooltip detalhado nos eventos:**
- Expandir o atributo `title` para incluir tipo de evento, prioridade, status, responsaveis, horario completo
- Usar formato: "Tipo | Titulo | Horario | Status | Prioridade | Responsaveis"

```text
title={`${task.horario_inicio?.substring(0,5) || ''} ${task.titulo}\n${task.prioridade ? 'Prioridade: ' + task.prioridade : ''}\n${task.status ? 'Status: ' + task.status : ''}${task.task_responsaveis?.length ? '\nResp: ' + task.task_responsaveis.map(r => r.users?.nome).join(', ') : ''}`}
```

**c) Garantir alturas consistentes:**
- Todas as celulas com `min-h-[48px]` (normal) ou `min-h-[60px]` (fullscreen) uniformemente

### 3. `src/pages/admin/tarefas/components/AgendaDayView.tsx`

**a) Tooltip detalhado nos TaskCards:**
- Mesma logica de tooltip expandido aplicada ao TaskCard dentro do DayView

### 4. `src/components/admin/agenda/DroppableCalendarDay.tsx`

**a) Tooltip nos eventos do mes:**
- Adicionar `title` detalhado em cada TaskCard renderizado na celula do mes

### 5. `src/components/admin/agenda/TaskCard.tsx`

**a) Melhorar o `title` no modo compact (linha 156):**
- Expandir para incluir mais informacoes: descricao, local, link da reuniao, prioridade formatada
- Formato multi-linha usando `\n`:

```text
title={[
  `${tipoConfig.label}: ${task.titulo}`,
  task.prioridade ? `Prioridade: ${task.prioridade}` : null,
  `Status: ${STATUS_LABELS[task.status] || task.status}`,
  task.horario_inicio ? `Inicio: ${task.horario_inicio.substring(0,5)}` : null,
  task.horario_limite ? `Ate: ${task.horario_limite.substring(0,5)}` : null,
  responsavelLabel ? `Resp: ${responsavelLabel}` : null,
  task.local_evento ? `Local: ${task.local_evento}` : null,
  task.link_reuniao ? `Link: ${task.link_reuniao}` : null,
  task.descricao ? `Desc: ${task.descricao.substring(0, 80)}` : null,
].filter(Boolean).join('\n')}
```

---

## O que NAO muda
- Nenhuma outra pagina ou componente fora dos listados
- A logica de criacao de tarefas (CreateTaskModal) permanece igual
- As notificacoes WhatsApp (Edge Function) permanecem iguais
- O drag-and-drop do mes permanece igual
- A secao "Ao Salvar" e contatos WhatsApp permanecem iguais
- A UI geral dos modais permanece identica
