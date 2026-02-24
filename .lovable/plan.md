
# Confirmacao em Tempo Real + Comprovante de Compromisso

## Problema
1. Quando alguem confirma recebimento no WhatsApp, o status no modal nao atualiza automaticamente -- precisa clicar "Atualizar status" manualmente
2. Nao ha efeito visual quando o status muda (deveria ter uma animacao sutil)
3. A mensagem de confirmacao enviada de volta e generica ("Obrigado pela confirmacao") -- deveria funcionar como um comprovante formal com os detalhes do compromisso

## Solucao

### 1. Auto-refresh em tempo real (Polling automatico)
Adicionar `refetchInterval: 5000` (5 segundos) na query de `task_read_receipts` no `EditTaskModal.tsx`. Isso faz com que o status atualize automaticamente enquanto o modal esta aberto, sem precisar clicar no botao.

### 2. Efeito visual de transicao
Adicionar animacao CSS `animate-pulse` temporaria quando um receipt muda de status para `read`. Usar uma ref para rastrear os IDs ja conhecidos como `read` e aplicar o efeito apenas nos novos.

### 3. Comprovante de compromisso no WhatsApp (zapi-webhook)
Quando o usuario clica "Confirmar recebimento", a resposta automatica sera um comprovante completo com os detalhes da tarefa, consultados do banco:

```text
✅ *Recebimento Confirmado*

📋 *Reuniao com cliente X*
📅 24/02/2026 as 10:00
🏢 Edificio Aurora
👤 Criado por: Jeferson Encina

Voce confirmou o recebimento deste compromisso.
Horario da confirmacao: 03:52 de 24/02/2026

_Este e seu comprovante de ciencia._
```

Isso busca os dados da tabela `tasks` pelo `taskId` e monta a mensagem contextual.

## Arquivos Modificados

**1. `src/components/admin/agenda/EditTaskModal.tsx`**
- Adicionar `refetchInterval: 5000` na query de receipts
- Adicionar logica de efeito visual (pulse) para novos confirmados
- Remover botao "Atualizar status" (nao sera mais necessario, o polling faz automatico)

**2. `supabase/functions/zapi-webhook/index.ts`**
- No handler `task_ack:`, buscar dados da tarefa (`tasks` table) antes de enviar a confirmacao
- Montar mensagem de comprovante com titulo, data, predio, criador
- Incluir horario exato da confirmacao

**Nenhum outro arquivo alterado.**
