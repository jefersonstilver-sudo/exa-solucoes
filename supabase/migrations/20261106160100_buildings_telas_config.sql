-- 06/11/2026: o prédio manda na configuração das suas telas (câmeras, avisos, layout em pé / deitada).
-- Cada tela pode ter exceção em exa_telas.config (cameras / avisos / layout_proprio / ritmo). Orientação e giro ficam na tela.
alter table public.buildings add column if not exists telas_config jsonb not null default '{}'::jsonb;
comment on column public.buildings.telas_config is 'Configuração das telas do prédio: { cameras: {ids, segundos}, avisos: bool, layout_v, layout_h }. Exceções por tela em exa_telas.config.';

-- LOCAL DE TESTE NOVO: vira a configuração do prédio (só a câmera de teste ao vivo, sem avisos, réplica em pé)
update public.buildings
   set telas_config = '{"cameras":{"ids":["https://lan.exa.local/192.168.1.28/8888/tapo/index.m3u8"],"segundos":null},"avisos":false,"layout_v":"R"}'::jsonb
 where id = '969f12ca-32da-4e3d-8afd-6d9a89b9d30b';
update public.exa_telas
   set config = config - 'cameras' - 'avisos' - 'layout_proprio'
 where building_id = '969f12ca-32da-4e3d-8afd-6d9a89b9d30b';
