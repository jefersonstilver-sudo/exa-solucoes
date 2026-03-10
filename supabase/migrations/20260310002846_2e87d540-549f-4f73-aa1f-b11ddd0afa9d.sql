
-- Drop existing CHECK constraint and recreate with pago + pago_pendente_video
ALTER TABLE public.pedidos DROP CONSTRAINT IF EXISTS pedidos_status_check;

ALTER TABLE public.pedidos ADD CONSTRAINT pedidos_status_check CHECK (
  status IN (
    'pendente', 
    'aguardando_contrato', 
    'aguardando_video', 
    'video_enviado', 
    'video_aprovado', 
    'ativo', 
    'finalizado', 
    'cancelado', 
    'cancelado_automaticamente', 
    'bloqueado',
    'pago',
    'pago_pendente_video'
  )
);
