
-- Atualizar vídeos existentes com nomes aleatórios descritivos
UPDATE videos 
SET nome = CASE 
  WHEN id = (SELECT id FROM videos ORDER BY created_at LIMIT 1 OFFSET 0) THEN 'Promoção Black Friday 2024'
  WHEN id = (SELECT id FROM videos ORDER BY created_at LIMIT 1 OFFSET 1) THEN 'Lançamento Produto Verão'
  WHEN id = (SELECT id FROM videos ORDER BY created_at LIMIT 1 OFFSET 2) THEN 'Campanha Natal Especial'
  WHEN id = (SELECT id FROM videos ORDER BY created_at LIMIT 1 OFFSET 3) THEN 'Oferta Limitada 50% OFF'
  WHEN id = (SELECT id FROM videos ORDER BY created_at LIMIT 1 OFFSET 4) THEN 'Inauguração Nova Loja'
  WHEN id = (SELECT id FROM videos ORDER BY created_at LIMIT 1 OFFSET 5) THEN 'Vídeo Institucional Empresa'
  WHEN id = (SELECT id FROM videos ORDER BY created_at LIMIT 1 OFFSET 6) THEN 'Promoção Dia das Mães'
  WHEN id = (SELECT id FROM videos ORDER BY created_at LIMIT 1 OFFSET 7) THEN 'Liquidação Final de Estoque'
  WHEN id = (SELECT id FROM videos ORDER BY created_at LIMIT 1 OFFSET 8) THEN 'Novo Serviço Premium'
  WHEN id = (SELECT id FROM videos ORDER BY created_at LIMIT 1 OFFSET 9) THEN 'Evento Exclusivo VIP'
  WHEN id = (SELECT id FROM videos ORDER BY created_at LIMIT 1 OFFSET 10) THEN 'Campanha Volta às Aulas'
  WHEN id = (SELECT id FROM videos ORDER BY created_at LIMIT 1 OFFSET 11) THEN 'Promoção Dia dos Pais'
  WHEN id = (SELECT id FROM videos ORDER BY created_at LIMIT 1 OFFSET 12) THEN 'Lançamento Coleção Inverno'
  WHEN id = (SELECT id FROM videos ORDER BY created_at LIMIT 1 OFFSET 13) THEN 'Mega Liquidação Aniversário'
  WHEN id = (SELECT id FROM videos ORDER BY created_at LIMIT 1 OFFSET 14) THEN 'Campanha Sustentabilidade'
  ELSE CONCAT('Vídeo Promocional ', EXTRACT(epoch FROM created_at)::text)
END
WHERE nome IS NULL OR nome = '' OR nome LIKE '%untitled%' OR nome LIKE '%video%' OR LENGTH(nome) < 5;

-- Também atualizar vídeos que tenham nomes muito genéricos
UPDATE videos 
SET nome = CONCAT('Campanha Especial ', TO_CHAR(created_at, 'DD/MM'))
WHERE nome IN ('Video', 'video', 'Untitled', 'untitled', 'test', 'Test');
