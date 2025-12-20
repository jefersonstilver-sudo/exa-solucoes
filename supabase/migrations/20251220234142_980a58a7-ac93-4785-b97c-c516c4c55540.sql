-- =============================================
-- FASE 1: MATURIDADE OPERACIONAL - DETECÇÃO DE FALHA SILENCIOSA
-- =============================================

-- 1. Adicionar colunas de delivery tracking na tabela messages
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS delivery_checked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS delivery_retry_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS delivery_last_error TEXT,
ADD COLUMN IF NOT EXISTS parent_message_id UUID REFERENCES public.messages(id);

-- 2. Criar índice para queries de monitoramento
CREATE INDEX IF NOT EXISTS idx_messages_delivery_status 
ON public.messages(delivery_status, direction, created_at) 
WHERE direction = 'outbound';

-- 3. Criar tabela de alertas do sistema
CREATE TABLE IF NOT EXISTS public.system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  related_message_id UUID REFERENCES public.messages(id),
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_by UUID,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Criar índice para alertas não reconhecidos
CREATE INDEX IF NOT EXISTS idx_system_alerts_unacknowledged 
ON public.system_alerts(severity, created_at) 
WHERE acknowledged = FALSE;

-- 5. Criar tabela de circuit breaker state
CREATE TABLE IF NOT EXISTS public.delivery_circuit_breaker (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_key TEXT NOT NULL UNIQUE,
  state TEXT NOT NULL DEFAULT 'closed' CHECK (state IN ('closed', 'open', 'half_open')),
  failure_count INTEGER DEFAULT 0,
  last_failure_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  cooldown_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Criar tabela de auditoria de replay (preparação para Gap A)
CREATE TABLE IF NOT EXISTS public.replay_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_message_id UUID REFERENCES public.messages(id),
  new_message_id UUID REFERENCES public.messages(id),
  replayed_by UUID,
  reason TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. RLS para system_alerts (apenas admins podem ver/modificar)
ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all alerts" 
ON public.system_alerts FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'gerente_master', 'gerente')
  )
);

CREATE POLICY "Admins can acknowledge alerts" 
ON public.system_alerts FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'gerente_master', 'gerente')
  )
);

-- 8. RLS para replay_audit (apenas admins)
ALTER TABLE public.replay_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view replay audit" 
ON public.replay_audit FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'gerente_master', 'gerente')
  )
);

CREATE POLICY "Admins can create replay audit" 
ON public.replay_audit FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'gerente_master', 'gerente')
  )
);

-- 9. RLS para circuit breaker (service role only - edge functions)
ALTER TABLE public.delivery_circuit_breaker ENABLE ROW LEVEL SECURITY;

-- Comentário: Esta tabela é gerenciada apenas por edge functions via service_role