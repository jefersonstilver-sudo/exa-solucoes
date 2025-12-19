-- Create table for Sofia Client knowledge base
CREATE TABLE public.sofia_client_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL, -- 'produto', 'pagamento', 'funcionalidade', 'suporte'
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sofia_client_knowledge ENABLE ROW LEVEL SECURITY;

-- Public read policy (knowledge is public)
CREATE POLICY "Knowledge base is publicly readable"
ON public.sofia_client_knowledge
FOR SELECT
USING (is_active = true);

-- Admin write policy
CREATE POLICY "Admins can manage knowledge base"
ON public.sofia_client_knowledge
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role IN ('super_admin', 'admin')
  )
);

-- Create index for keyword search
CREATE INDEX idx_sofia_client_knowledge_keywords ON public.sofia_client_knowledge USING GIN(keywords);
CREATE INDEX idx_sofia_client_knowledge_category ON public.sofia_client_knowledge(category);

-- Trigger for updated_at
CREATE TRIGGER update_sofia_client_knowledge_updated_at
BEFORE UPDATE ON public.sofia_client_knowledge
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial knowledge data
INSERT INTO public.sofia_client_knowledge (category, question, answer, keywords, display_order) VALUES

-- PRODUTOS
('produto', 'O que é o painel Horizontal?', 
'O painel Horizontal é nosso formato tradicional com proporção 4:3 (1440x1080 pixels). Cada vídeo tem 10 segundos de exibição e o painel é compartilhado entre até 15 anunciantes. É ideal para mensagens curtas e impactantes!', 
ARRAY['horizontal', 'painel', '4:3', '1440', '1080', '10 segundos', '15 clientes'], 1),

('produto', 'O que é o painel Vertical Premium?', 
'O Vertical Premium é nosso formato exclusivo com proporção 9:16 (1080x1920 pixels), igual ao celular! Cada vídeo tem 15 segundos e você é o ÚNICO anunciante no elevador. Máxima visibilidade e impacto para sua marca!', 
ARRAY['vertical', 'premium', '9:16', '1080', '1920', '15 segundos', 'exclusivo'], 2),

('produto', 'Qual a diferença entre Horizontal e Vertical?', 
'O Horizontal é compartilhado com outros anunciantes (até 15) e tem 10s de exibição. O Vertical Premium é EXCLUSIVO só para você, com 15s e formato de celular. O Vertical tem mais impacto mas custa um pouco mais!', 
ARRAY['diferença', 'comparação', 'horizontal', 'vertical'], 3),

('produto', 'Quanto tempo meu vídeo fica exibindo?', 
'No formato Horizontal são 10 segundos por exibição. No Vertical Premium são 15 segundos. Os vídeos rodam em loop durante todo o horário comercial do prédio, gerando milhares de visualizações por mês!', 
ARRAY['tempo', 'duração', 'segundos', 'exibição'], 4),

-- PAGAMENTO
('pagamento', 'Quais são as formas de pagamento?', 
'Aceitamos PIX (aprovação instantânea!), cartão de crédito em até 12x, e boleto bancário. O PIX é o mais rápido - seu anúncio pode começar a rodar no mesmo dia após aprovação do vídeo!', 
ARRAY['pagamento', 'pix', 'cartão', 'boleto', 'parcelamento'], 10),

('pagamento', 'Posso parcelar?', 
'Sim! Você pode parcelar em até 12x no cartão de crédito. Para contratos semestrais ou anuais, também oferecemos condições especiais de parcelamento. Fale com nosso time comercial para negociar!', 
ARRAY['parcelamento', 'parcelas', '12x', 'cartão'], 11),

('pagamento', 'Como pagar com PIX?', 
'É super fácil! Na hora do checkout, escolha PIX e vou gerar um QR Code na tela. Basta escanear com seu celular e pagar. A confirmação é instantânea e seu pedido já entra em processamento!', 
ARRAY['pix', 'qr code', 'qrcode', 'instantâneo'], 12),

-- FUNCIONALIDADES
('funcionalidade', 'Como envio meu vídeo?', 
'Após fechar o pedido, vá em "Meus Pedidos", clique no pedido e depois em "Enviar Vídeo". Aceito MP4 ou MOV de até 50MB. Após o envio, nossa equipe analisa em até 24h e você recebe a aprovação por email!', 
ARRAY['enviar', 'upload', 'vídeo', 'video', 'mp4', 'mov'], 20),

('funcionalidade', 'Posso trocar meu vídeo depois?', 
'Sim! Você pode trocar seu vídeo a qualquer momento durante a campanha. Basta ir em "Meus Pedidos", selecionar o pedido ativo e clicar em "Trocar Vídeo". A troca é aprovada em até 24h!', 
ARRAY['trocar', 'substituir', 'alterar', 'vídeo'], 21),

('funcionalidade', 'Como vejo os prédios disponíveis?', 
'Vá em "Explorar Prédios" no menu. Lá você vê todos os prédios ativos com fotos, localização no mapa, quantidade de elevadores e público estimado. Pode filtrar por bairro e adicionar ao carrinho!', 
ARRAY['prédios', 'predios', 'disponíveis', 'explorar', 'mapa'], 22),

('funcionalidade', 'Onde vejo meus pedidos?', 
'Clique em "Meus Pedidos" no menu lateral. Lá você vê todos seus pedidos, o status de cada um, datas de início e fim, e pode gerenciar seus vídeos. Pedidos ativos ficam destacados em verde!', 
ARRAY['pedidos', 'meus pedidos', 'status', 'acompanhar'], 23),

('funcionalidade', 'Como funciona a aprovação do vídeo?', 
'Após enviar seu vídeo, nossa equipe analisa em até 24 horas. Verificamos qualidade técnica (resolução, duração) e conteúdo (sem nudez, violência ou propaganda enganosa). Você recebe o resultado por email!', 
ARRAY['aprovação', 'análise', 'verificação', 'vídeo'], 24),

-- SUPORTE
('suporte', 'Preciso de ajuda, como falo com vocês?', 
'Você pode me perguntar aqui e vou tentar ajudar! Se precisar de atendimento humano, envie um email para contato@examidia.com.br ou chame no WhatsApp (11) 99999-9999. Respondemos em até 2 horas em horário comercial!', 
ARRAY['ajuda', 'suporte', 'contato', 'email', 'whatsapp', 'atendimento'], 30),

('suporte', 'Meu vídeo foi reprovado, o que faço?', 
'Não se preocupe! Você recebeu um email explicando o motivo. Geralmente é algo simples como duração incorreta ou resolução baixa. Ajuste o vídeo conforme as orientações e envie novamente. Se tiver dúvidas, me pergunte!', 
ARRAY['reprovado', 'rejeitado', 'recusado', 'vídeo'], 31),

-- BENEFÍCIOS SÍNDICOS
('sindico', 'Quais benefícios tenho como síndico?', 
'Os síndicos parceiros da EXA Mídia recebem benefícios exclusivos! Isso pode incluir manutenção das telas, conteúdo informativo para o condomínio, e participação nas receitas. Entre em contato para saber mais!', 
ARRAY['síndico', 'sindico', 'benefícios', 'parceiro', 'condomínio'], 40),

('sindico', 'Como funciona para condomínios?', 
'Instalamos painéis digitais nos elevadores do seu condomínio sem custo! Os moradores veem informações úteis e anúncios selecionados. O condomínio pode receber benefícios e o síndico tem acesso a um painel exclusivo!', 
ARRAY['condomínio', 'elevador', 'instalação', 'moradores'], 41);