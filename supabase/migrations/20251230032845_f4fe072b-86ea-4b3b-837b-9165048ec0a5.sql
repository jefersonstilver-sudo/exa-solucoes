-- Desconectar todos os devices dos prédios para permitir reatribuição manual via página Painéis
UPDATE devices SET building_id = NULL WHERE is_active = true;