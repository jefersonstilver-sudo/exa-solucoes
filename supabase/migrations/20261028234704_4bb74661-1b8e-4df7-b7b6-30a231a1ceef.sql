ALTER TABLE public.nando_mensagens DROP CONSTRAINT nando_mensagens_papel_check;
ALTER TABLE public.nando_mensagens ADD CONSTRAINT nando_mensagens_papel_check CHECK (papel IN ('sindico', 'nando', 'sistema', 'humano'));

DO $$
DECLARE
  allowed_definition text;
BEGIN
  SELECT pg_get_constraintdef(oid) INTO allowed_definition
  FROM pg_constraint
  WHERE conrelid = 'public.nando_mensagens'::regclass AND conname = 'nando_mensagens_papel_check';
  IF allowed_definition IS NULL OR position('humano' IN allowed_definition) = 0 THEN
    RAISE EXCEPTION 'O histórico deve aceitar mensagens manuais da equipe EXA (humano)';
  END IF;
END $$;