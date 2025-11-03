-- Trigger para incrementar automaticamente o uso de cupons
CREATE OR REPLACE FUNCTION public.increment_coupon_usage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Só incrementar se o cupom_id foi definido e o status do pedido permite uso
  IF NEW.cupom_id IS NOT NULL AND NEW.status IN ('pendente', 'pago', 'ativo', 'pago_pendente_video', 'video_enviado', 'video_aprovado') THEN
    -- Incrementar contador de usos
    UPDATE public.cupons
    SET usos_atuais = usos_atuais + 1
    WHERE id = NEW.cupom_id;
    
    -- Log do incremento
    INSERT INTO public.log_eventos_sistema (
      tipo_evento,
      descricao
    ) VALUES (
      'COUPON_USAGE_INCREMENT',
      format('Cupom %s usado no pedido %s por usuário %s', NEW.cupom_id, NEW.id, NEW.client_id)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para INSERT
DROP TRIGGER IF EXISTS trigger_increment_coupon_on_insert ON public.pedidos;
CREATE TRIGGER trigger_increment_coupon_on_insert
  AFTER INSERT ON public.pedidos
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_coupon_usage();

-- Trigger para decrementar quando pedido é cancelado
CREATE OR REPLACE FUNCTION public.decrement_coupon_usage_on_cancel()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Se o pedido foi cancelado e tinha cupom, decrementar contador
  IF OLD.cupom_id IS NOT NULL AND 
     OLD.status NOT IN ('cancelado', 'cancelado_automaticamente') AND
     NEW.status IN ('cancelado', 'cancelado_automaticamente') THEN
    
    UPDATE public.cupons
    SET usos_atuais = GREATEST(0, usos_atuais - 1)
    WHERE id = OLD.cupom_id;
    
    -- Log do decremento
    INSERT INTO public.log_eventos_sistema (
      tipo_evento,
      descricao
    ) VALUES (
      'COUPON_USAGE_DECREMENT',
      format('Cupom %s liberado - pedido %s cancelado', OLD.cupom_id, OLD.id)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para UPDATE (cancelamento)
DROP TRIGGER IF EXISTS trigger_decrement_coupon_on_cancel ON public.pedidos;
CREATE TRIGGER trigger_decrement_coupon_on_cancel
  AFTER UPDATE ON public.pedidos
  FOR EACH ROW
  WHEN (NEW.status IN ('cancelado', 'cancelado_automaticamente'))
  EXECUTE FUNCTION public.decrement_coupon_usage_on_cancel();