DO $$
BEGIN
  BEGIN
    INSERT INTO public.nando_mensagens (id, telefone, papel, conteudo)
    OVERRIDING SYSTEM VALUE
    VALUES (-790851028, 'nando_history_regression', 'humano', '{"texto":"Verificação transacional de histórico manual","autor":"Equipe EXA"}'::jsonb);

    IF NOT EXISTS (
      SELECT 1 FROM public.nando_mensagens
      WHERE id = -790851028 AND telefone = 'nando_history_regression'
        AND papel = 'humano'
        AND conteudo->>'texto' = 'Verificação transacional de histórico manual'
        AND conteudo->>'autor' = 'Equipe EXA'
    ) THEN
      RAISE EXCEPTION 'Mensagem manual não pôde ser relida no histórico';
    END IF;
    RAISE EXCEPTION USING ERRCODE = 'ZX001', MESSAGE = 'rollback da verificação concluída';
  EXCEPTION WHEN SQLSTATE 'ZX001' THEN
    NULL;
  END;

  IF EXISTS (SELECT 1 FROM public.nando_mensagens WHERE id = -790851028) THEN
    RAISE EXCEPTION 'A verificação não pode deixar mensagens no histórico';
  END IF;
END $$;