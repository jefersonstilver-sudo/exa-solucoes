CREATE OR REPLACE FUNCTION public.crm_apagar_contato(p_contact uuid, p_confirm text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE c record; v_digits text; n_conv int; n_msg int; v_avisos text[] := ARRAY[]::text[]; v_ped_ids uuid[];
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

  -- pedidos ligados ao contato (aceite, cobranca, vinculo ou telefone)
  SELECT array_agg(DISTINCT x) INTO v_ped_ids FROM (
    SELECT pedido_id x FROM sofia_aceites WHERE contact_id = p_contact AND pedido_id IS NOT NULL
    UNION SELECT pedido_id FROM sofia_cobrancas WHERE contact_id = p_contact AND pedido_id IS NOT NULL
    UNION SELECT ref_id::uuid FROM sofia_links WHERE contact_id = p_contact AND kind = 'pedido' AND ref_id::text ~* '^[0-9a-f-]{36}$'
    UNION SELECT id FROM pedidos WHERE length(v_digits) >= 10 AND right(regexp_replace(coalesce(whatsapp,''),'\D','','g'),10) = right(v_digits,10)
  ) s;

  IF EXISTS (SELECT 1 FROM pedidos p WHERE p.id = ANY(coalesce(v_ped_ids, ARRAY[]::uuid[]))
             AND coalesce(p.status,'') NOT IN ('cancelado','cancelado_automaticamente','finalizado','expirado','bloqueado')) THEN
    RAISE EXCEPTION 'Este contato ainda tem pedido em andamento. Cancele ou exclua o pedido antes de apagar o contato.';
  END IF;

  IF EXISTS (SELECT 1 FROM sofia_links l JOIN users u ON u.id::text = l.ref_id::text WHERE l.contact_id = p_contact AND l.kind IN ('user','usuario','cliente'))
     OR (length(v_digits) >= 10 AND EXISTS (SELECT 1 FROM users u WHERE right(regexp_replace(coalesce(u.telefone,''),'\D','','g'),10) = right(v_digits,10))) THEN
    RAISE EXCEPTION 'Este contato tem conta de cliente no site e não pode ser apagado.';
  END IF;

  IF coalesce(array_length(v_ped_ids,1),0) > 0 THEN
    v_avisos := array_append(v_avisos, format('%s pedido(s) antigo(s) ligado(s) a este contato (excluídos, cancelados ou finalizados).', array_length(v_ped_ids,1)));
  END IF;
  IF EXISTS (SELECT 1 FROM sofia_aceites WHERE contact_id = p_contact AND accepted_at IS NOT NULL) THEN
    v_avisos := array_append(v_avisos, 'Aceite(s) confirmado(s) foram mantidos no histórico.');
  END IF;
  IF EXISTS (SELECT 1 FROM sofia_cobrancas WHERE contact_id = p_contact) THEN
    v_avisos := array_append(v_avisos, 'Cobrança(s) foram mantidas no histórico financeiro.');
  END IF;

  SELECT count(*) INTO n_conv FROM sofia_conversations WHERE contact_id = p_contact;
  SELECT count(*) INTO n_msg FROM sofia_messages m JOIN sofia_conversations v ON v.id = m.conversation_id WHERE v.contact_id = p_contact;
  DELETE FROM sofia_video_jobs WHERE contact_id = p_contact;
  DELETE FROM sofia_avisos WHERE contact_id = p_contact;
  DELETE FROM sofia_aceites WHERE contact_id = p_contact AND accepted_at IS NULL AND pedido_id IS NULL;
  DELETE FROM sofia_contacts WHERE id = p_contact;
  RETURN jsonb_build_object('ok', true, 'contato', c.name, 'telefone', c.phone, 'conversas', n_conv, 'mensagens', n_msg, 'avisos', to_jsonb(v_avisos));
END $function$;