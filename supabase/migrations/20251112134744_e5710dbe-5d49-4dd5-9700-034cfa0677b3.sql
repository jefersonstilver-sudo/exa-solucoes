
-- ====================================================================
-- SOLUÇÃO MAIS SIMPLES: Usar ALTER FUNCTION para mudar apenas o search_path
-- ====================================================================

-- Alterar search_path de todas as funções problemáticas
ALTER FUNCTION activate_scheduled_video(uuid, uuid) SET search_path = public;
ALTER FUNCTION approve_video(uuid, uuid) SET search_path = public;
ALTER FUNCTION auto_activate_first_video() SET search_path = public;
ALTER FUNCTION auto_assign_base_video_on_approval() SET search_path = public;
ALTER FUNCTION auto_set_first_approved_video_as_base() SET search_path = public;
ALTER FUNCTION auto_set_first_approved_video_as_base_safe() SET search_path = public;
ALTER FUNCTION can_remove_video(uuid) SET search_path = public;
ALTER FUNCTION enforce_single_active_video_per_order() SET search_path = public;
ALTER FUNCTION ensure_pedido_has_base_video() SET search_path = public;
ALTER FUNCTION ensure_single_selected_for_display() SET search_path = public;
ALTER FUNCTION get_building_active_campaigns(uuid) SET search_path = public;
ALTER FUNCTION get_buildings_current_video_count(uuid[]) SET search_path = public;
ALTER FUNCTION get_current_display_video(uuid) SET search_path = public;
ALTER FUNCTION get_pedidos_com_status_correto() SET search_path = public;
ALTER FUNCTION get_pedidos_com_status_inteligente() SET search_path = public;
ALTER FUNCTION protect_base_video_smart() SET search_path = public;
ALTER FUNCTION protect_last_principal_video() SET search_path = public;
ALTER FUNCTION reactivate_base_video_when_no_scheduled() SET search_path = public;
ALTER FUNCTION set_base_video_enhanced(uuid) SET search_path = public;
ALTER FUNCTION validate_base_video_changes() SET search_path = public;
ALTER FUNCTION validate_single_base_video() SET search_path = public;
