-- EXA · segurança lote C (02/11/2026, aplicado no banco): mídias do WhatsApp/CRM (chat-media, contact-attachments,
-- voice-recordings) só para a equipe pela API (listar, baixar, enviar, apagar). Links públicos dos arquivos continuam funcionando.
-- Backup das políticas anteriores em public.seg_backup_20261102 (tipo = 'storage_policy').
do $$ declare p record; c text; begin
  for p in select policyname nome, cmd, coalesce(qual, with_check) cond from pg_policies
    where schemaname='storage' and tablename='objects'
      and coalesce(qual, with_check, '') ~ '^\(?bucket_id = ''(chat-media|contact-attachments|voice-recordings)''::text\)?$'
  loop
    c := p.cond || ' AND public.exa_eh_equipe()';
    if p.cmd = 'INSERT' then execute format('alter policy %I on storage.objects with check (%s)', p.nome, c);
    elsif p.cmd in ('SELECT','DELETE') then execute format('alter policy %I on storage.objects using (%s)', p.nome, c);
    else execute format('alter policy %I on storage.objects using (%s) with check (%s)', p.nome, c, c); end if;
  end loop;
end $$;
