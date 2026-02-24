

# Redesign do EditTaskModal - Layout Moderno e Completo

## Problema Atual
- Modal pequeno (max-w-[550px]) e visualmente pobre
- Sem monitor de confirmacao de recebimento (quem viu/nao viu)
- Sem botao de enviar lembrete
- Header generico sem identidade visual do tipo de evento
- Layout apertado, campos empilhados sem organizacao clara

## Nova Arquitetura Visual

O modal sera reconstruido com layout em duas colunas (desktop) e header visual forte:

```text
+-------------------------------------------------------+
|  [emoji grande]  NOVA REUNIAO AGENDADA                |
|  Badge status | Badge prioridade | Badge departamento  |
|  Titulo da tarefa em destaque                          |
+-------------------------------------------------------+
|                          |                             |
|  DETALHES DO EVENTO      |  NOTIFICACOES & STATUS      |
|  - Tipo de evento        |  - Monitor de confirmacao   |
|  - Subtipo reuniao       |    (quem viu / nao viu)     |
|  - Lead / Contato        |  - Botao ENVIAR LEMBRETE    |
|  - Propostas vinculadas  |  - Follow-up automatico     |
|  - Predio / Local        |  - Gerenciar contatos       |
|  - Data / Hora           |                             |
|  - Link reuniao          |                             |
|  - Prioridade / Status   |                             |
|  - Escopo                |                             |
|  - Descricao             |                             |
|                          |                             |
+-------------------------------------------------------+
|  [Excluir]                    [Cancelar] [Salvar]      |
+-------------------------------------------------------+
```

## Mudancas Detalhadas

### 1. Header Visual Contextual
- Emoji grande do tipo de evento (resolvido via `useEventTypes`)
- Titulo dinamico: "Editar Reuniao", "Editar Instalacao", "Editar Tarefa", etc.
- Badges de status, prioridade e departamento no header
- Fundo com gradiente sutil baseado na cor do tipo de evento

### 2. Layout Maior e Organizado
- `sm:max-w-[900px]` (antes era 550px)
- Duas colunas no desktop: formulario a esquerda, notificacoes a direita
- Mobile: coluna unica com notificacoes abaixo

### 3. Monitor de Notificacoes Integrado (coluna direita)
- Reutiliza a query de `task_read_receipts` diretamente no modal
- Lista de contatos com status visual:
  - Icone cinza + "Enviado" (aguardando)
  - Icone azul + "Entregue"
  - Icone verde + "Confirmou as HH:MM de DD/MM"
- Contagem: "2 de 3 confirmaram"
- Sempre visivel (nao colapsado)

### 4. Botao "Enviar Lembrete"
- Botao na secao de notificacoes
- Invoca `task-notify-created` com os dados atuais da tarefa para reenviar a notificacao
- Loading state enquanto envia
- Toast de sucesso/erro

### 5. Notificacao ao Salvar com Selecao de Contatos
- Mesma logica de checkboxes do CreateTaskModal
- Lista de admins com telefone para selecionar quem notificar

## Arquivos Modificados

**1 arquivo editado:**
- `src/components/admin/agenda/EditTaskModal.tsx` -- redesign completo do layout, integracao do monitor de notificacoes e botao de lembrete

**Nenhum arquivo novo** -- reutiliza a tabela `task_read_receipts` e a edge function `task-notify-created` ja existentes

**Nao alterados:**
- Nenhum outro componente, pagina ou funcionalidade existente

