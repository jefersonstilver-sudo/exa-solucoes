-- Adicionar campo para URL do vídeo da homepage
ALTER TABLE public.configuracoes_sindico 
ADD COLUMN IF NOT EXISTS video_homepage_url TEXT;