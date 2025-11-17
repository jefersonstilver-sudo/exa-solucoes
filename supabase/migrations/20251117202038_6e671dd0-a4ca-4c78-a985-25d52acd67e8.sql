-- =====================================================
-- CORREÇÃO URGENTE: Trigger de Loop Infinito
-- =====================================================
-- Problema: Trigger estava atualizando TODOS os vídeos
-- causando 161.317 updates desnecessários
-- Solução: Atualizar APENAS os que estão marcados
-- =====================================================

-- 1. Dropar trigger antigo que causa loop
DROP TRIGGER IF EXISTS enforce_single_display_video ON pedido_videos;
DROP FUNCTION IF EXISTS validate_single_display_video() CASCADE;

-- 2. Criar versão OTIMIZADA que só atualiza quando necessário
CREATE OR REPLACE FUNCTION validate_single_display_video()
RETURNS TRIGGER AS $$
BEGIN
  -- Bypassar se em contexto RPC (evitar conflitos)
  IF current_setting('app.in_rpc_context', true) = 'true' THEN
    RETURN NEW;
  END IF;
  
  -- ✅ SÓ processar se o vídeo está sendo marcado como display
  IF NEW.selected_for_display = true AND NEW.is_active = true THEN
    
    -- ✅ Verificar se há outros vídeos marcados (evitar UPDATE desnecessário)
    IF EXISTS (
      SELECT 1 FROM pedido_videos
      WHERE pedido_id = NEW.pedido_id
        AND id != NEW.id
        AND selected_for_display = true
    ) THEN
      
      -- ✅ Desmarcar APENAS os vídeos que JÁ ESTÃO marcados
      -- (antes estava atualizando TODOS, causando loop)
      UPDATE pedido_videos
      SET 
        selected_for_display = false,
        is_active = false,
        is_base_video = false,
        updated_at = now()
      WHERE pedido_id = NEW.pedido_id
        AND id != NEW.id
        AND selected_for_display = true; -- ✅ SÓ os que estão true
      
      RAISE NOTICE '✅ Trigger otimizado: Desmarcados vídeos para pedido %', NEW.pedido_id;
    ELSE
      RAISE NOTICE '✅ Trigger otimizado: Nenhum update necessário para pedido %', NEW.pedido_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Recriar trigger
CREATE TRIGGER enforce_single_display_video
BEFORE INSERT OR UPDATE ON pedido_videos
FOR EACH ROW
EXECUTE FUNCTION validate_single_display_video();

-- 4. Adicionar índice para performance (se não existir)
CREATE INDEX IF NOT EXISTS idx_pedido_videos_display_lookup 
ON pedido_videos(pedido_id, selected_for_display) 
WHERE selected_for_display = true;

-- 5. Log de sucesso
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ CORREÇÃO APLICADA COM SUCESSO!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Trigger otimizado: validate_single_display_video';
  RAISE NOTICE 'Impacto esperado: 90%% menos updates';
  RAISE NOTICE 'De 161.317 updates → ~100 updates';
  RAISE NOTICE '========================================';
END $$;