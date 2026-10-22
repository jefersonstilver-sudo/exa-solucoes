-- Rede de protecao: pedido nunca mais fica sem WhatsApp quando o numero existe.
-- Causa do incidente (pedido ceb9f359, Carlos Alberto): a Sofia gravava users.status, coluna que nao existe;
-- o cadastro inteiro era recusado e o pedido herdava telefone vazio.

-- 1) norm_fone: numero que ja vem com 55 (12 ou 13 digitos) fica como esta.
--    Antes, '554591132351' virava '5554591132351' (55 duplicado).
create or replace function public.norm_fone(t text)
returns text language sql immutable as $$
  select case
    when d ~ '^55' and length(d) in (12, 13) then d
    when length(d) in (10, 11) then '55' || d
    when length(d) > 13 then '55' || right(d, 11)
    else null end
  from (select regexp_replace(coalesce(t, ''), '\D', '', 'g') as d) x
$$;

-- 2) pedido_fill_contato: se o cadastro nao tem telefone, usa o telefone do aceite da Sofia
create or replace function public.pedido_fill_contato()
returns trigger language plpgsql security definer set search_path to 'public' as $$
declare u record; pw text;
begin
  if new.client_id is not null and (coalesce(new.email,'')='' or coalesce(new.whatsapp,'')='') then
    select us.email, us.telefone into u from public.users us where us.id=new.client_id;
    select pr.whatsapp into pw from public.profiles pr where pr.id=new.client_id;
    if coalesce(new.email,'')='' then new.email := lower(u.email); end if;
    if coalesce(new.whatsapp,'')='' then new.whatsapp := public.norm_fone(coalesce(nullif(pw,''),u.telefone)); end if;
  end if;
  if coalesce(new.whatsapp,'')='' and jsonb_typeof(new.log_pagamento)='object'
     and coalesce(new.log_pagamento->>'aceite_id','') ~ '^[0-9a-f-]{36}$' then
    select public.norm_fone(a.dados->>'telefone') into pw
      from public.sofia_aceites a where a.id = (new.log_pagamento->>'aceite_id')::uuid;
    if pw is not null then new.whatsapp := pw; end if;
  end if;
  return new;
end $$;

-- 3) corrige o cadastro e o pedido do Carlos Alberto com os dados do aceite dele na Sofia
update public.users set
  nome = 'Carlos Alberto', primeiro_nome = 'Carlos', sobrenome = 'Alberto',
  telefone = '554591132351', telefone_verificado = true, telefone_verificado_at = now(),
  empresa_documento = '05503127900', empresa_pais = 'BR',
  empresa_aceite_termo = true, empresa_aceite_termo_data = '2026-10-22 13:28:51.512+00'
where id = 'fcf49860-9330-4dd6-a2a1-c58889bb9068' and coalesce(nome, '') = '';

update public.pedidos set whatsapp = '554591132351'
where id = 'ceb9f359-8c59-4683-aee9-b0e9a9fca936' and whatsapp is null;
