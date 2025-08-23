-- Update status check constraint to allow 'bloqueado'
ALTER TABLE public.pedidos DROP CONSTRAINT IF EXISTS pedidos_status_check;

ALTER TABLE public.pedidos
ADD CONSTRAINT pedidos_status_check
CHECK (
  status = ANY (
    ARRAY[
      'pendente'::text,
      'pago'::text,
      'pago_pendente_video'::text,
      'video_enviado'::text,
      'video_aprovado'::text,
      'video_rejeitado'::text,
      'ativo'::text,
      'cancelado'::text,
      'cancelado_automaticamente'::text,
      'expirado'::text,
      'tentativa'::text,
      'bloqueado'::text
    ]
  )
);
