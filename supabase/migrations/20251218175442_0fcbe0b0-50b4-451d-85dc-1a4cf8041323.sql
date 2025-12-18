-- Atualizar quantidade_telas e visualizacoes_mes dos prédios com dados zerados

-- Condomínio Cheverny: 1 tela
UPDATE buildings 
SET quantidade_telas = 1, visualizacoes_mes = 11610
WHERE id = 'f5207451-fa43-4a38-8fac-f6e62c56ca6e';

-- Edificio Barcelona: 1 tela
UPDATE buildings 
SET quantidade_telas = 1, visualizacoes_mes = 11610
WHERE id = '9073a48a-1f38-4285-b240-44335a42dbe1';

-- Residencial Esmeralda: 2 telas
UPDATE buildings 
SET quantidade_telas = 2, visualizacoes_mes = 23220
WHERE id = '8f93399d-e23c-40df-b552-3effa351fb6d';

-- Residencial Vale do Monjolo: 1 tela
UPDATE buildings 
SET quantidade_telas = 1, visualizacoes_mes = 11610
WHERE id = 'd3ae18cc-078f-4584-86cb-94d0e86d245d';