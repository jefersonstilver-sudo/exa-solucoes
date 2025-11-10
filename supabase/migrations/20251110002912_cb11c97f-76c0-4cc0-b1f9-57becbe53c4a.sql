-- Enable realtime for pedido_videos and pedidos tables
-- This allows automatic updates when video display status changes

-- Enable realtime for pedido_videos table
ALTER TABLE public.pedido_videos REPLICA IDENTITY FULL;

-- Enable realtime for pedidos table
ALTER TABLE public.pedidos REPLICA IDENTITY FULL;

-- Add tables to realtime publication (if not already added)
DO $$
BEGIN
  -- Add pedido_videos to realtime publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'pedido_videos'
    AND schemaname = 'public'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pedido_videos;
  END IF;

  -- Add pedidos to realtime publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'pedidos'
    AND schemaname = 'public'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pedidos;
  END IF;
END $$;

-- Log migration
INSERT INTO public.log_eventos_sistema (tipo_evento, descricao)
VALUES ('MIGRATION', 'Habilitado realtime para pedido_videos e pedidos - atualizações automáticas de contagem de vídeos');