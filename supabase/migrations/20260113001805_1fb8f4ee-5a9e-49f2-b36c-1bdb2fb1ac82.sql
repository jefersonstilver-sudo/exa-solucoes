-- Adicionar status 'aguardando_contrato' e 'aguardando_video' à constraint de pedidos
-- Necessário para o fluxo Opção B (Aceite → Pagamento → Assinatura)

ALTER TABLE public.pedidos 
DROP CONSTRAINT pedidos_status_check;

ALTER TABLE public.pedidos 
ADD CONSTRAINT pedidos_status_check CHECK (
  status = ANY (ARRAY[
    'pendente'::text, 
    'pago'::text, 
    'pago_pendente_video'::text, 
    'aguardando_contrato'::text,
    'aguardando_video'::text,
    'video_enviado'::text, 
    'video_aprovado'::text, 
    'video_rejeitado'::text, 
    'ativo'::text, 
    'cancelado'::text, 
    'cancelado_automaticamente'::text, 
    'expirado'::text, 
    'tentativa'::text, 
    'bloqueado'::text
  ])
);