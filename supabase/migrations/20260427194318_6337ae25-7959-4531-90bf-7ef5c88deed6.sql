-- 1. Adicionar colunas de WhatsApp ao profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS whatsapp text,
  ADD COLUMN IF NOT EXISTS whatsapp_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS whatsapp_verification_required boolean NOT NULL DEFAULT true;

-- 2. Índice único parcial para evitar WhatsApps duplicados
CREATE UNIQUE INDEX IF NOT EXISTS profiles_whatsapp_unique_idx
  ON public.profiles(whatsapp) WHERE whatsapp IS NOT NULL;

-- 3. Higienização dos role_types existentes (TRIM)
UPDATE public.role_types
SET key = TRIM(key),
    display_name = TRIM(display_name)
WHERE key <> TRIM(key) OR display_name <> TRIM(display_name);

-- 4. Trigger para impedir espaços extras em key/display_name de role_types
CREATE OR REPLACE FUNCTION public.trim_role_types_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.key := TRIM(NEW.key);
  NEW.display_name := TRIM(NEW.display_name);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trim_role_types_fields_trigger ON public.role_types;
CREATE TRIGGER trim_role_types_fields_trigger
  BEFORE INSERT OR UPDATE ON public.role_types
  FOR EACH ROW
  EXECUTE FUNCTION public.trim_role_types_fields();