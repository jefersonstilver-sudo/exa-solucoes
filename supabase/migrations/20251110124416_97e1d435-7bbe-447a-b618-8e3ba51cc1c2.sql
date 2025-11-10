-- 1. Criar função para garantir que sempre tenha UM vídeo base por pedido
CREATE OR REPLACE FUNCTION enforce_single_base_video()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pedido_id uuid;
  v_approved_count integer;
BEGIN
  -- Determinar pedido_id baseado na operação
  IF TG_OP = 'DELETE' THEN
    v_pedido_id := OLD.pedido_id;
  ELSE
    v_pedido_id := NEW.pedido_id;
  END IF;
  
  -- Se está marcando como base, desmarcar outros do mesmo pedido
  IF TG_OP IN ('INSERT', 'UPDATE') AND NEW.is_base_video = true THEN
    RAISE NOTICE '🔒 [BASE_VIDEO] Desmarcando outros vídeos base para pedido %', NEW.pedido_id;
    
    UPDATE pedido_videos
    SET is_base_video = false,
        selected_for_display = false,
        updated_at = NOW()
    WHERE pedido_id = NEW.pedido_id
      AND id != NEW.id
      AND is_base_video = true;
    
    -- Garantir que este vídeo também está selecionado para exibição
    NEW.selected_for_display := true;
    NEW.is_active := true;
  END IF;
  
  -- Impedir que desmarque o último vídeo base aprovado
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    -- Se está tentando desmarcar um vídeo base
    IF (TG_OP = 'UPDATE' AND OLD.is_base_video = true AND NEW.is_base_video = false) OR
       (TG_OP = 'DELETE' AND OLD.is_base_video = true) THEN
      
      -- Contar quantos vídeos aprovados existem para este pedido
      SELECT COUNT(*) INTO v_approved_count
      FROM pedido_videos
      WHERE pedido_id = v_pedido_id
        AND approval_status = 'approved'
        AND id != COALESCE(OLD.id, NEW.id);
      
      -- Se não há outros vídeos aprovados, não permitir desmarcar/deletar
      IF v_approved_count = 0 THEN
        RAISE EXCEPTION '❌ Não é possível remover o último vídeo principal do pedido. Deve sempre haver um vídeo principal ativo.';
      END IF;
      
      -- Se há outros aprovados, promover o próximo automaticamente
      IF TG_OP = 'UPDATE' THEN
        RAISE NOTICE '⚠️ [BASE_VIDEO] Promovendo próximo vídeo aprovado como base para pedido %', v_pedido_id;
        
        UPDATE pedido_videos
        SET is_base_video = true,
            selected_for_display = true,
            is_active = true,
            updated_at = NOW()
        WHERE id = (
          SELECT id
          FROM pedido_videos
          WHERE pedido_id = v_pedido_id
            AND approval_status = 'approved'
            AND id != NEW.id
          ORDER BY slot_position ASC
          LIMIT 1
        );
      END IF;
    END IF;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- 2. Criar trigger para aplicar a validação
DROP TRIGGER IF EXISTS trigger_enforce_single_base_video ON pedido_videos;
CREATE TRIGGER trigger_enforce_single_base_video
  BEFORE INSERT OR UPDATE OR DELETE ON pedido_videos
  FOR EACH ROW
  EXECUTE FUNCTION enforce_single_base_video();

-- 3. Criar função para garantir que pedidos com vídeos aprovados tenham sempre um base
CREATE OR REPLACE FUNCTION ensure_pedido_has_base_video()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pedido record;
  v_first_video uuid;
BEGIN
  -- Para cada pedido que tem vídeos aprovados mas nenhum base
  FOR v_pedido IN 
    SELECT DISTINCT pv.pedido_id
    FROM pedido_videos pv
    WHERE pv.approval_status = 'approved'
    GROUP BY pv.pedido_id
    HAVING COUNT(CASE WHEN pv.is_base_video = true THEN 1 END) = 0
  LOOP
    RAISE NOTICE '🔧 [FIX] Pedido % sem vídeo base, corrigindo...', v_pedido.pedido_id;
    
    -- Pegar o primeiro vídeo aprovado e promover como base
    SELECT id INTO v_first_video
    FROM pedido_videos
    WHERE pedido_id = v_pedido.pedido_id
      AND approval_status = 'approved'
    ORDER BY slot_position ASC
    LIMIT 1;
    
    IF v_first_video IS NOT NULL THEN
      UPDATE pedido_videos
      SET is_base_video = true,
          selected_for_display = true,
          is_active = true,
          updated_at = NOW()
      WHERE id = v_first_video;
      
      RAISE NOTICE '✅ [FIX] Vídeo % promovido como base para pedido %', v_first_video, v_pedido.pedido_id;
    END IF;
  END LOOP;
END;
$$;

-- 4. Executar a correção para pedidos existentes
SELECT ensure_pedido_has_base_video();

-- 5. Comentários
COMMENT ON FUNCTION enforce_single_base_video() IS 
'Garante que cada pedido tenha SEMPRE exatamente UM vídeo base. 
- Ao marcar um vídeo como base, desmarca os outros automaticamente
- Ao desmarcar/deletar o único vídeo base, promove outro automaticamente
- Impede deletar/desmarcar se for o último vídeo aprovado';

COMMENT ON FUNCTION ensure_pedido_has_base_video() IS 
'Função de manutenção que corrige pedidos sem vídeo base, promovendo o primeiro vídeo aprovado';