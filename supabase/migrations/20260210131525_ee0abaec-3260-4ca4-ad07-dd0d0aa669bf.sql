-- Atualizar constraint de scale_factor para permitir até 4.0
ALTER TABLE public.logos DROP CONSTRAINT logos_scale_factor_check;
ALTER TABLE public.logos ADD CONSTRAINT logos_scale_factor_check CHECK (scale_factor >= 0.5 AND scale_factor <= 4.0);

-- Também atualizar color_variant para incluir 'colored'
ALTER TABLE public.logos DROP CONSTRAINT logos_color_variant_check;
ALTER TABLE public.logos ADD CONSTRAINT logos_color_variant_check CHECK (color_variant = ANY (ARRAY['white'::text, 'dark'::text, 'colored'::text]));