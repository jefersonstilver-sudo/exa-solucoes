
-- =====================================================
-- FASE 2.2: BLINDAGEM TOTAL - SEARCH_PATH PARA TODAS AS FUNÇÕES
-- Corrige ~160 funções vulneráveis a Function Hijacking
-- Usando assinaturas exatas do banco de dados
-- =====================================================

-- ===== BLOCO 1: FUNÇÕES ADMINISTRATIVAS =====
ALTER FUNCTION public.activate_contract_on_video_selection() SET search_path = public;
ALTER FUNCTION public.activate_video(p_pedido_id uuid, p_pedido_video_id uuid) SET search_path = public;
ALTER FUNCTION public.admin_block_video(p_pedido_video_id uuid, p_block boolean, p_reason text) SET search_path = public;
ALTER FUNCTION public.admin_check_user_exists(user_email text) SET search_path = public;
ALTER FUNCTION public.admin_get_all_user_ids() SET search_path = public;
ALTER FUNCTION public.admin_insert_user(user_id uuid, user_email text, user_role text) SET search_path = public;
ALTER FUNCTION public.admin_unapprove_video(p_pedido_video_id uuid, p_reason text) SET search_path = public;

-- ===== BLOCO 2: FUNÇÕES DE ARQUIVAMENTO E MANUTENÇÃO =====
ALTER FUNCTION public.archive_expired_proposals() SET search_path = public;
ALTER FUNCTION public.atualizar_dias_atraso() SET search_path = public;
ALTER FUNCTION public.audit_unauthorized_uploads() SET search_path = public;
ALTER FUNCTION public.auto_cancel_expired_orders() SET search_path = public;
ALTER FUNCTION public.auto_cleanup_paid_attempts() SET search_path = public;
ALTER FUNCTION public.auto_fix_lost_transactions() SET search_path = public;
ALTER FUNCTION public.auto_recovery_system() SET search_path = public;
ALTER FUNCTION public.auto_update_pedido_status_on_video_approval() SET search_path = public;

-- ===== BLOCO 3: FUNÇÕES DE CÁLCULO =====
ALTER FUNCTION public.calcular_multa_juros(p_valor_original numeric, p_data_vencimento date) SET search_path = public;
ALTER FUNCTION public.calculate_contact_score() SET search_path = public;
ALTER FUNCTION public.calculate_device_stats(device_id uuid, period_start timestamp with time zone, period_end timestamp with time zone) SET search_path = public;
ALTER FUNCTION public.calculate_lifecycle_stage(p_user_id uuid) SET search_path = public;
ALTER FUNCTION public.calculate_response_time() SET search_path = public;

-- ===== BLOCO 4: FUNÇÕES DE VERIFICAÇÃO DE ACESSO =====
ALTER FUNCTION public.can_access_building_contacts() SET search_path = public;
ALTER FUNCTION public.can_access_order(p_pedido_id uuid) SET search_path = public;
ALTER FUNCTION public.can_access_panel_credentials() SET search_path = public;
ALTER FUNCTION public.can_access_pedido_secure(p_pedido_id uuid) SET search_path = public;

-- ===== BLOCO 5: FUNÇÕES CHECK =====
ALTER FUNCTION public.check_campanha_venda_ganha() SET search_path = public;
ALTER FUNCTION public.check_panel_availability(p_panel_id uuid, p_start_date date, p_end_date date) SET search_path = public;
ALTER FUNCTION public.check_super_admin_promotion() SET search_path = public;
ALTER FUNCTION public.check_user_data_integrity() SET search_path = public;

-- ===== BLOCO 6: FUNÇÕES DE LIMPEZA =====
ALTER FUNCTION public.cleanup_old_logs() SET search_path = public;
ALTER FUNCTION public.cleanup_orphaned_users() SET search_path = public;
ALTER FUNCTION public.cleanup_unauthorized_uploads() SET search_path = public;
ALTER FUNCTION public.close_uptime_on_offline() SET search_path = public;

-- ===== BLOCO 7: FUNÇÕES FINANCEIRAS =====
ALTER FUNCTION public.daily_financial_reconciliation() SET search_path = public;
ALTER FUNCTION public.detect_financial_anomalies() SET search_path = public;
ALTER FUNCTION public.diagnose_user_system() SET search_path = public;
ALTER FUNCTION public.emergency_financial_audit_and_fix() SET search_path = public;

-- ===== BLOCO 8: FUNÇÕES DE VÍDEO =====
ALTER FUNCTION public.ensure_base_video_display_status() SET search_path = public;
ALTER FUNCTION public.ensure_video_consistency(p_pedido_id uuid) SET search_path = public;
ALTER FUNCTION public.extract_compliance_data(payment_data jsonb) SET search_path = public;

-- ===== BLOCO 9: FUNÇÕES DE GERAÇÃO =====
ALTER FUNCTION public.generate_building_code() SET search_path = public;
ALTER FUNCTION public.generate_coupon_code(prefix text) SET search_path = public;
ALTER FUNCTION public.generate_secure_temp_password() SET search_path = public;
ALTER FUNCTION public.gerar_tarefa_email_importante() SET search_path = public;

-- ===== BLOCO 10: FUNÇÕES GET =====
ALTER FUNCTION public.get_active_videos_for_panel(p_panel_id text) SET search_path = public;
ALTER FUNCTION public.get_admin_buildings_safe() SET search_path = public;
ALTER FUNCTION public.get_approvals_stats() SET search_path = public;
ALTER FUNCTION public.get_building_contact_info(building_id uuid) SET search_path = public;
ALTER FUNCTION public.get_building_names_public(building_ids uuid[]) SET search_path = public;
ALTER FUNCTION public.get_buildings_for_authenticated_users() SET search_path = public;
ALTER FUNCTION public.get_buildings_for_public_store() SET search_path = public;
ALTER FUNCTION public.get_current_display_videos_batch(p_pedido_ids uuid[]) SET search_path = public;
ALTER FUNCTION public.get_dashboard_stats() SET search_path = public;
ALTER FUNCTION public.get_dashboard_stats_by_month(p_year integer, p_month integer) SET search_path = public;
ALTER FUNCTION public.get_last_12_months_stats() SET search_path = public;
ALTER FUNCTION public.get_last_successful_notion_sync() SET search_path = public;
ALTER FUNCTION public.get_monthly_comparison(p_year integer, p_month integer) SET search_path = public;
ALTER FUNCTION public.get_paid_orders_without_video() SET search_path = public;
ALTER FUNCTION public.get_panel_credentials(p_panel_id uuid) SET search_path = public;
ALTER FUNCTION public.get_panels_basic() SET search_path = public;
ALTER FUNCTION public.get_panels_by_location(lat double precision, lng double precision, radius_meters double precision) SET search_path = public;
ALTER FUNCTION public.get_pedidos_com_clientes() SET search_path = public;
ALTER FUNCTION public.get_pedidos_com_status_correto(p_page integer, p_limit integer, p_status text, p_client_id uuid, p_start_date date, p_end_date date) SET search_path = public;
ALTER FUNCTION public.get_pending_approval_videos() SET search_path = public;
ALTER FUNCTION public.get_provider_benefits_stats_by_month(p_year integer, p_month integer) SET search_path = public;
ALTER FUNCTION public.get_real_approval_stats() SET search_path = public;
ALTER FUNCTION public.get_real_revenue() SET search_path = public;
ALTER FUNCTION public.get_recently_approved_videos() SET search_path = public;
ALTER FUNCTION public.get_unread_notifications_count() SET search_path = public;
ALTER FUNCTION public.get_user_behavior_summary(target_user_id uuid) SET search_path = public;
ALTER FUNCTION public.get_user_role() SET search_path = public;
ALTER FUNCTION public.get_video_current_status(p_video_id uuid) SET search_path = public;

-- ===== BLOCO 11: FUNÇÕES INCREMENT/INVESTIGATE =====
ALTER FUNCTION public.increment_conversation_analytics(p_conversation_id uuid, p_agent_key text, p_phone text) SET search_path = public;
ALTER FUNCTION public.increment_cupom_uso() SET search_path = public;
ALTER FUNCTION public.investigate_missing_transaction(p_email text, p_amount numeric) SET search_path = public;
ALTER FUNCTION public.is_emergency_mode() SET search_path = public;
ALTER FUNCTION public.is_super_admin_secure() SET search_path = public;

-- ===== BLOCO 12: FUNÇÕES LOG =====
ALTER FUNCTION public.log_building_action(p_building_id uuid, p_action_type text, p_description text, p_old_values jsonb, p_new_values jsonb) SET search_path = public;
ALTER FUNCTION public.log_client_activity(p_user_id uuid, p_event_type text, p_event_data jsonb) SET search_path = public;
ALTER FUNCTION public.log_pin_adjustment() SET search_path = public;
ALTER FUNCTION public.mark_notification_read(notification_id uuid) SET search_path = public;

-- ===== BLOCO 13: FUNÇÕES MERCADO PAGO =====
ALTER FUNCTION public.mercadopago_reconciliation_check() SET search_path = public;
ALTER FUNCTION public.migrate_orphaned_payments() SET search_path = public;
ALTER FUNCTION public.monitor_system_health() SET search_path = public;
ALTER FUNCTION public.normalize_phone(phone text) SET search_path = public;

-- ===== BLOCO 14: FUNÇÕES NOTIFY =====
ALTER FUNCTION public.notify_contracts_expiring_soon() SET search_path = public;
ALTER FUNCTION public.notify_new_sale() SET search_path = public;
ALTER FUNCTION public.notify_payment_confirmed() SET search_path = public;
ALTER FUNCTION public.notify_video_status_change() SET search_path = public;
ALTER FUNCTION public.notify_video_uploaded() SET search_path = public;

-- ===== BLOCO 15: FUNÇÕES PREVENT/PROCESS =====
ALTER FUNCTION public.prevent_multiple_config_rows() SET search_path = public;
ALTER FUNCTION public.prevent_orphaned_attempts() SET search_path = public;
ALTER FUNCTION public.process_mercadopago_webhook(webhook_data jsonb) SET search_path = public;
ALTER FUNCTION public.process_mercadopago_webhook_enhanced(p_payment_data jsonb) SET search_path = public;
ALTER FUNCTION public.process_mercadopago_webhook_with_cleanup(p_payment_data jsonb) SET search_path = public;
ALTER FUNCTION public.protect_base_video_always_active() SET search_path = public;

-- ===== BLOCO 16: FUNÇÕES RECOVER/REFRESH/REJECT =====
ALTER FUNCTION public.recover_lost_transactions() SET search_path = public;
ALTER FUNCTION public.refresh_dashboard_metrics() SET search_path = public;
ALTER FUNCTION public.reject_video(p_pedido_video_id uuid, p_approved_by uuid, p_rejection_reason text) SET search_path = public;
ALTER FUNCTION public.resolve_email_conflicts() SET search_path = public;

-- ===== BLOCO 17: FUNÇÕES SAFE/SET/START =====
ALTER FUNCTION public.safe_create_admin_user(p_email text, p_role text, p_password text) SET search_path = public;
ALTER FUNCTION public.set_order_expiration() SET search_path = public;
ALTER FUNCTION public.set_pedido_nome(p_pedido_id uuid, p_nome text) SET search_path = public;
ALTER FUNCTION public.start_contract_on_video_approval() SET search_path = public;
ALTER FUNCTION public.submit_lead_produtora(p_nome text, p_email text, p_whatsapp text, p_empresa text, p_tipo_video text, p_objetivo text, p_agendar_cafe boolean) SET search_path = public;

-- ===== BLOCO 18: FUNÇÕES SWITCH/SYNC =====
ALTER FUNCTION public.switch_video_selection(p_pedido_video_id uuid) SET search_path = public;
ALTER FUNCTION public.sync_user_metadata() SET search_path = public;
ALTER FUNCTION public.sync_video_display_status() SET search_path = public;

-- ===== BLOCO 19: FUNÇÕES UPDATE TRIGGERS - PARTE 1 =====
ALTER FUNCTION public.update_agents_updated_at() SET search_path = public;
ALTER FUNCTION public.update_ai_debug_updated_at() SET search_path = public;
ALTER FUNCTION public.update_building_local_updated_at() SET search_path = public;
ALTER FUNCTION public.update_building_notices_updated_at() SET search_path = public;
ALTER FUNCTION public.update_building_panels_count() SET search_path = public;
ALTER FUNCTION public.update_building_stats() SET search_path = public;
ALTER FUNCTION public.update_calendar_events_updated_at() SET search_path = public;
ALTER FUNCTION public.update_client_behavior_updated_at() SET search_path = public;
ALTER FUNCTION public.update_client_logos_updated_at() SET search_path = public;
ALTER FUNCTION public.update_configuracoes_adicionais_updated_at() SET search_path = public;
ALTER FUNCTION public.update_configuracoes_sindico_updated_at() SET search_path = public;

-- ===== BLOCO 20: FUNÇÕES UPDATE TRIGGERS - PARTE 2 =====
ALTER FUNCTION public.update_contact_last_interaction() SET search_path = public;
ALTER FUNCTION public.update_contratos_updated_at() SET search_path = public;
ALTER FUNCTION public.update_conversation_audit_counts() SET search_path = public;
ALTER FUNCTION public.update_conversation_buildings_updated_at() SET search_path = public;
ALTER FUNCTION public.update_conversation_timestamps() SET search_path = public;
ALTER FUNCTION public.update_daily_report_config_updated_at() SET search_path = public;
ALTER FUNCTION public.update_device_alert_configs_updated_at() SET search_path = public;

-- Função com 2 overloads - corrigindo ambas
ALTER FUNCTION public.update_device_alert_metadata(p_device_id uuid, p_last_offline_alert_at timestamp with time zone, p_offline_alert_count integer, p_triggered_rules text[], p_last_rule_id uuid) SET search_path = public;
ALTER FUNCTION public.update_device_alert_metadata(p_device_id uuid, p_last_offline_alert_at timestamp with time zone, p_offline_alert_count integer, p_triggered_rules text[], p_last_rule_id uuid, p_offline_started_at timestamp with time zone, p_notified_back_online boolean) SET search_path = public;

ALTER FUNCTION public.update_email_customizations_updated_at() SET search_path = public;
ALTER FUNCTION public.update_email_logs_updated_at() SET search_path = public;
ALTER FUNCTION public.update_escalacoes_updated_at() SET search_path = public;
ALTER FUNCTION public.update_exa_alerts_updated_at() SET search_path = public;

-- ===== BLOCO 21: FUNÇÕES UPDATE TRIGGERS - PARTE 3 =====
ALTER FUNCTION public.update_expired_contracts() SET search_path = public;
ALTER FUNCTION public.update_expired_contracts_daily() SET search_path = public;
ALTER FUNCTION public.update_financial_tables_timestamp() SET search_path = public;
ALTER FUNCTION public.update_logos_updated_at() SET search_path = public;
ALTER FUNCTION public.update_notification_preferences_updated_at() SET search_path = public;
ALTER FUNCTION public.update_notion_tasks_updated_at() SET search_path = public;
ALTER FUNCTION public.update_order_status_on_video_approval() SET search_path = public;
ALTER FUNCTION public.update_panel_alerts_updated_at() SET search_path = public;
ALTER FUNCTION public.update_panel_offline_alert_rules_updated_at() SET search_path = public;
ALTER FUNCTION public.update_panel_secure(p_panel_id uuid, p_updates jsonb) SET search_path = public;
ALTER FUNCTION public.update_parcelas_updated_at() SET search_path = public;

-- ===== BLOCO 22: FUNÇÕES UPDATE TRIGGERS - PARTE 4 =====
ALTER FUNCTION public.update_process_updated_at() SET search_path = public;
ALTER FUNCTION public.update_produtos_exa_ultima_alteracao() SET search_path = public;
ALTER FUNCTION public.update_produtos_updated_at() SET search_path = public;
ALTER FUNCTION public.update_proposals_updated_at() SET search_path = public;
ALTER FUNCTION public.update_signatarios_exa_updated_at() SET search_path = public;
ALTER FUNCTION public.update_sindicos_interessados_updated_at() SET search_path = public;
ALTER FUNCTION public.update_thread_message_count_delete() SET search_path = public;
ALTER FUNCTION public.update_thread_message_count_insert() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.update_updated_at_leads_exa() SET search_path = public;
ALTER FUNCTION public.update_user_custom_permissions_updated_at() SET search_path = public;
ALTER FUNCTION public.update_video_projects_timestamp() SET search_path = public;

-- ===== BLOCO 23: FUNÇÕES UPSERT/VALIDATE/VERIFICAR =====
ALTER FUNCTION public.upsert_autocomplete_history(p_field_type text, p_field_value text, p_metadata jsonb, p_display_label text) SET search_path = public;
ALTER FUNCTION public.validate_cupom(p_codigo text, p_meses integer) SET search_path = public;
ALTER FUNCTION public.validate_orientacao() SET search_path = public;
ALTER FUNCTION public.validate_price_integrity(p_transaction_id text, p_expected_price numeric) SET search_path = public;
ALTER FUNCTION public.validate_single_display_video() SET search_path = public;
ALTER FUNCTION public.validate_sistema_operacional() SET search_path = public;
ALTER FUNCTION public.validate_video_specs(p_duracao integer, p_orientacao text, p_tem_audio boolean, p_largura integer, p_altura integer) SET search_path = public;
ALTER FUNCTION public.validate_video_upload_permission(p_pedido_id uuid) SET search_path = public;
ALTER FUNCTION public.validate_video_upload_trigger() SET search_path = public;
ALTER FUNCTION public.verificar_adimplencia_pedido(p_pedido_id uuid) SET search_path = public;

-- ===== COMENTÁRIO FINAL =====
COMMENT ON SCHEMA public IS 'Phase 2.2 Complete: All 160+ functions now have search_path=public to prevent function hijacking attacks';
