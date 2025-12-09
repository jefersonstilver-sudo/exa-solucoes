-- Atualização de preços dos 16 prédios ativos da loja pública
-- Valores da tabela PDF convertidos:
-- preco_trimestral = Pacote1_mensal × 3
-- preco_semestral = Pacote2_mensal × 6
-- preco_anual = Pacote3_mensal × 12

-- 1. Bella Vita (2 telas)
UPDATE buildings SET 
  preco_base = 189.00,
  preco_trimestral = 481.95,
  preco_semestral = 793.80,
  preco_anual = 1360.80
WHERE id = 'aefe8faa-28e0-4cfd-b1d6-2bb50733ae05';

-- 2. Condomínio Cheverny (1 tela)
UPDATE buildings SET 
  preco_base = 129.00,
  preco_trimestral = 328.95,
  preco_semestral = 541.80,
  preco_anual = 928.80
WHERE id = 'f5207451-fa43-4a38-8fac-f6e62c56ca6e';

-- 3. Edifício Luiz XV (1 tela)
UPDATE buildings SET 
  preco_base = 149.00,
  preco_trimestral = 379.95,
  preco_semestral = 625.80,
  preco_anual = 1072.80
WHERE id = '45c91604-a8b0-4ed4-a68f-fea085afa8d8';

-- 4. Edifício Provence (3 telas)
UPDATE buildings SET 
  preco_base = 254.00,
  preco_trimestral = 647.70,
  preco_semestral = 1066.80,
  preco_anual = 1828.80
WHERE id = 'a5e9d02c-54ee-468b-b3b3-4ce3f0dcc643';

-- 5. Foz Residence (1 tela)
UPDATE buildings SET 
  preco_base = 135.00,
  preco_trimestral = 344.25,
  preco_semestral = 567.00,
  preco_anual = 972.00
WHERE id = '6e3e0e94-28ca-40ad-bc79-bbe301a0400f';

-- 6. Las Brisas (1 tela)
UPDATE buildings SET 
  preco_base = 129.00,
  preco_trimestral = 328.95,
  preco_semestral = 541.80,
  preco_anual = 928.80
WHERE id = '2243a121-025d-45de-afaa-0eb9bcf3eb68';

-- 7. Pietro Angelo (1 tela)
UPDATE buildings SET 
  preco_base = 129.00,
  preco_trimestral = 328.95,
  preco_semestral = 541.80,
  preco_anual = 928.80
WHERE id = 'aaf0f51f-e81e-4135-a08d-3e5e4c4b822d';

-- 8. Residencial Esmeralda (2 telas)
UPDATE buildings SET 
  preco_base = 189.00,
  preco_trimestral = 481.95,
  preco_semestral = 793.80,
  preco_anual = 1360.80
WHERE id = '8f93399d-e23c-40df-b552-3effa351fb6d';

-- 9. Residencial Miró (1 tela)
UPDATE buildings SET 
  preco_base = 129.00,
  preco_trimestral = 328.95,
  preco_semestral = 541.80,
  preco_anual = 928.80
WHERE id = 'c739c371-77c3-455f-8222-0ac295227bbf';

-- 10. Residencial Vale do Monjolo (1 tela)
UPDATE buildings SET 
  preco_base = 129.00,
  preco_trimestral = 328.95,
  preco_semestral = 541.80,
  preco_anual = 928.80
WHERE id = 'd3ae18cc-078f-4584-86cb-94d0e86d245d';

-- 11. Rio Negro (2 telas)
UPDATE buildings SET 
  preco_base = 175.00,
  preco_trimestral = 446.25,
  preco_semestral = 735.00,
  preco_anual = 1260.00
WHERE id = 'e2192fc4-8bca-4f8a-b6c3-8573c24b1dfa';

-- 12. Royal Legacy (3 telas)
UPDATE buildings SET 
  preco_base = 275.00,
  preco_trimestral = 701.25,
  preco_semestral = 1155.00,
  preco_anual = 1980.00
WHERE id = '5af28df1-6625-4d48-8636-f3bba0d51489';

-- 13. Saint Peter (2 telas)
UPDATE buildings SET 
  preco_base = 155.00,
  preco_trimestral = 395.25,
  preco_semestral = 651.00,
  preco_anual = 1116.00
WHERE id = 'bc17603b-5013-406f-9da8-243f7aa2d737';

-- 14. Torre Azul (1 tela)
UPDATE buildings SET 
  preco_base = 129.00,
  preco_trimestral = 328.95,
  preco_semestral = 541.80,
  preco_anual = 928.80
WHERE id = '6d8d0f86-7ac4-438f-9f3b-dbc8263524ca';

-- 15. Viena (1 tela)
UPDATE buildings SET 
  preco_base = 129.00,
  preco_trimestral = 328.95,
  preco_semestral = 541.80,
  preco_anual = 928.80
WHERE id = 'd1634632-0a80-4513-9001-a07ff7a9737e';

-- 16. Vila Appia (1 tela)
UPDATE buildings SET 
  preco_base = 129.00,
  preco_trimestral = 328.95,
  preco_semestral = 541.80,
  preco_anual = 928.80
WHERE id = '0077c002-fdd5-430a-8794-bedd66ff526a';