-- Criar função RPC para auto-cancelamento após 5 horas com DELEÇÃO
CREATE OR REPLACE FUNCTION public.auto_cancel_orders_5h()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    canceled_count integer := 0;
    pending_order RECORD;
BEGIN
    -- Loop através de todos os pedidos pendentes há mais de 5 horas
    FOR pending_order IN 
        SELECT p.*
        FROM pedidos p
        WHERE p.status IN ('pendente', 'aguardando_pagamento')
        AND p.created_at < NOW() - INTERVAL '5 hours'
    LOOP
        -- Inserir no log de pedidos cancelados
        INSERT INTO pedidos_cancelados_log (
            pedido_id,
            client_id,
            motivo,
            valor_total,
            status_anterior,
            created_at,
            cancelado_em,
            dados_pedido
        ) VALUES (
            pending_order.id,
            pending_order.client_id,
            'auto_cancelamento_5h_nao_pago',
            pending_order.valor_total,
            pending_order.status,
            pending_order.created_at,
            NOW(),
            row_to_json(pending_order)::jsonb
        );
        
        -- Deletar tentativas de compra relacionadas
        DELETE FROM tentativas_compra WHERE id_user = pending_order.client_id;
        
        -- Deletar o pedido da tabela principal
        DELETE FROM pedidos WHERE id = pending_order.id;
        
        canceled_count := canceled_count + 1;
    END LOOP;
    
    RETURN canceled_count;
END;
$$;

-- Executar limpeza inicial dos pedidos pendentes atuais
SELECT public.auto_cancel_orders_5h();