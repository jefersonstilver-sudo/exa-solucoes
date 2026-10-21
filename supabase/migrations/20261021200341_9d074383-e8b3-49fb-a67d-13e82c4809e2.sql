CREATE OR REPLACE FUNCTION public.crm_apagar_contato(p_contact uuid, p_confirm text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c record; v_digits text; n_conv int; n_msg int;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin','super_admin')) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem apagar contatos.';
  END IF;
  IF lower(trim(coalesce(p_confirm,''))) <> 'deletar' THEN
    RAISE EXCEPTION 'Confirmação inválida: digite deletar.';
  END IF;
  SELECT * INTO c FROM sofia_contacts WHERE id = p_contact;
  IF NOT FOUND THEN RAISE EXCEPTION 'Contato não encontrado.'; END IF;
  v_digits := regexp_replace(coalesce(c.phone,''), '\D', '', 'g');
  IF EXISTS (SELECT 1 FROM sofia_aceites WHERE contact_id = p_contact AND (pedido_id IS NOT NULL OR accepted_at IS NOT NULL))
     OR EXISTS (SELECT 1 FROM sofia_cobrancas WHERE contact_id = p_contact)
     OR EXISTS (SELECT 1 FROM sofia_links WHERE contact_id = p_contact AND kind IN ('user','usuario','pedido','contrato','cliente'))
     OR (length(v_digits) >= 10 AND EXISTS (SELECT 1 FROM pedidos WHERE right(regexp_replace(coalesce(whatsapp,''),'\D','','g'),10) = right(v_digits,10)))
  THEN
    RAISE EXCEPTION 'Este contato tem conta de cliente, pedido, cobrança ou contrato e não pode ser apagado.';
  END IF;
  SELECT count(*) INTO n_conv FROM sofia_conversations WHERE contact_id = p_contact;
  SELECT count(*) INTO n_msg FROM sofia_messages m JOIN sofia_conversations v ON v.id = m.conversation_id WHERE v.contact_id = p_contact;
  DELETE FROM sofia_video_jobs WHERE contact_id = p_contact;
  DELETE FROM sofia_avisos WHERE contact_id = p_contact;
  DELETE FROM sofia_aceites WHERE contact_id = p_contact;
  DELETE FROM sofia_contacts WHERE id = p_contact;
  RETURN jsonb_build_object('ok', true, 'contato', c.name, 'telefone', c.phone, 'conversas', n_conv, 'mensagens', n_msg);
END $$;
REVOKE ALL ON FUNCTION public.crm_apagar_contato(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.crm_apagar_contato(uuid, text) TO authenticated;
NOTIFY pgrst, 'reload schema';