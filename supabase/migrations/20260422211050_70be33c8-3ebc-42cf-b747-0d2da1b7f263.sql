-- 1. Adicionar coluna de silenciamento por grupo
ALTER TABLE public.device_groups
ADD COLUMN IF NOT EXISTS silenciar_alertas boolean NOT NULL DEFAULT false;

-- 2. Criar grupo "NUCS PRONTOS" silenciado (se não existir)
INSERT INTO public.device_groups (nome, cor, ordem, silenciar_alertas)
SELECT 'NUCS PRONTOS', '#F59E0B', 
  COALESCE((SELECT MAX(ordem) + 1 FROM public.device_groups), 0),
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.device_groups WHERE nome = 'NUCS PRONTOS'
);

-- 3. Mover painéis órfãos (sem prédio E sem grupo) para NUCS PRONTOS
UPDATE public.devices
SET device_group_id = (SELECT id FROM public.device_groups WHERE nome = 'NUCS PRONTOS' LIMIT 1)
WHERE building_id IS NULL AND device_group_id IS NULL;