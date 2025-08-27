-- Correção para múltipla seleção de vídeos
-- Primeiro, corrigir dados inconsistentes no banco

-- 1. Garantir que apenas um vídeo por pedido tenha is_base_video = true
-- Para cada pedido, manter apenas o vídeo com selected_for_display = true como base
UPDATE public.pedido_videos 
SET is_base_video = false
WHERE id IN (
  SELECT pv.id 
  FROM public.pedido_videos pv
  WHERE pv.is_base_video = true 
  AND pv.selected_for_display = false
);

-- 2. Sincronizar is_base_video com selected_for_display
UPDATE public.pedido_videos 
SET is_base_video = true
WHERE selected_for_display = true 
AND is_base_video = false;

-- 3. Criar trigger para garantir consistência futura
CREATE OR REPLACE FUNCTION public.ensure_single_base_video()
RETURNS TRIGGER AS $$
BEGIN
  -- Se está marcando como base video ou selecionado para exibição
  IF (TG_OP = 'UPDATE' OR TG_OP = 'INSERT') AND 
     (NEW.is_base_video = true OR NEW.selected_for_display = true) THEN
    
    -- Desmarcar outros vídeos base do mesmo pedido
    UPDATE public.pedido_videos 
    SET 
      is_base_video = false,
      selected_for_display = false,
      updated_at = now()
    WHERE pedido_id = NEW.pedido_id 
    AND id != NEW.id;
    
    -- Garantir que o vídeo atual tenha ambos os flags sincronizados
    IF NEW.selected_for_display = true THEN
      NEW.is_base_video := true;
    END IF;
    
    IF NEW.is_base_video = true THEN
      NEW.selected_for_display := true;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Aplicar trigger na tabela pedido_videos
DROP TRIGGER IF EXISTS ensure_single_base_video_trigger ON public.pedido_videos;
CREATE TRIGGER ensure_single_base_video_trigger
  BEFORE INSERT OR UPDATE ON public.pedido_videos
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_base_video();

-- 5. Log da correção
INSERT INTO public.log_eventos_sistema (
  tipo_evento,
  descricao
) VALUES (
  'VIDEO_SELECTION_FIX',
  'Correção aplicada para problema de múltipla seleção de vídeos - sincronização de is_base_video e selected_for_display'
);