-- CORREÇÃO CRÍTICA: Restaurar vídeo base do pedido e melhorar triggers

-- 1. Corrigir o pedido específico que perdeu o vídeo base
UPDATE pedido_videos
SET 
  is_base_video = true,
  selected_for_display = true,
  updated_at = now()
WHERE id = 'ce3f619c-7b6b-47a8-a7a9-295786950094';

-- 2. Desmarcar o vídeo agendado como selecionado (já que não está no horário agora)
UPDATE pedido_videos
SET 
  is_active = false,
  selected_for_display = false,
  updated_at = now()
WHERE id = 'a84d4414-e647-4f64-9da0-d919213b5959';

-- 3. CORRIGIR TRIGGER: validate_single_base_video deve ser mais inteligente
-- Só deve remover is_base_video de outros vídeos quando é uma ação MANUAL do usuário
DROP TRIGGER IF EXISTS validate_single_base_video_trigger ON pedido_videos;

CREATE OR REPLACE FUNCTION validate_single_base_video()
RETURNS TRIGGER AS $$
DECLARE
  base_count INTEGER;
  is_manual_change BOOLEAN;
BEGIN
  -- Se está marcando como vídeo base
  IF NEW.is_base_video = true THEN
    -- Detectar se é mudança manual (OLD.is_base_video era false)
    is_manual_change := (OLD.is_base_video IS NULL OR OLD.is_base_video = false);
    
    -- Contar quantos outros vídeos base existem neste pedido
    SELECT COUNT(*) INTO base_count
    FROM pedido_videos
    WHERE pedido_id = NEW.pedido_id
    AND is_base_video = true
    AND id != NEW.id;
    
    -- Só desmarcar outros se:
    -- 1. É uma mudança manual (usuário clicou "Definir como Principal")
    -- 2. Já existe outro vídeo base
    IF is_manual_change AND base_count > 0 THEN
      UPDATE pedido_videos
      SET 
        is_base_video = false,
        updated_at = now()
      WHERE pedido_id = NEW.pedido_id
      AND id != NEW.id
      AND is_base_video = true;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_single_base_video_trigger
BEFORE INSERT OR UPDATE ON pedido_videos
FOR EACH ROW
WHEN (NEW.is_base_video = true)
EXECUTE FUNCTION validate_single_base_video();

-- 4. Verificar e corrigir TODOS os pedidos sem vídeo base
DO $$
DECLARE
  pedido_record RECORD;
  primeiro_video_id UUID;
  base_count INTEGER;
BEGIN
  FOR pedido_record IN 
    SELECT DISTINCT p.id as pedido_id
    FROM pedidos p
    WHERE p.status IN ('ativo', 'video_aprovado', 'pago_pendente_video', 'video_enviado', 'pago')
  LOOP
    SELECT COUNT(*) INTO base_count
    FROM pedido_videos
    WHERE pedido_id = pedido_record.pedido_id
    AND is_base_video = true;
    
    IF base_count = 0 THEN
      SELECT pv.id INTO primeiro_video_id
      FROM pedido_videos pv
      WHERE pv.pedido_id = pedido_record.pedido_id
      AND pv.approval_status = 'approved'
      ORDER BY pv.created_at ASC
      LIMIT 1;
      
      IF primeiro_video_id IS NOT NULL THEN
        UPDATE pedido_videos
        SET 
          is_base_video = true,
          selected_for_display = true,
          updated_at = now()
        WHERE id = primeiro_video_id;
      END IF;
    END IF;
  END LOOP;
END $$;