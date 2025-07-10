-- LIMPEZA EMERGENCIAL: Remover tentativas órfãs duplicadas
-- Estas tentativas foram criadas APÓS pagamentos confirmados e estão causando duplicidade nos relatórios

-- Log antes da limpeza
INSERT INTO public.log_eventos_sistema (
  tipo_evento,
  descricao
) VALUES (
  'EMERGENCY_ORPHANED_ATTEMPTS_CLEANUP_START',
  'Iniciando limpeza de tentativas órfãs que duplicam pedidos pagos'
);

-- Remover as 2 tentativas órfãs identificadas que correspondem a pedidos já pagos
DELETE FROM public.tentativas_compra 
WHERE id IN (
  '456a5d11-cc9f-4ba9-9349-4aee34bbad1b', -- jefi92@gmail.com R$ 3.08 (após pedido e98ad003-69c2-42cd-9c6b-15ddc4d4dd0b)
  '00c32dca-9b6f-4997-a7d3-90fea14f0af3'  -- andersonmarcelobalbis20@gmail.com R$ 0.14 (após pedido 3bd98f97-da61-4351-999a-3e9a4bdc4cf5)
);

-- Log da limpeza realizada
INSERT INTO public.log_eventos_sistema (
  tipo_evento,
  descricao
) VALUES (
  'EMERGENCY_ORPHANED_ATTEMPTS_CLEANUP_COMPLETED',
  'Removidas 2 tentativas órfãs: 456a5d11 (R$ 3.08) e 00c32dca (R$ 0.14) que duplicavam pedidos pagos'
);

-- CRIAR TRIGGER PARA PREVENÇÃO FUTURA
-- Função que impede criação de tentativas para usuários com pagamentos recentes do mesmo valor
CREATE OR REPLACE FUNCTION prevent_orphaned_attempts()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar se já existe pedido pago com mesmo valor nas últimas 24 horas
  IF EXISTS (
    SELECT 1 FROM public.pedidos 
    WHERE client_id = NEW.id_user 
    AND valor_total = NEW.valor_total
    AND status IN ('pago', 'pago_pendente_video', 'video_enviado', 'video_aprovado', 'ativo')
    AND created_at >= NOW() - INTERVAL '24 hours'
  ) THEN
    -- Log da tentativa bloqueada
    INSERT INTO public.log_eventos_sistema (
      tipo_evento,
      descricao
    ) VALUES (
      'ORPHANED_ATTEMPT_PREVENTED',
      format('Bloqueada criação de tentativa órfã: usuário %s, valor %s', NEW.id_user, NEW.valor_total)
    );
    
    -- Bloquear inserção
    RAISE EXCEPTION 'Tentativa órfã detectada: já existe pedido pago com mesmo valor para este usuário';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger na tabela tentativas_compra
DROP TRIGGER IF EXISTS prevent_orphaned_attempts_trigger ON public.tentativas_compra;
CREATE TRIGGER prevent_orphaned_attempts_trigger
  BEFORE INSERT ON public.tentativas_compra
  FOR EACH ROW
  EXECUTE FUNCTION prevent_orphaned_attempts();