-- Criar tabela de configurações de alertas comerciais
CREATE TABLE IF NOT EXISTS public.commercial_alerts_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ativo BOOLEAN DEFAULT true,
  horarios_envio JSONB DEFAULT '["09:00", "12:00", "15:00"]',
  dias_semana JSONB DEFAULT '["seg", "ter", "qua", "qui", "sex"]',
  alerta_propostas_pendentes BOOLEAN DEFAULT true,
  alerta_contratos_pendentes BOOLEAN DEFAULT true,
  alerta_propostas_expirando BOOLEAN DEFAULT true,
  template_propostas TEXT DEFAULT '📊 *Relatório Comercial*\n\n⏳ {{pending_count}} propostas aguardando resposta há mais de 24h\n\n📋 Detalhes disponíveis no painel administrativo.',
  template_contratos TEXT DEFAULT '📝 *Contratos Pendentes*\n\n✍️ {{unsigned_count}} contratos aguardando assinatura\n\n📋 Verifique o painel jurídico para mais detalhes.',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.commercial_alerts_config ENABLE ROW LEVEL SECURITY;

-- Política para admins lerem e modificarem
CREATE POLICY "Admins can manage commercial alerts config"
ON public.commercial_alerts_config
FOR ALL
USING (true)
WITH CHECK (true);