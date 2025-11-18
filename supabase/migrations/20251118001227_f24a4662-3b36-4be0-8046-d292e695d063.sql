-- LIMPEZA COMPLETA DO SISTEMA - Remover TODOS os pedidos
-- Este script deleta todos os pedidos e dados relacionados do sistema

DO $$
DECLARE
  v_deleted_pedidos INTEGER := 0;
  v_deleted_videos INTEGER := 0;
  v_deleted_schedules INTEGER := 0;
  v_deleted_campaigns INTEGER := 0;
  v_deleted_contratos INTEGER := 0;
BEGIN
  RAISE NOTICE '🧹 INICIANDO LIMPEZA COMPLETA DO SISTEMA';
  RAISE NOTICE '========================================';

  -- 🔓 Ativar flag RPC para bypassar triggers de proteção
  PERFORM set_config('app.in_rpc_context', 'true', true);

  -- Deletar campaign_schedule_rules (regras de agendamento)
  DELETE FROM public.campaign_schedule_rules;
  GET DIAGNOSTICS v_deleted_schedules = ROW_COUNT;
  RAISE NOTICE '✅ Deletadas % regras de agendamento', v_deleted_schedules;

  -- Deletar campaign_video_schedules (agendamentos de vídeo)
  DELETE FROM public.campaign_video_schedules;
  RAISE NOTICE '✅ Deletados agendamentos de vídeo';

  -- Deletar campaigns_advanced (campanhas)
  DELETE FROM public.campaigns_advanced;
  GET DIAGNOSTICS v_deleted_campaigns = ROW_COUNT;
  RAISE NOTICE '✅ Deletadas % campanhas', v_deleted_campaigns;

  -- Deletar pedido_videos (vídeos dos pedidos)
  DELETE FROM public.pedido_videos;
  GET DIAGNOSTICS v_deleted_videos = ROW_COUNT;
  RAISE NOTICE '✅ Deletados % vídeos de pedidos', v_deleted_videos;

  -- Deletar contratos
  DELETE FROM public.contratos;
  GET DIAGNOSTICS v_deleted_contratos = ROW_COUNT;
  RAISE NOTICE '✅ Deletados % contratos', v_deleted_contratos;

  -- Deletar cupom_aplicacoes (aplicações de cupom)
  DELETE FROM public.cupom_aplicacoes;
  RAISE NOTICE '✅ Deletadas aplicações de cupom';

  -- Deletar tentativas_compra
  DELETE FROM public.tentativas_compra;
  RAISE NOTICE '✅ Deletadas tentativas de compra';

  -- Deletar TODOS os pedidos
  DELETE FROM public.pedidos;
  GET DIAGNOSTICS v_deleted_pedidos = ROW_COUNT;
  RAISE NOTICE '✅ Deletados % pedidos', v_deleted_pedidos;

  -- 🔒 Resetar flag RPC
  PERFORM set_config('app.in_rpc_context', NULL, true);

  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ LIMPEZA COMPLETA CONCLUÍDA';
  RAISE NOTICE '📊 Total deletado:';
  RAISE NOTICE '   - Pedidos: %', v_deleted_pedidos;
  RAISE NOTICE '   - Vídeos: %', v_deleted_videos;
  RAISE NOTICE '   - Campanhas: %', v_deleted_campaigns;
  RAISE NOTICE '   - Contratos: %', v_deleted_contratos;
  RAISE NOTICE '   - Regras Agendamento: %', v_deleted_schedules;
  RAISE NOTICE '========================================';

EXCEPTION
  WHEN OTHERS THEN
    -- Resetar flag em caso de erro
    PERFORM set_config('app.in_rpc_context', NULL, true);
    RAISE NOTICE '❌ ERRO NA LIMPEZA: %', SQLERRM;
    RAISE EXCEPTION 'Erro na limpeza do sistema: %', SQLERRM;
END $$;