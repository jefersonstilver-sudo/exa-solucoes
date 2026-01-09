-- FASE 2: HARDENING RLS - VERSÃO SIMPLIFICADA
-- Removido notion_tasks complexo, será tratado separadamente

-- SEÇÃO 1: FUNÇÕES DE SEGURANÇA
CREATE OR REPLACE FUNCTION public.is_admin_or_super()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin')); $$;

CREATE OR REPLACE FUNCTION public.has_any_admin_role()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin', 'admin_financeiro', 'admin_marketing', 'comercial')); $$;

CREATE OR REPLACE FUNCTION public.is_finance_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin', 'admin_financeiro')); $$;

-- SEÇÃO 2: agents
DROP POLICY IF EXISTS "Allow authenticated users full access to agents" ON public.agents;
DROP POLICY IF EXISTS "Allow public read access to agents" ON public.agents;
CREATE POLICY "Admins can manage agents" ON public.agents FOR ALL TO authenticated USING (public.is_admin_or_super()) WITH CHECK (public.is_admin_or_super());
CREATE POLICY "Public can read active agents" ON public.agents FOR SELECT TO anon, authenticated USING (is_active = true);

-- SEÇÃO 3: assinaturas
DROP POLICY IF EXISTS "Assinaturas editáveis por admins" ON public.assinaturas;
DROP POLICY IF EXISTS "Assinaturas visíveis para usuários autenticados" ON public.assinaturas;
CREATE POLICY "Finance admins manage assinaturas" ON public.assinaturas FOR ALL TO authenticated USING (public.is_finance_admin()) WITH CHECK (public.is_finance_admin());
CREATE POLICY "Clients view own assinaturas" ON public.assinaturas FOR SELECT TO authenticated USING (client_id = auth.uid());

-- SEÇÃO 4: contacts
DROP POLICY IF EXISTS "Usuários autenticados podem ver contatos" ON public.contacts;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar contatos" ON public.contacts;
DROP POLICY IF EXISTS "Usuários autenticados podem criar contatos" ON public.contacts;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar contatos" ON public.contacts;
CREATE POLICY "Admin sales manage contacts" ON public.contacts FOR ALL TO authenticated USING (public.has_any_admin_role()) WITH CHECK (public.has_any_admin_role());

-- SEÇÃO 5: contratos_legais
DROP POLICY IF EXISTS "Admins can view all contracts" ON public.contratos_legais;
DROP POLICY IF EXISTS "Admins can insert contracts" ON public.contratos_legais;
DROP POLICY IF EXISTS "Admins can update contracts" ON public.contratos_legais;
DROP POLICY IF EXISTS "Admins can delete contracts" ON public.contratos_legais;
CREATE POLICY "Admins manage contracts" ON public.contratos_legais FOR ALL TO authenticated USING (public.is_admin_or_super()) WITH CHECK (public.is_admin_or_super());

-- SEÇÃO 6: messages
DROP POLICY IF EXISTS "allow_read_messages" ON public.messages;
DROP POLICY IF EXISTS "authenticated_read_messages" ON public.messages;
DROP POLICY IF EXISTS "service_role_insert_messages" ON public.messages;
DROP POLICY IF EXISTS "service_role_manage_messages" ON public.messages;
DROP POLICY IF EXISTS "system_manage_messages" ON public.messages;
CREATE POLICY "Admins read messages" ON public.messages FOR SELECT TO authenticated USING (public.has_any_admin_role());
CREATE POLICY "Service role manages messages" ON public.messages FOR ALL TO service_role USING (true) WITH CHECK (true);

-- SEÇÃO 7: notion_tasks - Apenas admins
DROP POLICY IF EXISTS "Authenticated users can read notion_tasks" ON public.notion_tasks;
DROP POLICY IF EXISTS "Authenticated users can insert notion_tasks" ON public.notion_tasks;
DROP POLICY IF EXISTS "Authenticated users can update notion_tasks" ON public.notion_tasks;
DROP POLICY IF EXISTS "Authenticated users can delete notion_tasks" ON public.notion_tasks;
CREATE POLICY "Admins manage notion_tasks" ON public.notion_tasks FOR ALL TO authenticated USING (public.has_any_admin_role()) WITH CHECK (public.has_any_admin_role());

-- SEÇÃO 8: panel_offline_alert_rules
DROP POLICY IF EXISTS "Admins can manage alert rules" ON public.panel_offline_alert_rules;
CREATE POLICY "Admins manage alert rules" ON public.panel_offline_alert_rules FOR ALL TO authenticated USING (public.is_admin_or_super()) WITH CHECK (public.is_admin_or_super());

-- SEÇÃO 9: campanhas_exa
DROP POLICY IF EXISTS "Campanhas editáveis por admins" ON public.campanhas_exa;
DROP POLICY IF EXISTS "Campanhas visíveis para usuários autenticados" ON public.campanhas_exa;
CREATE POLICY "Admins manage campanhas_exa" ON public.campanhas_exa FOR ALL TO authenticated USING (public.is_admin_or_super()) WITH CHECK (public.is_admin_or_super());

-- SEÇÃO 10: calendar_events
DROP POLICY IF EXISTS "calendar_events_select" ON public.calendar_events;
DROP POLICY IF EXISTS "calendar_events_insert" ON public.calendar_events;
DROP POLICY IF EXISTS "calendar_events_update" ON public.calendar_events;
DROP POLICY IF EXISTS "calendar_events_delete" ON public.calendar_events;
CREATE POLICY "Users manage own events" ON public.calendar_events FOR ALL TO authenticated USING (created_by = auth.uid() OR public.has_any_admin_role()) WITH CHECK (created_by = auth.uid() OR public.has_any_admin_role());

-- SEÇÃO 11: PROTEÇÃO FINANCEIRA
DROP POLICY IF EXISTS "Enable delete for authenticated users and service role" ON public.pedidos;
CREATE POLICY "Only admins delete pedidos" ON public.pedidos FOR DELETE TO authenticated USING (public.is_admin_or_super());

DROP POLICY IF EXISTS "No delete on cobrancas" ON public.cobrancas;
CREATE POLICY "Only admins delete cobrancas" ON public.cobrancas FOR DELETE TO authenticated USING (public.is_admin_or_super());

DROP POLICY IF EXISTS "No delete on parcelas" ON public.parcelas;
CREATE POLICY "Only admins delete parcelas" ON public.parcelas FOR DELETE TO authenticated USING (public.is_admin_or_super());

-- SEÇÃO 12: FUNÇÕES - search_path
ALTER FUNCTION public.handle_updated_at() SET search_path = public;
ALTER FUNCTION public.generate_contract_number() SET search_path = public;
ALTER FUNCTION public.generate_proposal_number() SET search_path = public;
ALTER FUNCTION public.is_super_admin() SET search_path = public;
ALTER FUNCTION public.cleanup_expired_sessions() SET search_path = public;
ALTER FUNCTION public.cleanup_expired_user_sessions() SET search_path = public;
ALTER FUNCTION public.gerar_cobrancas_mensais() SET search_path = public;
ALTER FUNCTION public.cancel_expired_orders() SET search_path = public;

COMMENT ON FUNCTION public.is_admin_or_super() IS 'SECURITY DEFINER - Admin/Super check';
COMMENT ON FUNCTION public.has_any_admin_role() IS 'SECURITY DEFINER - Any admin role check';
COMMENT ON FUNCTION public.is_finance_admin() IS 'SECURITY DEFINER - Finance admin check';