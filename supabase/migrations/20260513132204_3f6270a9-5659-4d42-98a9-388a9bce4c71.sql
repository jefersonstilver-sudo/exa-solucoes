
-- ============================================================
-- 1. PRIVILEGE ESCALATION FIX: user_roles
-- ============================================================
DROP POLICY IF EXISTS "Super admins can insert roles directly" ON public.user_roles;
-- "Super admins can manage all roles" (ALL with has_role super_admin) already covers legitimate inserts.

-- ============================================================
-- 2. ai_reports_log — admin-only read
-- ============================================================
DROP POLICY IF EXISTS "Admin can view all reports" ON public.ai_reports_log;
DROP POLICY IF EXISTS "System can insert reports" ON public.ai_reports_log;

CREATE POLICY "Admins can view ai_reports_log"
  ON public.ai_reports_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Service role can insert ai_reports_log"
  ON public.ai_reports_log FOR INSERT TO service_role
  WITH CHECK (true);

-- ============================================================
-- 3. conversation_heat_metrics — service_role only for writes
-- ============================================================
DROP POLICY IF EXISTS "Service role full access to conversation_heat_metrics" ON public.conversation_heat_metrics;

CREATE POLICY "Service role full access conversation_heat_metrics"
  ON public.conversation_heat_metrics FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================================
-- 4. commercial_alerts_config — admin only
-- ============================================================
DROP POLICY IF EXISTS "Admins can manage commercial alerts config" ON public.commercial_alerts_config;

CREATE POLICY "Admins can manage commercial_alerts_config"
  ON public.commercial_alerts_config FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- ============================================================
-- 5. contrato_signatarios — admins only
-- ============================================================
DROP POLICY IF EXISTS "Admins can manage contrato_signatarios" ON public.contrato_signatarios;
DROP POLICY IF EXISTS "Authenticated users can view signatarios" ON public.contrato_signatarios;
DROP POLICY IF EXISTS "Authenticated users can insert signatarios" ON public.contrato_signatarios;
DROP POLICY IF EXISTS "Authenticated users can update signatarios" ON public.contrato_signatarios;
DROP POLICY IF EXISTS "Authenticated users can delete signatarios" ON public.contrato_signatarios;

CREATE POLICY "Admins manage contrato_signatarios"
  ON public.contrato_signatarios FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- ============================================================
-- 6. escalacoes_comerciais — admin only
-- ============================================================
DROP POLICY IF EXISTS "Admin pode ver escalações" ON public.escalacoes_comerciais;
DROP POLICY IF EXISTS "Admin pode atualizar escalações" ON public.escalacoes_comerciais;
DROP POLICY IF EXISTS "Sistema pode inserir escalações" ON public.escalacoes_comerciais;

CREATE POLICY "Admins view escalacoes_comerciais"
  ON public.escalacoes_comerciais FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins update escalacoes_comerciais"
  ON public.escalacoes_comerciais FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Service role insert escalacoes_comerciais"
  ON public.escalacoes_comerciais FOR INSERT TO service_role
  WITH CHECK (true);

-- ============================================================
-- 7. escalacao_vendedores — admin only
-- ============================================================
DROP POLICY IF EXISTS "Admin pode ver vendedores" ON public.escalacao_vendedores;
DROP POLICY IF EXISTS "Admin pode atualizar vendedores" ON public.escalacao_vendedores;
DROP POLICY IF EXISTS "Admin pode inserir vendedores" ON public.escalacao_vendedores;

CREATE POLICY "Admins manage escalacao_vendedores"
  ON public.escalacao_vendedores FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- ============================================================
-- 8. agent_sections / agent_knowledge_items — authenticated reads only
-- ============================================================
DROP POLICY IF EXISTS "Allow public read access to agent_sections" ON public.agent_sections;
DROP POLICY IF EXISTS "Public read sections" ON public.agent_sections;
DROP POLICY IF EXISTS "Auth manage sections" ON public.agent_sections;

CREATE POLICY "Authenticated read agent_sections"
  ON public.agent_sections FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admin manage agent_sections"
  ON public.agent_sections FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Allow public read access to agent_knowledge_items" ON public.agent_knowledge_items;
DROP POLICY IF EXISTS "Public read items" ON public.agent_knowledge_items;
DROP POLICY IF EXISTS "Auth manage items" ON public.agent_knowledge_items;

CREATE POLICY "Authenticated read agent_knowledge_items"
  ON public.agent_knowledge_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admin manage agent_knowledge_items"
  ON public.agent_knowledge_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- ============================================================
-- 9. proposal_notification_settings — scope to proposal ownership
-- ============================================================
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.proposal_notification_settings;

CREATE POLICY "Admins manage proposal_notification_settings"
  ON public.proposal_notification_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin_marketing') OR public.has_role(auth.uid(), 'admin_financeiro'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin_marketing') OR public.has_role(auth.uid(), 'admin_financeiro'));

-- ============================================================
-- 10. paineis_status — restrict public writes (kiosk should use edge function with service role)
-- ============================================================
DROP POLICY IF EXISTS "Painéis podem atualizar seu próprio status" ON public.paineis_status;
DROP POLICY IF EXISTS "Painéis podem atualizar seu próprio status - update" ON public.paineis_status;

CREATE POLICY "Service role writes paineis_status"
  ON public.paineis_status FOR INSERT TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role updates paineis_status"
  ON public.paineis_status FOR UPDATE TO service_role
  USING (true) WITH CHECK (true);
