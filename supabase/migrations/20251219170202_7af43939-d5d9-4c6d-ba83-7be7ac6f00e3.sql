-- Tabela para aprendizado da Sofia
CREATE TABLE public.sofia_learning (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  category TEXT NOT NULL, -- 'preference', 'insight', 'pattern', 'correction', 'company_info'
  topic TEXT NOT NULL, -- 'exa_midia', 'user_behavior', 'sales_pattern', 'system_knowledge'
  content TEXT NOT NULL,
  confidence DECIMAL(3,2) DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  source TEXT DEFAULT 'conversation', -- 'conversation', 'data_analysis', 'user_feedback', 'system'
  metadata JSONB DEFAULT '{}',
  learned_from_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Índices para performance
CREATE INDEX idx_sofia_learning_category ON public.sofia_learning(category);
CREATE INDEX idx_sofia_learning_user ON public.sofia_learning(user_id);
CREATE INDEX idx_sofia_learning_topic ON public.sofia_learning(topic);
CREATE INDEX idx_sofia_learning_active ON public.sofia_learning(is_active) WHERE is_active = true;
CREATE INDEX idx_sofia_learning_confidence ON public.sofia_learning(confidence DESC);

-- Trigger para updated_at
CREATE TRIGGER update_sofia_learning_updated_at
  BEFORE UPDATE ON public.sofia_learning
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.sofia_learning ENABLE ROW LEVEL SECURITY;

-- Policy para admins lerem e escreverem
CREATE POLICY "Admins can manage sofia learning"
  ON public.sofia_learning
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Policy para service role (edge functions)
CREATE POLICY "Service role full access sofia learning"
  ON public.sofia_learning
  FOR ALL
  USING (auth.role() = 'service_role');

-- Inserir conhecimentos base sobre a EXA Mídia
INSERT INTO public.sofia_learning (category, topic, content, confidence, source) VALUES
('company_info', 'exa_midia', 'A EXA Mídia é uma empresa de mídia indoor que opera painéis digitais em elevadores de prédios residenciais e comerciais.', 0.95, 'system'),
('company_info', 'exa_midia', 'Os painéis da EXA exibem vídeos publicitários de 15 segundos em rotação contínua.', 0.95, 'system'),
('company_info', 'exa_midia', 'Os clientes podem contratar pacotes de 1, 3, 6 ou 12 meses para exibição de vídeos.', 0.95, 'system'),
('company_info', 'exa_midia', 'O sistema Jarvis é o painel administrativo onde gerenciamos pedidos, vídeos, prédios e clientes.', 0.95, 'system'),
('company_info', 'agents', 'Eduardo é um agente de vendas que atende clientes via WhatsApp.', 0.90, 'system'),
('company_info', 'agents', 'Sofia é a assistente de IA que ajuda os administradores a gerenciar o sistema.', 0.95, 'system'),
('system_knowledge', 'paineis', 'Painéis online têm status "online" e última sincronização recente. Painéis offline precisam de atenção.', 0.90, 'system'),
('system_knowledge', 'pedidos', 'Pedidos passam pelos status: pendente -> pago -> pago_pendente_video -> video_enviado -> video_aprovado -> ativo.', 0.95, 'system'),
('system_knowledge', 'videos', 'Vídeos precisam ser aprovados por um admin antes de irem ao ar nos painéis.', 0.95, 'system');