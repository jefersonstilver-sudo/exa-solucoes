
-- Consolidar pedidos antigos com prédios atuais do sistema

-- 1. Atualizar pedido com 7 prédios (1a8a5b01-8831-4017-809e-dd64c312d1a7)
UPDATE pedidos
SET 
  lista_predios = ARRAY[
    'c739c371-77c3-455f-8222-0ac295227bbf',
    'aaf0f51f-e81e-4135-a08d-3e5e4c4b822d',
    'd38547e3-1758-4487-8241-b2d636ba4a9f',
    'f02caef6-6c17-4e7d-be9b-368c01367ed6',
    'c4ad850c-0c7b-43cf-9fa8-c2d989224ee8',
    '45c91604-a8b0-4ed4-a68f-fea085afa8d8',
    'e2192fc4-8bca-4f8a-b6c3-8573c24b1dfa'
  ]::text[],
  lista_paineis = ARRAY[
    'c739c371-77c3-455f-8222-0ac295227bbf',
    'aaf0f51f-e81e-4135-a08d-3e5e4c4b822d',
    'd38547e3-1758-4487-8241-b2d636ba4a9f',
    'f02caef6-6c17-4e7d-be9b-368c01367ed6',
    'c4ad850c-0c7b-43cf-9fa8-c2d989224ee8',
    '45c91604-a8b0-4ed4-a68f-fea085afa8d8',
    'e2192fc4-8bca-4f8a-b6c3-8573c24b1dfa'
  ]::text[]
WHERE id = '1a8a5b01-8831-4017-809e-dd64c312d1a7';

-- 2. Atualizar pedidos com 2 prédios
UPDATE pedidos
SET 
  lista_predios = ARRAY[
    'c739c371-77c3-455f-8222-0ac295227bbf',
    'aaf0f51f-e81e-4135-a08d-3e5e4c4b822d'
  ]::text[],
  lista_paineis = ARRAY[
    'c739c371-77c3-455f-8222-0ac295227bbf',
    'aaf0f51f-e81e-4135-a08d-3e5e4c4b822d'
  ]::text[]
WHERE id IN (
  'e98ad003-69c2-42cd-9c6b-15ddc4d4dd0b',
  '076867ac-b669-48e0-a8af-cc590a015803',
  'cbbcecf3-cb0d-4677-8afb-1e9980743721'
);

-- 3. Atualizar pedidos com 1 prédio
UPDATE pedidos
SET 
  lista_predios = ARRAY['c739c371-77c3-455f-8222-0ac295227bbf']::text[],
  lista_paineis = ARRAY['c739c371-77c3-455f-8222-0ac295227bbf']::text[]
WHERE id IN (
  'ce38909b-2569-4eb9-b4c8-829821a885df',
  '5849ff91-bfac-4822-a556-b339db37a0fa',
  '12b243b5-d99e-461c-b1dd-090ab67f9fe7',
  '8d885919-03b8-4e75-a4b5-37ede65b2751',
  '4efd2a1d-4c09-406e-a768-ce0aa919407b',
  'baa57756-a26d-457e-970c-7ca7f749e94f',
  '8fdb996e-734d-40c4-8c44-27cc09614fb5',
  'e97dd6db-74f9-4561-93d1-8f3eba12beba',
  'daa42325-705e-4e6a-897d-f99323a297a6',
  'b90e00be-1e06-4e96-802f-8d128fcb43e2'
);

-- 4. Atualizar pedidos com 5 prédios
UPDATE pedidos
SET 
  lista_predios = ARRAY[
    'c739c371-77c3-455f-8222-0ac295227bbf',
    'aaf0f51f-e81e-4135-a08d-3e5e4c4b822d',
    'd38547e3-1758-4487-8241-b2d636ba4a9f',
    'f02caef6-6c17-4e7d-be9b-368c01367ed6',
    'c4ad850c-0c7b-43cf-9fa8-c2d989224ee8'
  ]::text[],
  lista_paineis = ARRAY[
    'c739c371-77c3-455f-8222-0ac295227bbf',
    'aaf0f51f-e81e-4135-a08d-3e5e4c4b822d',
    'd38547e3-1758-4487-8241-b2d636ba4a9f',
    'f02caef6-6c17-4e7d-be9b-368c01367ed6',
    'c4ad850c-0c7b-43cf-9fa8-c2d989224ee8'
  ]::text[]
WHERE id IN (
  'deeebccb-4be3-41cc-8e2f-fa89d151d726',
  'df6ac482-32fb-4a3d-946c-6b8f1546392d'
);

-- 5. Atualizar pedido com 8 prédios
UPDATE pedidos
SET 
  lista_predios = ARRAY[
    'c739c371-77c3-455f-8222-0ac295227bbf',
    'aaf0f51f-e81e-4135-a08d-3e5e4c4b822d',
    'd38547e3-1758-4487-8241-b2d636ba4a9f',
    'f02caef6-6c17-4e7d-be9b-368c01367ed6',
    'c4ad850c-0c7b-43cf-9fa8-c2d989224ee8',
    '45c91604-a8b0-4ed4-a68f-fea085afa8d8',
    'e2192fc4-8bca-4f8a-b6c3-8573c24b1dfa',
    '6d8d0f86-7ac4-438f-9f3b-dbc8263524ca'
  ]::text[],
  lista_paineis = ARRAY[
    'c739c371-77c3-455f-8222-0ac295227bbf',
    'aaf0f51f-e81e-4135-a08d-3e5e4c4b822d',
    'd38547e3-1758-4487-8241-b2d636ba4a9f',
    'f02caef6-6c17-4e7d-be9b-368c01367ed6',
    'c4ad850c-0c7b-43cf-9fa8-c2d989224ee8',
    '45c91604-a8b0-4ed4-a68f-fea085afa8d8',
    'e2192fc4-8bca-4f8a-b6c3-8573c24b1dfa',
    '6d8d0f86-7ac4-438f-9f3b-dbc8263524ca'
  ]::text[]
WHERE id = '8751045d-03a8-43db-9790-fe1081e42f42';

COMMENT ON TABLE pedidos IS 'Consolidação concluída: todos os pedidos agora referenciam prédios válidos do sistema atual';
