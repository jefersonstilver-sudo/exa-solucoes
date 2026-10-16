# Estender / reativar pedido (somente super admin)

## O que você vai ver
Na página de cada pedido (Informações do Pedido, ao lado de "Término da Vigência"), um novo botão **"Estender / Reativar"**, visível só para super admin. Ele abre uma janela com três opções:

1. **Somar tempo:** atalhos +1, +3, +6 ou +12 meses, ou um número de dias livre.
2. **Nova data final:** você escolhe a data no calendário.
3. **Tempo indeterminado:** o pedido fica sem data de término até você mudar. Na tela aparece "Indeterminado".

Ao confirmar:
- O término da vigência é atualizado.
- Se o pedido estava **finalizado, expirado, bloqueado ou cancelado**, ele volta a ficar **Ativo** e os vídeos aprovados voltam a ser exibidos (o vídeo principal volta para a tela).
- **Nenhuma cobrança** é criada e nada muda no financeiro ou no Asaas.
- Fica registrado no histórico quem fez, quando, a data anterior e a nova.

## Como será feito
- Uma função segura no banco faz tudo de uma vez: confere se é super admin, valida a data, atualiza o pedido, reativa os vídeos aprovados e grava o registro.
- "Indeterminado" é guardado como data final 31/12/2099. Assim, as telas que já calculam dias restantes continuam funcionando sem quebrar.
- O botão fica em `ProfessionalOrderReport.tsx`, junto ao campo de término, usando o visual atual.

## Detalhes técnicos
- RPC `admin_extend_reactivate_order(p_pedido_id uuid, p_new_end date, p_reactivate boolean)`, SECURITY DEFINER, verificação de `super_admin` via `user_roles`, `EXECUTE` só para authenticated.
  - `UPDATE pedidos SET data_fim = p_new_end`, e quando estiver em status terminal: `status='ativo'`, limpa `blocked_*`.
  - `pedido_videos` aprovados: `is_active = true`. O `selected_for_display` é restaurado para o vídeo base, ou para o primeiro aprovado se não houver base.
  - Log em `pedido_blocking_logs` (`action_type='reactivated'/'extended'`) e em `log_eventos_sistema`.
- Os painéis externos (AWS) vão receber a reativação na sincronização periódica já existente. Não será criado nenhum envio novo.
- Não muda: cobranças, Asaas, Mercado Pago, MRR, `plano_meses` e `valor_total`.
