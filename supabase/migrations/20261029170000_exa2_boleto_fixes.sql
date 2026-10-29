-- EXA 2.0 · correções do 1º teste de boleto (29/10/2026)
-- 1) sofia_cobrancas aceitava só pix/pix_automatico: o boleto da venda não era registrado
--    (a Sofia não conseguia cancelar nem reconhecer o pagamento dele).
alter table public.sofia_cobrancas drop constraint if exists sofia_cobrancas_kind_check;
alter table public.sofia_cobrancas add constraint sofia_cobrancas_kind_check
  check (kind = any (array['pix'::text, 'pix_automatico'::text, 'boleto'::text]));

-- 2) "respondido até": a Sofia só considera respondida a mensagem que a resposta realmente leu.
--    Sem esta coluna o código caía no modo antigo e engolia mensagens que chegavam no meio de um bloco.
alter table public.sofia_conversations add column if not exists respondido_ate bigint;

create or replace function public.sofia_marcar_respondido(p_conv uuid, p_ate bigint)
returns void language sql set search_path = public as $$
  update public.sofia_conversations
     set respondido_ate = greatest(coalesce(respondido_ate, 0), p_ate)
   where id = p_conv;
$$;
revoke all on function public.sofia_marcar_respondido(uuid, bigint) from public, anon, authenticated;
grant execute on function public.sofia_marcar_respondido(uuid, bigint) to service_role;

-- conversas antigas: tudo o que veio antes da última resposta da Sofia já foi atendido
update public.sofia_conversations c
   set respondido_ate = x.ultimo_in
  from (
    select m.conversation_id,
           max(m.id) filter (where m.direction = 'in'
             and m.id < (select max(o.id) from public.sofia_messages o
                          where o.conversation_id = m.conversation_id and o.direction = 'out_bot')) as ultimo_in
      from public.sofia_messages m
     group by m.conversation_id
  ) x
 where x.conversation_id = c.id and c.respondido_ate is null and x.ultimo_in is not null;
