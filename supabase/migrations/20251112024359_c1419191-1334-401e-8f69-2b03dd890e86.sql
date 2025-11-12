-- Criar tabela para configurações adicionais do sistema
CREATE TABLE IF NOT EXISTS public.configuracoes_adicionais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Informações do Site
  site_nome TEXT DEFAULT 'INDEXA',
  site_descricao TEXT DEFAULT 'Plataforma de Painéis Digitais Inteligentes',
  site_slogan TEXT DEFAULT 'Conectando sua mensagem ao mundo',
  site_logo_url TEXT,
  site_favicon_url TEXT,
  
  -- SEO
  seo_keywords TEXT DEFAULT 'painéis digitais, publicidade digital, mídia indoor',
  seo_description TEXT DEFAULT 'Plataforma completa para gestão de painéis digitais e campanhas publicitárias',
  
  -- Contato e Suporte
  contato_email TEXT DEFAULT 'contato@indexa.com.br',
  contato_telefone TEXT DEFAULT '+55 11 0000-0000',
  contato_whatsapp TEXT DEFAULT '+55 11 90000-0000',
  suporte_email TEXT DEFAULT 'suporte@indexa.com.br',
  suporte_horario TEXT DEFAULT 'Segunda a Sexta, 9h às 18h',
  
  -- Endereço
  endereco_rua TEXT,
  endereco_numero TEXT,
  endereco_complemento TEXT,
  endereco_bairro TEXT,
  endereco_cidade TEXT DEFAULT 'São Paulo',
  endereco_estado TEXT DEFAULT 'SP',
  endereco_cep TEXT,
  
  -- Redes Sociais
  social_facebook TEXT,
  social_instagram TEXT,
  social_linkedin TEXT,
  social_twitter TEXT,
  social_youtube TEXT,
  
  -- Configurações de Email (Resend)
  email_remetente_nome TEXT DEFAULT 'INDEXA',
  email_remetente_email TEXT DEFAULT 'noreply@indexa.com.br',
  email_footer_texto TEXT DEFAULT '© 2025 INDEXA. Todos os direitos reservados.',
  
  -- Notificações
  notificacoes_email_ativas BOOLEAN DEFAULT true,
  notificacoes_admin_email TEXT,
  notificacoes_pedidos_novos BOOLEAN DEFAULT true,
  notificacoes_pagamentos BOOLEAN DEFAULT true,
  notificacoes_clientes_novos BOOLEAN DEFAULT true,
  
  -- Segurança
  seguranca_max_tentativas_login INTEGER DEFAULT 5,
  seguranca_tempo_bloqueio_minutos INTEGER DEFAULT 15,
  seguranca_sessao_timeout_minutos INTEGER DEFAULT 480,
  seguranca_ip_whitelist TEXT[],
  
  -- Manutenção e Backup
  manutencao_mensagem TEXT DEFAULT 'Sistema em manutenção. Voltaremos em breve.',
  backup_automatico_ativo BOOLEAN DEFAULT false,
  backup_frequencia TEXT DEFAULT 'daily',
  backup_retencao_dias INTEGER DEFAULT 30,
  
  -- Termos e Políticas
  termos_uso_url TEXT,
  politica_privacidade_url TEXT,
  politica_cookies_url TEXT,
  
  -- Limites e Cotas
  limite_videos_por_cliente INTEGER DEFAULT 5,
  limite_tamanho_video_mb INTEGER DEFAULT 500,
  limite_pedidos_simultaneos INTEGER DEFAULT 10,
  
  -- Integração Externa
  google_analytics_id TEXT,
  google_tag_manager_id TEXT,
  facebook_pixel_id TEXT,
  
  -- Outros
  modo_demonstracao BOOLEAN DEFAULT false,
  mostrar_precos BOOLEAN DEFAULT true,
  permitir_registro_publico BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.configuracoes_adicionais ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: apenas admins podem ver e editar
CREATE POLICY "Apenas super admins podem visualizar configuracoes_adicionais"
  ON public.configuracoes_adicionais
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

CREATE POLICY "Apenas super admins podem atualizar configuracoes_adicionais"
  ON public.configuracoes_adicionais
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

CREATE POLICY "Apenas super admins podem inserir configuracoes_adicionais"
  ON public.configuracoes_adicionais
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Inserir configuração padrão se não existir
INSERT INTO public.configuracoes_adicionais (
  site_nome,
  site_descricao,
  site_slogan
)
SELECT 
  'INDEXA',
  'Plataforma de Painéis Digitais Inteligentes',
  'Conectando sua mensagem ao mundo'
WHERE NOT EXISTS (
  SELECT 1 FROM public.configuracoes_adicionais LIMIT 1
);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_configuracoes_adicionais_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_configuracoes_adicionais_updated_at
  BEFORE UPDATE ON public.configuracoes_adicionais
  FOR EACH ROW
  EXECUTE FUNCTION public.update_configuracoes_adicionais_updated_at();