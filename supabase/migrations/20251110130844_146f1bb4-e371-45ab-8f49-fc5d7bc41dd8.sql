-- Configurar REPLICA IDENTITY FULL para capturar dados completos em updates
-- Isso permite que as subscriptions realtime recebam todos os dados das mudanças

ALTER TABLE pedido_videos REPLICA IDENTITY FULL;
ALTER TABLE videos REPLICA IDENTITY FULL;
ALTER TABLE pedidos REPLICA IDENTITY FULL;