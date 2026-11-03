-- EXA · Custos do sistema (03/11/2026)
-- Mapa de tudo o que o sistema precisa para funcionar e quanto custa: servidores, banco, IA, mensagens,
-- pagamentos, ferramentas. Fica no Financeiro → "Custos do sistema". Só a diretoria e o financeiro veem e editam.
--   cobranca: 'fixo' (assinatura) | 'uso' (varia com o consumo)
--   fonte:    'medido' (tirado do painel do fornecedor) | 'fatura' (da fatura) | 'estimado' | 'a_confirmar'
--   status:   'ativo' | 'revisar' (talvez dê para cortar) | 'desligado'
create table if not exists public.custos_sistema (
  id uuid primary key default gen_random_uuid(),
  categoria text not null,               -- Servidores e hospedagem | Banco e site | Inteligência artificial | Mensagens e e-mail | Pagamentos e contratos | Ferramentas e licenças | Operação das telas
  servico text not null,                 -- nome curto do item
  fornecedor text not null,
  para_que_serve text,
  quem_depende text,                     -- o que para se isso cair
  cobranca text not null default 'fixo' check (cobranca in ('fixo','uso')),
  moeda text not null default 'USD' check (moeda in ('USD','BRL','EUR')),
  valor_mensal numeric(12,2),            -- na moeda acima; null = ainda sem valor
  fonte text not null default 'a_confirmar' check (fonte in ('medido','fatura','estimado','a_confirmar')),
  status text not null default 'ativo' check (status in ('ativo','revisar','desligado')),
  forma_pagamento text,
  link_painel text,                      -- onde ver a fatura/consumo
  observacao text,
  ordem int not null default 100,
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid default auth.uid(),
  criado_em timestamptz not null default now()
);

alter table public.custos_sistema enable row level security;
drop policy if exists custos_sistema_equipe on public.custos_sistema;
create policy custos_sistema_equipe on public.custos_sistema for all to authenticated
  using (public.exa_eh_equipe(array['super_admin','admin','admin_financeiro']))
  with check (public.exa_eh_equipe(array['super_admin','admin','admin_financeiro']));

create or replace function public.custos_sistema_tocar() returns trigger language plpgsql as $$
begin new.atualizado_em := now(); new.atualizado_por := auth.uid(); return new; end $$;
drop trigger if exists custos_sistema_tocar on public.custos_sistema;
create trigger custos_sistema_tocar before update on public.custos_sistema for each row execute function public.custos_sistema_tocar();

-- Carga inicial (03/11/2026). Valores "medido" vêm do Cost Explorer da AWS (outubro) e do uso do Supabase (ciclo 14/10–14/11).
insert into public.custos_sistema (ordem, categoria, servico, fornecedor, para_que_serve, quem_depende, cobranca, moeda, valor_mensal, fonte, status, forma_pagamento, link_painel, observacao)
select * from (values
  -- Servidores e hospedagem (AWS, conta 9992-3272-4254, região São Paulo)
  (10,'Servidores e hospedagem','Servidor da API das telas (telas-indexa)','AWS (EC2 t3.micro)','Recebe, guarda e entrega os vídeos e a programação dos painéis dos elevadores','Todos os painéis (NUCs) e a TV vertical','fixo','USD',12.50,'medido','ativo','Cartão (AWS)','https://us-east-1.console.aws.amazon.com/costmanagement/home','IP fixo 18.228.252.149'),
  (11,'Servidores e hospedagem','Servidor do WhatsApp (Evolution-CRM)','AWS (EC2 t3.small)','Conecta os números de WhatsApp (Sofia, Nando, Notificações) ao sistema','Sofia, Nando, alertas e CRM','fixo','USD',25.00,'medido','ativo','Cartão (AWS)','https://us-east-1.console.aws.amazon.com/costmanagement/home','Modo de CPU "unlimited": em out/2026 gerou US$ 22,92 extra por excesso de CPU no começo do mês (já parou)'),
  (12,'Servidores e hospedagem','CPU extra do servidor do WhatsApp','AWS (créditos t3)','Cobrança quando o servidor do WhatsApp passa do limite de CPU','—','uso','USD',0.00,'medido','revisar','Cartão (AWS)','https://us-east-1.console.aws.amazon.com/costmanagement/home','Out/2026: US$ 22,92. Nov: zero até agora. Criar alarme de CPU'),
  (13,'Servidores e hospedagem','Discos dos servidores','AWS (EBS gp3)','Disco dos servidores','Servidores acima','fixo','USD',7.60,'estimado','ativo','Cartão (AWS)','https://us-east-1.console.aws.amazon.com/costmanagement/home','50 GB depois de desligar o Typebot (antes 80 GB = US$ 10,98)'),
  (14,'Servidores e hospedagem','IPs públicos','AWS (IPv4)','Endereço público de cada servidor','Servidores acima','fixo','USD',7.44,'estimado','ativo','Cartão (AWS)','https://us-east-1.console.aws.amazon.com/costmanagement/home','2 IPs depois de desligar o Typebot (antes 3 = US$ 11,16)'),
  (15,'Servidores e hospedagem','Conversão de vídeos','AWS (MediaConvert)','Converte os vídeos enviados para o formato dos painéis','Envio de vídeos dos clientes','uso','USD',4.25,'medido','ativo','Cartão (AWS)','https://us-east-1.console.aws.amazon.com/costmanagement/home','Out/2026'),
  (16,'Servidores e hospedagem','Arquivos dos vídeos (S3)','AWS (S3 telas-clientes)','Guarda os vídeos baixados pelos painéis','Painéis','uso','USD',0.30,'medido','ativo','Cartão (AWS)','https://us-east-1.console.aws.amazon.com/costmanagement/home',null),
  (17,'Servidores e hospedagem','Backup do Typebot','AWS (snapshot)','Cópia do disco do Typebot, que foi apagado em 03/11/2026','Nada (só para recuperar se precisar)','fixo','USD',1.50,'estimado','revisar','Cartão (AWS)','https://sa-east-1.console.aws.amazon.com/ec2/home?region=sa-east-1#Snapshots:','Apagar em dez/2026 se ninguém sentir falta do Typebot'),
  (18,'Servidores e hospedagem','Typebot (servidor)','AWS (EC2 t3.medium)','Chatbot antigo, sem uso no sistema','Nada','fixo','USD',0.00,'medido','desligado','Cartão (AWS)',null,'Apagado em 03/11/2026. Custava ~US$ 58/mês'),
  (19,'Servidores e hospedagem','Impostos da AWS','AWS','Imposto cobrado na fatura da AWS','—','uso','USD',14.00,'estimado','ativo','Cartão (AWS)','https://us-east-1.console.aws.amazon.com/billing/home','Out/2026: US$ 19,13 (cai junto com o resto)'),
  -- Banco e site
  (20,'Banco e site','Supabase Pro (organização)','Supabase','Banco de dados, login, funções, arquivos e tempo real de todo o sistema','Tudo: site, painel, Sofia, Nando, telas','fixo','USD',25.00,'fatura','ativo','Cartão (Supabase)','https://supabase.com/dashboard/org/qpskgtmozqksqwsrlxkl/billing','Inclui 250 GB de banda, 5 mi de mensagens em tempo real e 2 mi de chamadas de função por mês'),
  (21,'Banco e site','Supabase · servidores dos projetos','Supabase (Micro compute)','Servidor de cada projeto: EXA MÍDIA, ExaSistema e INDEXA MIDIA','Tudo','uso','USD',30.00,'medido','revisar','Cartão (Supabase)','https://supabase.com/dashboard/org/qpskgtmozqksqwsrlxkl/usage','3 projetos × ~US$ 10, menos US$ 10 de crédito. INDEXA MIDIA está sem uso: transferir para conta gratuita ou apagar economiza ~US$ 10'),
  (22,'Banco e site','Supabase · excedentes','Supabase','Banda e outros acima da cota do plano','—','uso','USD',0.20,'medido','ativo','Cartão (Supabase)','https://supabase.com/dashboard/org/qpskgtmozqksqwsrlxkl/usage','Out–nov/2026: 5,6 GB de banda acima (vídeo da home antiga, já corrigido)'),
  (23,'Banco e site','Lovable','Lovable','Hospeda e publica o site examidia.com.br e faz o deploy das funções','Site no ar e atualizações','fixo','USD',null,'a_confirmar','ativo',null,'https://lovable.dev/settings/billing',null),
  (24,'Banco e site','Domínio examidia.com.br','Registro.br','Endereço do site e dos e-mails','Site e e-mails','fixo','BRL',3.33,'estimado','ativo',null,'https://registro.br','~R$ 40 por ano'),
  (25,'Banco e site','GitHub','GitHub','Guarda o código do sistema e gera o app das TVs','Atualizações do sistema e APK','fixo','USD',null,'a_confirmar','ativo',null,'https://github.com/settings/billing','Provavelmente plano gratuito'),
  (26,'Banco e site','Cloudflare Turnstile (captcha)','Cloudflare','Captcha do cadastro, síndico e esqueci a senha','Formulários públicos','fixo','USD',0.00,'fatura','ativo',null,'https://dash.cloudflare.com','Gratuito'),
  -- Inteligência artificial
  (30,'Inteligência artificial','Anthropic API (Claude) · Nando e funções','Anthropic','IA do Nando (síndicos) e de funções do sistema','Nando','uso','USD',null,'a_confirmar','ativo','Cartão','https://console.anthropic.com/settings/billing','Chaves NANDO_ANTHROPIC_API_KEY e ANTHROPIC_API_KEY'),
  (31,'Inteligência artificial','IA da Sofia','A confirmar','Cérebro da Sofia (vendas no WhatsApp)','Sofia','uso','USD',null,'a_confirmar','ativo',null,null,'Confirmar qual modelo e qual conta pagam a Sofia'),
  (32,'Inteligência artificial','OpenAI API','OpenAI','Transcrição de áudio, análises e textos gerados por IA no painel','Transcrição de áudios, análises do CRM','uso','USD',null,'a_confirmar','ativo','Cartão','https://platform.openai.com/settings/organization/billing',null),
  (33,'Inteligência artificial','Lovable AI (créditos)','Lovable','IA usada por algumas funções através do Lovable','Funções que usam LOVABLE_API_KEY','uso','USD',null,'a_confirmar','revisar',null,'https://lovable.dev/settings/billing',null),
  (34,'Inteligência artificial','ElevenLabs (voz)','ElevenLabs','Voz da Sofia e locução de vídeos','Vídeos com locução (a Sofia por voz foi desligada)','fixo','USD',null,'a_confirmar','revisar','Cartão','https://elevenlabs.io/app/subscription','Conferir se o plano ainda é necessário'),
  (35,'Inteligência artificial','Claude (assinatura da diretoria)','Anthropic','Desenvolvimento, manutenção e segurança do sistema','Evolução do sistema','fixo','USD',null,'a_confirmar','ativo','Cartão','https://claude.ai/settings/billing',null),
  -- Mensagens e e-mail
  (40,'Mensagens e e-mail','Resend (e-mails)','Resend','E-mails do sistema: confirmação de conta, senha, avisos','Cadastro, senha, avisos por e-mail','fixo','USD',null,'a_confirmar','ativo',null,'https://resend.com/settings/billing',null),
  (41,'Mensagens e e-mail','Números de WhatsApp (chips)','Operadora','Linhas da Sofia, do Nando e de Notificações','Sofia, Nando, alertas','fixo','BRL',null,'a_confirmar','ativo',null,null,null),
  (42,'Mensagens e e-mail','Z-API','Z-API','WhatsApp antigo (desativado em 02/11/2026)','Nada','fixo','BRL',null,'a_confirmar','revisar',null,'https://app.z-api.io','Se ainda cobra, cancelar'),
  (43,'Mensagens e e-mail','ManyChat','ManyChat','Automação antiga (desativada em 02/11/2026)','Nada','fixo','USD',null,'a_confirmar','revisar',null,'https://app.manychat.com','Se ainda cobra, cancelar'),
  -- Pagamentos e contratos
  (50,'Pagamentos e contratos','Asaas (taxas de cobrança)','Asaas','Boletos, Pix e cartão dos clientes','Recebimentos','uso','BRL',null,'a_confirmar','ativo','Desconto no repasse','https://www.asaas.com',null),
  (51,'Pagamentos e contratos','Mercado Pago (taxas)','Mercado Pago','Pagamentos antigos pelo site','Pagamentos pelo site','uso','BRL',null,'a_confirmar','revisar','Desconto no repasse','https://www.mercadopago.com.br',null),
  (52,'Pagamentos e contratos','Clicksign','Clicksign','Assinatura eletrônica dos contratos','Contratos de clientes e síndicos','fixo','BRL',null,'a_confirmar','ativo',null,'https://app.clicksign.com',null),
  -- Ferramentas e licenças
  (60,'Ferramentas e licenças','AnyDesk (licença)','AnyDesk','Acesso remoto e status online dos NUCs dos painéis','Monitoramento e manutenção dos painéis','fixo','EUR',null,'a_confirmar','ativo',null,'https://my.anydesk.com',null),
  (61,'Ferramentas e licenças','Notion','Notion','Cadastro de prédios sincronizado com o sistema','Sincronização de prédios','fixo','USD',null,'a_confirmar','ativo',null,'https://www.notion.so',null),
  (62,'Ferramentas e licenças','Google Maps / Mapbox','Google / Mapbox','Mapas da loja e busca de endereço','Mapa de prédios e endereços','uso','USD',0.00,'estimado','ativo',null,'https://console.cloud.google.com/billing','Provavelmente dentro da cota gratuita'),
  -- Operação das telas
  (70,'Operação das telas','Câmeras ao vivo (Portal da Cidade)','Portal da Cidade Foz','Câmeras das pontes e da BR-277 nas telas','Telas (câmeras)','fixo','BRL',null,'a_confirmar','ativo',null,null,'Contrato com o portal'),
  (71,'Operação das telas','Internet dos painéis','Operadoras','Internet de cada prédio','Todos os painéis','fixo','BRL',null,'a_confirmar','ativo',null,null,'Detalhe por prédio no módulo de Internet')
) as v(ordem, categoria, servico, fornecedor, para_que_serve, quem_depende, cobranca, moeda, valor_mensal, fonte, status, forma_pagamento, link_painel, observacao)
where not exists (select 1 from public.custos_sistema);
