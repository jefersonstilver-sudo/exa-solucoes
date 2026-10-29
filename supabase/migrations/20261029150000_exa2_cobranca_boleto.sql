-- EXA 2.0 — Cobrança por boleto (com Pix no boleto), régua de avisos da Sofia, conciliador e pedido de confiança.
-- Regras (CEO, 29/10/2026):
--   * padrão é Pix Automático; boleto só quando o cliente pede à Sofia;
--   * boleto gerado mês a mês, 10 dias antes do vencimento (dias 5, 10 ou 15); o 1º vence em até 2 dias;
--   * multa 2% + juros 1% a.m.; nunca duas cobranças para a mesma parcela;
--   * 10 dias de atraso = pedido suspenso (sai das telas e não cria vídeo) até pagar;
--   * "pedido de confiança" (admin): libera por 5 dias;
--   * pagamento por fora só pelo admin, com descrição obrigatória.

-- 1) Contato do financeiro na conta do cliente (cliente edita no Perfil; admin e Sofia também)
alter table public.users add column if not exists financeiro_nome text;
alter table public.users add column if not exists financeiro_email text;
alter table public.users add column if not exists financeiro_whatsapp text;

-- 2) Pedido: forma de cobrança e pedido de confiança
alter table public.pedidos add column if not exists forma_cobranca text; -- 'boleto' | 'pix_automatico' | 'pix' (nulo = legado)
alter table public.pedidos add column if not exists confianca_ate timestamptz;
alter table public.pedidos add column if not exists confianca_motivo text;
alter table public.pedidos add column if not exists confianca_por uuid;
alter table public.pedidos add column if not exists asaas_customer_id text;

-- 3) Parcela ligada à cobrança do Asaas (1 parcela = no máximo 1 cobrança viva)
alter table public.parcelas add column if not exists forma text;                 -- 'boleto' | 'pix_automatico' | 'pix' | 'fora'
alter table public.parcelas add column if not exists asaas_payment_id text;
alter table public.parcelas add column if not exists asaas_invoice_url text;
alter table public.parcelas add column if not exists boleto_gerado_em timestamptz;
alter table public.parcelas add column if not exists multa_perdoada boolean not null default false;
alter table public.parcelas add column if not exists pago_fora_descricao text;
alter table public.parcelas add column if not exists pago_fora_por uuid;
alter table public.parcelas add column if not exists asaas_status text;
create unique index if not exists parcelas_asaas_payment_uidx on public.parcelas (asaas_payment_id) where asaas_payment_id is not null;
create unique index if not exists parcelas_pedido_numero_uidx on public.parcelas (pedido_id, numero_parcela);

-- 4) Histórico de avisos (garante que cada aviso sai uma vez só por parcela/canal/destino)
create table if not exists public.exa2_cobranca_avisos (
  id uuid primary key default gen_random_uuid(),
  parcela_id uuid references public.parcelas(id) on delete cascade,
  pedido_id uuid references public.pedidos(id) on delete cascade,
  tipo text not null,      -- boleto_novo | lembrete_5d | vence_amanha | vence_hoje | venceu | atraso_ceo | suspenso | confianca | reativado | pago | email_falhou
  canal text not null,     -- email | whatsapp | ceo
  destino text not null default '',
  ok boolean not null default false,
  detalhe text,
  created_at timestamptz not null default now()
);
create unique index if not exists exa2_cobranca_avisos_uidx on public.exa2_cobranca_avisos (parcela_id, tipo, canal, destino) where parcela_id is not null;
alter table public.exa2_cobranca_avisos enable row level security;
drop policy if exists exa2_cobranca_avisos_admin on public.exa2_cobranca_avisos;
create policy exa2_cobranca_avisos_admin on public.exa2_cobranca_avisos for select
  using (exists (select 1 from public.user_roles r where r.user_id = auth.uid() and r.role::text in ('super_admin','admin','admin_financeiro')));

-- 5) Régua e conciliador a cada 15 minutos (a função respeita 9h–19h para WhatsApp)
do $$ begin
  perform cron.unschedule('exa2-cobranca') where exists (select 1 from cron.job where jobname = 'exa2-cobranca');
  perform cron.schedule('exa2-cobranca', '*/15 * * * *', $c$
    select net.http_post(
      url := 'https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/exa2-cobranca',
      headers := jsonb_build_object('Content-Type','application/json','x-exa2-cron',(select valor from public.exa2_config where chave='cron_token')),
      body := '{"action":"cron"}'::jsonb,
      timeout_milliseconds := 120000);
  $c$);
end $$;
