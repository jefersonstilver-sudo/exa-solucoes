

# Diagnóstico: Resumo Diário não está sendo enviado

## Problema encontrado

A configuração salva no banco tem **`horarios: []`** (array vazio):

```json
{
  "ativo": true,
  "contatos": [{"id": "...", "nome": "JEFERSON", "telefone": "45998090000"}],
  "horarios": []
}
```

O contato foi selecionado e o toggle está ativo, mas **nenhum horário de envio foi adicionado**. O código do `task-reminder-scheduler` exige `horarios.length > 0` para processar — por isso nunca entra na seção de resumo diário e nenhum log de "resumo" aparece.

Os logs confirmam: o scheduler roda a cada 2 minutos mas pula direto para os lembretes individuais sem mencionar "resumo" ou "summary".

## Correção necessária

Não há bug no código — a configuração está incompleta. Porém, para evitar essa confusão no futuro, vou melhorar a UX:

### 1. Validação no salvamento (`DailySummaryConfigModal.tsx`)
- Ao clicar em "Salvar", se `ativo = true` e `horarios` estiver vazio, mostrar toast de erro: *"Adicione pelo menos um horário de envio"*
- Se `ativo = true` e `contatos` estiver vazio, mostrar toast: *"Adicione pelo menos um contato"*
- Impedir o salvamento até que ambos estejam preenchidos

### 2. Botão de "Enviar agora" para teste
- Adicionar botão "Enviar resumo agora" no modal para que o usuário possa testar instantaneamente sem esperar o horário agendado
- Chama o `task-reminder-scheduler` via `supabase.functions.invoke` com um flag `forceSummary: true`

### 3. Ajuste no `task-reminder-scheduler` — suporte a `forceSummary`
- Se receber `forceSummary: true` no body, ignora a validação de horário e envia o resumo imediatamente para os contatos configurados
- Mantém a lógica de deduplicação (não envia novamente se já enviou nos últimos 5 minutos)

### O que NÃO muda
- Toda a lógica existente de lembretes, notificações de alteração/cancelamento
- Nenhuma outra UI, workflow ou edge function

